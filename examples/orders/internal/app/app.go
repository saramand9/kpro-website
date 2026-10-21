// Package app is the composition root: it wires existing parts together.
package app

import (
	"context"
	"errors"
	"log"
	"time"

	"example.com/orders/internal/httpapi"
	"example.com/orders/internal/messageapi"
	"example.com/orders/internal/order"
	"github.com/saramand9/kpro/codec"
	"github.com/saramand9/kpro/core"
	"github.com/saramand9/kpro/middleware"
	"github.com/saramand9/kpro/server"
	"github.com/saramand9/kpro/transport/httpx"
	"github.com/saramand9/kpro/transport/tcp"
)

type Config struct {
	HTTPAddr string
	TCPAddr  string // Empty disables TCP.
}

func New(cfg Config, store order.Store, ready func(context.Context) error) (*server.Server, error) {
	runtime, err := server.NewChecked(server.Config{
		Name: "orders", ShutdownTimeout: 5 * time.Second,
		Router: core.RouterConfig{
			SyncQueueSize: 16, MaxInflightPerSession: 16,
			MaxInflight: 256, AsyncWorkers: 4, AsyncQueueSize: 64,
		},
	})
	if err != nil {
		return nil, err
	}
	runtime.Use(middleware.Recover())
	orders := order.New(store) // One instance shared by both entry points.
	httpEndpoint, err := server.MountNativeChecked(runtime, httpx.New(httpx.Config{
		Addr: cfg.HTTPAddr, MaxBodyBytes: 4 << 10,
		ReadHeaderTimeout: 3 * time.Second, ReadTimeout: 5 * time.Second,
		WriteTimeout: 5 * time.Second, IdleTimeout: 30 * time.Second,
		ShutdownTimeout: 5 * time.Second,
	}))
	if err != nil {
		return nil, err
	}
	httpapi.Register(httpEndpoint, orders, ready)
	if cfg.TCPAddr != "" {
		messageEndpoint, err := runtime.MountChecked(tcp.New(tcp.Config{
			Addr: cfg.TCPAddr, Codec: codec.KProV1(),
			MaxFrameSize: 4 << 10, MaxConnections: 64,
			SendQueueSize: 16, MaxPendingBytes: 64 << 10,
			ReadTimeout: 30 * time.Second, WriteTimeout: 3 * time.Second,
		}))
		if err != nil {
			return nil, err
		}
		if err := messageapi.Register(messageEndpoint, orders); err != nil {
			return nil, err
		}
	}
	return runtime, nil
}

func Run(parent context.Context, runtime *server.Server) error {
	ctx, stop := context.WithCancel(parent)
	defer stop()
	handle, err := runtime.Start(ctx)
	if err != nil {
		return err
	}
	readyCtx, cancelReady := context.WithTimeout(ctx, 5*time.Second)
	err = handle.WaitReady(readyCtx)
	cancelReady()
	if err != nil {
		stop()
		waitErr := handle.Wait() // Join shutdown before the caller closes the DB.
		if server.IsContextTermination(waitErr) {
			waitErr = nil
		}
		return errors.Join(err, waitErr)
	}
	log.Print("listeners ready")
	err = handle.Wait()
	if parent.Err() != nil && server.IsContextTermination(err) {
		return nil
	}
	return err
}
