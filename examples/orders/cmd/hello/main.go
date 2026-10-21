// This is the first runnable checkpoint: one file, one HTTP route, no database.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/saramand9/kpro/server"
	"github.com/saramand9/kpro/transport/httpx"
)

func run() error {
	app, err := server.NewChecked(server.Config{Name: "hello", ShutdownTimeout: 5 * time.Second})
	if err != nil {
		return err
	}
	endpoint, err := server.MountNativeChecked(app, httpx.New(httpx.Config{Addr: "127.0.0.1:8080"}))
	if err != nil {
		return err
	}
	endpoint.Get("/hello", func(c *httpx.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "hello KPro"})
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(signals)
	go func() {
		select {
		case <-signals:
			cancel()
		case <-ctx.Done():
		}
	}()
	err = app.Run(ctx)
	if ctx.Err() != nil && server.IsContextTermination(err) {
		return nil
	}
	return err
}

func main() {
	if err := run(); err != nil {
		log.Print(err)
		os.Exit(1)
	}
}
