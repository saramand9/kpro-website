package sqlite_test

import (
	"context"
	"fmt"
	"path/filepath"
	"testing"
	"time"

	"example.com/orders/internal/order"
	"example.com/orders/internal/sqlite"
	"example.com/orders/internal/storetest"
)

func TestStoreContract(t *testing.T) {
	db, err := sqlite.Open(context.Background(), filepath.Join(t.TempDir(), "orders.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	storetest.Run(t, db)
}

func TestPersistsAfterReopen(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "orders.db")
	db, err := sqlite.Open(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	service := order.New(db)
	created, err := service.Create(ctx, order.CreateInput{SKU: "coffee", Quantity: 2})
	if err != nil {
		_ = db.Close()
		t.Fatal(err)
	}
	cancelled, err := service.Cancel(ctx, created.ID)
	if err != nil {
		_ = db.Close()
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}
	reopened, err := sqlite.Open(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	got, err := order.New(reopened).Get(ctx, created.ID)
	if err != nil || got != cancelled {
		t.Fatalf("reopened order = %+v, %v; want %+v", got, err, cancelled)
	}
}

// Bypass Service deliberately: the schema also rejects an invalid new row.
func TestQuantityConstraint(t *testing.T) {
	ctx := context.Background()
	db, err := sqlite.Open(ctx, filepath.Join(t.TempDir(), "bounds.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	for _, tc := range []struct {
		quantity int
		accepted bool
	}{{0, false}, {1, true}, {20, true}, {21, false}} {
		o := order.Order{
			ID: fmt.Sprintf("quantity-%d", tc.quantity), SKU: "coffee", Quantity: tc.quantity,
			Status: order.Pending, CreatedAt: time.Now().UTC(),
		}
		err := db.Create(ctx, o)
		if (err == nil) != tc.accepted {
			t.Errorf("quantity %d: error %v; accepted=%v", tc.quantity, err, tc.accepted)
		}
	}
}
