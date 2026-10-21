package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"example.com/orders/internal/app"
	"example.com/orders/internal/memory"
	"example.com/orders/internal/order"
	"example.com/orders/internal/sqlite"
)

func main() {
	if err := run(); err != nil {
		log.Print(err)
		os.Exit(1) // run's deferred cleanup has already completed.
	}
	log.Print("service stopped")
}

func run() error {
	httpAddr := flag.String("http", "127.0.0.1:8080", "HTTP listen address")
	tcpAddr := flag.String("tcp", "", "optional TCP listen address")
	dbPath := flag.String("db", "orders.db", "SQLite file path")
	inMemory := flag.Bool("memory", false, "use temporary memory store")
	flag.Parse()

	var store order.Store
	var ready func(context.Context) error
	if *inMemory {
		m := memory.New()
		store, ready = m, m.Ping
	} else {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		db, err := sqlite.Open(ctx, *dbPath)
		cancel()
		if err != nil {
			return err
		}
		defer db.Close()
		store, ready = db, db.Ping
	}
	runtime, err := app.New(app.Config{HTTPAddr: *httpAddr, TCPAddr: *tcpAddr}, store, ready)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(signals)
	// Translate process signals to ordinary cancellation. Go 1.26's
	// NotifyContext attaches a signal-specific Cause instead.
	go func() {
		select {
		case <-signals:
			cancel()
		case <-ctx.Done():
		}
	}()
	return app.Run(ctx, runtime)
}
