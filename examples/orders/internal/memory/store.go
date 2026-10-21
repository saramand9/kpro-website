package memory

import (
	"context"
	"errors"
	"sync"

	"example.com/orders/internal/order"
)

type Store struct {
	mu     sync.Mutex
	orders map[string]order.Order
}

var _ order.Store = (*Store)(nil)

func New() *Store { return &Store{orders: make(map[string]order.Order)} }

func (s *Store) Create(ctx context.Context, o order.Order) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := ctx.Err(); err != nil {
		return err
	}
	if _, exists := s.orders[o.ID]; exists {
		return errors.New("duplicate order id")
	}
	s.orders[o.ID] = o
	return nil
}

func (s *Store) Get(ctx context.Context, id string) (order.Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := ctx.Err(); err != nil {
		return order.Order{}, err
	}
	o, ok := s.orders[id]
	if !ok {
		return order.Order{}, order.ErrNotFound
	}
	return o, nil
}

func (s *Store) UpdateStatus(ctx context.Context, id string, change func(string) (string, error)) (order.Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := ctx.Err(); err != nil {
		return order.Order{}, err
	}
	o, ok := s.orders[id]
	if !ok {
		return order.Order{}, order.ErrNotFound
	}
	status, err := change(o.Status)
	if err != nil {
		return order.Order{}, err
	}
	o.Status = status
	s.orders[id] = o
	return o, nil
}

func (s *Store) Ping(ctx context.Context) error { return ctx.Err() }
