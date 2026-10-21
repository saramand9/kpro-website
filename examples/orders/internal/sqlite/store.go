// Package sqlite implements the application's Store using a local SQLite file.
package sqlite

import (
	"context"
	"database/sql"
	_ "embed"
	"errors"
	"time"

	"example.com/orders/internal/order"
	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schema string

type Store struct{ db *sql.DB }

var _ order.Store = (*Store)(nil)

func Open(ctx context.Context, path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	// This teaching service uses one connection and one process. Operations
	// queue here; this is NOT a multi-instance/high-throughput database design.
	db.SetMaxOpenConns(1)
	if _, err = db.ExecContext(ctx, schema); err != nil {
		_ = db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error                   { return s.db.Close() }
func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

func (s *Store) Create(ctx context.Context, o order.Order) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO orders (id, sku, quantity, status, created_at) VALUES (?, ?, ?, ?, ?)`,
		o.ID, o.SKU, o.Quantity, o.Status, o.CreatedAt.Format(time.RFC3339Nano))
	return err
}

func (s *Store) Get(ctx context.Context, id string) (order.Order, error) {
	return scan(s.db.QueryRowContext(ctx,
		`SELECT id, sku, quantity, status, created_at FROM orders WHERE id = ?`, id))
}

func (s *Store) UpdateStatus(ctx context.Context, id string, change func(string) (string, error)) (order.Order, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return order.Order{}, err
	}
	defer tx.Rollback()
	current, err := scan(tx.QueryRowContext(ctx,
		`SELECT id, sku, quantity, status, created_at FROM orders WHERE id = ?`, id))
	if err != nil {
		return order.Order{}, err
	}
	status, err := change(current.Status)
	if err != nil {
		return order.Order{}, err
	}
	// The application currently changes only status. Other fields are immutable.
	if _, err = tx.ExecContext(ctx, `UPDATE orders SET status = ? WHERE id = ?`, status, id); err != nil {
		return order.Order{}, err
	}
	if err := tx.Commit(); err != nil {
		return order.Order{}, err
	}
	current.Status = status
	return current, nil
}

func scan(row *sql.Row) (order.Order, error) {
	var o order.Order
	var created string
	if err := row.Scan(&o.ID, &o.SKU, &o.Quantity, &o.Status, &created); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return order.Order{}, order.ErrNotFound
		}
		return order.Order{}, err
	}
	t, err := time.Parse(time.RFC3339Nano, created)
	o.CreatedAt = t
	return o, err
}
