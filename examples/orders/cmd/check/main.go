// check exercises a running LOCAL teaching server. It creates and cancels an
// order; do not point it at a production service.
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"example.com/orders/internal/order"
)

func main() {
	base := flag.String("base", "http://127.0.0.1:8080", "local teaching server URL")
	flag.Parse()
	if err := run(*base); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(base string) error {
	client := &http.Client{Timeout: 3 * time.Second}
	defer client.CloseIdleConnections()
	call := func(method, path, body string, want int) ([]byte, error) {
		req, err := http.NewRequest(method, base+path, bytes.NewBufferString(body))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		data, err := io.ReadAll(io.LimitReader(resp.Body, 8192))
		if err != nil {
			return nil, err
		}
		fmt.Printf("%s %s -> %d\n%s\n", method, path, resp.StatusCode, data)
		if resp.StatusCode != want {
			return nil, fmt.Errorf("expected status %d, got %d", want, resp.StatusCode)
		}
		return data, nil
	}
	if _, err := call("GET", "/readyz", "", 200); err != nil {
		return err
	}
	body, err := call("POST", "/orders", `{"sku":"coffee","quantity":2}`, 201)
	if err != nil {
		return err
	}
	var created order.Order
	if err := json.Unmarshal(body, &created); err != nil {
		return err
	}
	for _, step := range []struct {
		method, path, body string
		status             int
	}{
		{"GET", "/orders/" + created.ID, "", 200},
		{"POST", "/orders", `{"sku":"coffee","quantity":0}`, 422},
		{"POST", "/orders/" + created.ID + "/cancel", "", 200},
		{"POST", "/orders/" + created.ID + "/cancel", "", 200},
	} {
		if _, err := call(step.method, step.path, step.body, step.status); err != nil {
			return err
		}
	}
	fmt.Printf("Order ID for the persistence / TCP exercise: %s\n", created.ID)
	return nil
}
