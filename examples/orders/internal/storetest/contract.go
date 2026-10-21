// Package storetest checks the same application contract against both stores.
package storetest

import (
	"context"
	"errors"
	"sync"
	"testing"

	"example.com/orders/internal/order"
)

func Run(t *testing.T, store order.Store) {
	t.Helper()
	ctx := context.Background()
	service := order.New(store)
	o, err := service.Create(ctx, order.CreateInput{SKU: "tea", Quantity: 1})
	if err != nil {
		t.Fatal(err)
	}
	t.Run("duplicate", func(t *testing.T) {
		if err := store.Create(ctx, o); err == nil {
			t.Fatal("duplicate ID was accepted")
		}
	})
	t.Run("rollback", func(t *testing.T) {
		rejected := errors.New("rejected change")
		_, err := store.UpdateStatus(ctx, o.ID, func(string) (string, error) {
			return order.Cancelled, rejected
		})
		if !errors.Is(err, rejected) {
			t.Fatalf("error = %v", err)
		}
		got, err := store.Get(ctx, o.ID)
		if err != nil || got != o {
			t.Fatalf("failed update modified order: %+v, %v", got, err)
		}
	})
	t.Run("cancelled_context", func(t *testing.T) {
		cancelled, cancel := context.WithCancel(ctx)
		cancel()
		if _, err := service.Get(cancelled, o.ID); !errors.Is(err, context.Canceled) {
			t.Fatalf("error = %v", err)
		}
	})
	t.Run("concurrent_cancel", func(t *testing.T) {
		var wg sync.WaitGroup
		for range 20 {
			wg.Go(func() {
				got, err := service.Cancel(ctx, o.ID)
				if err != nil || got.Status != order.Cancelled {
					t.Errorf("cancel = %+v, %v", got, err)
				}
			})
		}
		wg.Wait()
	})
	t.Run("not_found", func(t *testing.T) {
		if _, err := service.Get(ctx, "missing"); !errors.Is(err, order.ErrNotFound) {
			t.Fatalf("error = %v", err)
		}
	})
}
