// Package httpapi translates HTTP requests/responses; business rules live in order.
package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"
	"time"

	"example.com/orders/internal/order"
	"github.com/saramand9/kpro/transport/httpx"
)

type API struct{ orders *order.Service }

func Register(endpoint *httpx.Endpoint, orders *order.Service, ready func(context.Context) error) {
	api := &API{orders: orders}
	endpoint.Get("/livez", func(c *httpx.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "alive"})
	})
	endpoint.Get("/readyz", func(c *httpx.Context) error {
		ctx, cancel := context.WithTimeout(c.Context(), time.Second)
		defer cancel()
		if err := ready(ctx); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "not_ready"})
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ready"})
	})
	endpoint.Post("/orders", api.create)
	endpoint.Get("/orders/{id}", api.get)
	endpoint.Post("/orders/{id}/cancel", api.cancel)
}

func (a *API) create(c *httpx.Context) error {
	mediaType, _, err := mime.ParseMediaType(c.Request().Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		return c.JSON(http.StatusUnsupportedMediaType, map[string]string{"error": "use_application_json"})
	}
	body, err := c.Body()
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			return c.JSON(http.StatusRequestEntityTooLarge, map[string]string{"error": "body_too_large"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	var input order.CreateInput
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_json"})
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "one_json_object_required"})
	}
	ctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)
	defer cancel()
	o, err := a.orders.Create(ctx, input)
	if err != nil {
		return respondError(c, err)
	}
	c.Header().Set("Location", "/orders/"+o.ID)
	return c.JSON(http.StatusCreated, o)
}

func (a *API) get(c *httpx.Context) error {
	ctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)
	defer cancel()
	o, err := a.orders.Get(ctx, c.Param("id"))
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, o)
}

func (a *API) cancel(c *httpx.Context) error {
	ctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)
	defer cancel()
	o, err := a.orders.Cancel(ctx, c.Param("id"))
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, o)
}

func respondError(c *httpx.Context, err error) error {
	status, code := http.StatusInternalServerError, "internal_error"
	switch {
	case errors.Is(err, order.ErrInvalid):
		status, code = http.StatusUnprocessableEntity, "invalid_order"
	case errors.Is(err, order.ErrNotFound):
		status, code = http.StatusNotFound, "order_not_found"
	case errors.Is(err, order.ErrConflict):
		status, code = http.StatusConflict, "order_conflict"
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, context.Canceled):
		status, code = http.StatusServiceUnavailable, "request_unavailable"
	default:
		// Details go to server logs, never into the public response.
		log.Printf("order operation failed: %v", err)
	}
	return c.JSON(status, map[string]string{"error": code})
}
