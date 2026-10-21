// Package messageapi adapts one binary message to the SAME order.Service.
package messageapi

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"example.com/orders/internal/order"
	"github.com/saramand9/kpro/core"
	"github.com/saramand9/kpro/server"
)

const GetOrderID uint32 = 1001

type GetRequest struct {
	ID string `json:"id"`
}

type Response struct {
	Order *order.Order `json:"order,omitempty"`
	Error string       `json:"error,omitempty"`
}

func Register(endpoint *server.Endpoint, orders *order.Service) error {
	return endpoint.HandleChecked(GetOrderID, func(c core.Context) error {
		var req GetRequest
		if err := json.Unmarshal(c.Message().Data, &req); err != nil || req.ID == "" {
			return reply(c, Response{Error: "invalid_request"})
		}
		ctx, cancel := context.WithTimeout(core.ContextOf(c), 2*time.Second)
		defer cancel()
		o, err := orders.Get(ctx, req.ID)
		if errors.Is(err, order.ErrNotFound) {
			return reply(c, Response{Error: "order_not_found"})
		}
		if err != nil {
			log.Printf("message lookup failed: %v", err)
			return reply(c, Response{Error: "request_unavailable"})
		}
		return reply(c, Response{Order: &o})
	})
}

func reply(c core.Context, response Response) error {
	data, err := json.Marshal(response)
	if err != nil {
		return err
	}
	// Reply preserves the request sequence number. A successful return means
	// accepted for sending, not that the remote application has processed it.
	return c.Reply(GetOrderID, data)
}
