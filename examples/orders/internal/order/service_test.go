package order_test

import (
	"context"
	"errors"
	"strings"
	"testing"

	"example.com/orders/internal/memory"
	"example.com/orders/internal/order"
)

func TestCreate(t *testing.T) {
	service := order.New(memory.New())
	o, err := service.Create(context.Background(), order.CreateInput{SKU: " coffee ", Quantity: 2})
	if err != nil {
		t.Fatal(err)
	}
	if o.ID == "" || o.SKU != "coffee" || o.Quantity != 2 || o.Status != order.Pending || o.CreatedAt.IsZero() {
		t.Fatalf("unexpected order: %+v", o)
	}
	got, err := service.Get(context.Background(), o.ID)
	if err != nil || got != o {
		t.Fatalf("saved order = %+v, %v; want %+v", got, err, o)
	}
}

func TestRejectInvalidOrder(t *testing.T) {
	inputs := []order.CreateInput{
		{SKU: "", Quantity: 1},
		{SKU: "   ", Quantity: 1},
		{SKU: strings.Repeat("字", 65), Quantity: 1},
		{SKU: "coffee", Quantity: -1},
		{SKU: "coffee", Quantity: 0},
		{SKU: "coffee", Quantity: 21},
	}
	for _, input := range inputs {
		if _, err := order.New(memory.New()).Create(context.Background(), input); !errors.Is(err, order.ErrInvalid) {
			t.Errorf("Create(%+v) = %v; want ErrInvalid", input, err)
		}
	}
}

func TestQuantityBoundary(t *testing.T) {
	service := order.New(memory.New())
	for _, qty := range []int{1, 20} {
		if _, err := service.Create(context.Background(), order.CreateInput{SKU: "coffee", Quantity: qty}); err != nil {
			t.Errorf("quantity %d should be accepted: %v", qty, err)
		}
	}
}

func TestCancelTwice(t *testing.T) {
	ctx := context.Background()
	service := order.New(memory.New())
	o, err := service.Create(ctx, order.CreateInput{SKU: "tea", Quantity: 1})
	if err != nil {
		t.Fatal(err)
	}
	first, err := service.Cancel(ctx, o.ID)
	if err != nil {
		t.Fatal(err)
	}
	second, err := service.Cancel(ctx, o.ID)
	if err != nil || first != second || second.Status != order.Cancelled {
		t.Fatalf("retry changed result: first=%+v second=%+v error=%v", first, second, err)
	}
}

func TestMissingOrder(t *testing.T) {
	service := order.New(memory.New())
	if _, err := service.Get(context.Background(), "missing"); !errors.Is(err, order.ErrNotFound) {
		t.Fatalf("Get error = %v", err)
	}
	if _, err := service.Cancel(context.Background(), "missing"); !errors.Is(err, order.ErrNotFound) {
		t.Fatalf("Cancel error = %v", err)
	}
}

// Separate services share data only when they receive the same store object.
func TestServicesShareStore(t *testing.T) {
	ctx := context.Background()
	store := memory.New()
	writer := order.New(store)
	reader := order.New(store)
	isolated := order.New(memory.New())
	created, err := writer.Create(ctx, order.CreateInput{SKU: "coffee", Quantity: 2})
	if err != nil {
		t.Fatal(err)
	}
	got, err := reader.Get(ctx, created.ID)
	if err != nil || got != created {
		t.Fatalf("shared store: got %+v, %v; want %+v", got, err, created)
	}
	if _, err := isolated.Get(ctx, created.ID); !errors.Is(err, order.ErrNotFound) {
		t.Fatalf("separate store: got %v; want ErrNotFound", err)
	}
}
