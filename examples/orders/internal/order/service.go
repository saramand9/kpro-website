// Package order contains application rules. It has no KPro or SQL dependency.
package order

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"
)

var (
	ErrInvalid  = errors.New("sku must be 1..64 characters and quantity must be 1..20")
	ErrNotFound = errors.New("order not found")
	ErrConflict = errors.New("order cannot be cancelled in its current state")
)

const (
	Pending   = "pending"
	Cancelled = "cancelled"
)

type Order struct {
	ID        string    `json:"id"`
	SKU       string    `json:"sku"`
	Quantity  int       `json:"quantity"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateInput struct {
	SKU      string `json:"sku"`
	Quantity int    `json:"quantity"`
}

// Store describes what the application needs, not how a database works.
type Store interface {
	Create(context.Context, Order) error
	Get(context.Context, string) (Order, error)
	// UpdateStatus must read, apply change, and save atomically. If change fails,
	// nothing is saved. change must not do network I/O or call Store again.
	UpdateStatus(context.Context, string, func(string) (string, error)) (Order, error)
}

type Service struct{ store Store }

func New(store Store) *Service { return &Service{store: store} }

func (s *Service) Create(ctx context.Context, input CreateInput) (Order, error) {
	input.SKU = strings.TrimSpace(input.SKU)
	if n := len([]rune(input.SKU)); n == 0 || n > 64 || input.Quantity < 1 || input.Quantity > 20 {
		return Order{}, ErrInvalid
	}
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		return Order{}, err
	}
	o := Order{
		ID: hex.EncodeToString(id[:]), SKU: input.SKU, Quantity: input.Quantity,
		Status: Pending, CreatedAt: time.Now().UTC(),
	}
	if err := s.store.Create(ctx, o); err != nil {
		return Order{}, err
	}
	return o, nil
}

func (s *Service) Get(ctx context.Context, id string) (Order, error) {
	return s.store.Get(ctx, id)
}

func (s *Service) Cancel(ctx context.Context, id string) (Order, error) {
	return s.store.UpdateStatus(ctx, id, func(status string) (string, error) {
		switch status {
		case Pending:
			return Cancelled, nil
		case Cancelled:
			// A retry returns the same state: cancelling twice is harmless.
			return Cancelled, nil
		default:
			return "", ErrConflict
		}
	})
}
