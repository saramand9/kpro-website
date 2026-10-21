package app_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"strings"
	"testing"
	"time"

	"example.com/orders/internal/app"
	"example.com/orders/internal/memory"
	"example.com/orders/internal/order"
	"example.com/orders/internal/tcpclient"
	"github.com/saramand9/kpro/server"
)

func freeAddress(t *testing.T) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := listener.Addr().String()
	if err := listener.Close(); err != nil {
		t.Fatal(err)
	}
	return addr
}

func TestHTTPAndTCPShareOrders(t *testing.T) {
	httpAddr, tcpAddr := freeAddress(t), freeAddress(t)
	store := memory.New()
	runtime, err := app.New(app.Config{HTTPAddr: httpAddr, TCPAddr: tcpAddr}, store, store.Ping)
	if err != nil {
		t.Fatal(err)
	}
	ctx, stop := context.WithCancel(context.Background())
	handle, err := runtime.Start(ctx)
	if err != nil {
		stop()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		stop()
		select {
		case <-handle.Done():
			if err := handle.Wait(); err != nil && !server.IsContextTermination(err) {
				t.Errorf("shutdown: %v", err)
			}
		case <-time.After(7 * time.Second):
			t.Error("shutdown did not finish within budget")
		}
	})
	readyCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	if err := handle.WaitReady(readyCtx); err != nil {
		t.Fatal(err)
	}
	client := &http.Client{Timeout: 3 * time.Second}
	defer client.CloseIdleConnections()
	resp, err := client.Post("http://"+httpAddr+"/orders", "application/json", bytes.NewBufferString(`{"sku":"coffee","quantity":2}`))
	if err != nil {
		t.Fatal(err)
	}
	var created order.Order
	err = json.NewDecoder(resp.Body).Decode(&created)
	resp.Body.Close()
	if err != nil || resp.StatusCode != 201 {
		t.Fatalf("create: status %d error %v", resp.StatusCode, err)
	}
	got, err := tcpclient.Get(tcpAddr, created.ID)
	if err != nil || got != created {
		t.Fatalf("TCP = %+v, %v; HTTP = %+v", got, err, created)
	}
	cancelResp, err := client.Post("http://"+httpAddr+"/orders/"+created.ID+"/cancel", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = io.Copy(io.Discard, cancelResp.Body)
	cancelResp.Body.Close()
	if cancelResp.StatusCode != 200 {
		t.Fatalf("cancel: %d", cancelResp.StatusCode)
	}
	got, err = tcpclient.Get(tcpAddr, created.ID)
	if err != nil || got.Status != order.Cancelled {
		t.Fatalf("TCP stale after HTTP cancel: %+v, %v", got, err)
	}
	if _, err := tcpclient.Get(tcpAddr, "missing"); err == nil || !strings.Contains(err.Error(), "order_not_found") {
		t.Fatalf("missing TCP order: %v", err)
	}
	stop()
	select {
	case <-handle.Done():
	case <-time.After(7 * time.Second):
		t.Fatal("server did not stop")
	}
	if runtime.State() != server.StateStopped {
		t.Fatalf("state after shutdown: %v", runtime.State())
	}
}

func TestRunRejectsOccupiedPort(t *testing.T) {
	occupied, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = occupied.Close() })
	store := memory.New()
	runtime, err := app.New(app.Config{HTTPAddr: occupied.Addr().String()}, store, store.Ping)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := app.Run(ctx, runtime); err == nil || server.IsContextTermination(err) {
		t.Fatalf("occupied port should fail startup, got %v", err)
	}
	if runtime.State() != server.StateStopped {
		t.Fatalf("failed startup left runtime in %v", runtime.State())
	}
}
