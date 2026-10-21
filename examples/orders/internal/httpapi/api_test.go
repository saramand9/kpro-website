package httpapi_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"example.com/orders/internal/httpapi"
	"example.com/orders/internal/memory"
	"example.com/orders/internal/order"
	"github.com/saramand9/kpro/transport/httpx"
)

func endpoint() *httpx.Endpoint {
	db := memory.New()
	e := httpx.New(httpx.Config{MaxBodyBytes: 4096})
	httpapi.Register(e, order.New(db), db.Ping)
	return e
}

func request(e http.Handler, method, path, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	e.ServeHTTP(w, r)
	return w
}

func TestHTTPJourney(t *testing.T) {
	e := endpoint()
	created := request(e, "POST", "/orders", `{"sku":"coffee","quantity":2}`)
	if created.Code != 201 {
		t.Fatalf("create: %d %s", created.Code, created.Body)
	}
	var o order.Order
	if err := json.Unmarshal(created.Body.Bytes(), &o); err != nil {
		t.Fatal(err)
	}
	if created.Header().Get("Location") != "/orders/"+o.ID {
		t.Fatal("missing Location header")
	}
	if got := request(e, "GET", "/orders/"+o.ID, ""); got.Code != 200 {
		t.Fatalf("get: %d %s", got.Code, got.Body)
	}
	first := request(e, "POST", "/orders/"+o.ID+"/cancel", "")
	second := request(e, "POST", "/orders/"+o.ID+"/cancel", "")
	if first.Code != 200 || second.Code != 200 || first.Body.String() != second.Body.String() || !strings.Contains(second.Body.String(), `"cancelled"`) {
		t.Fatalf("cancel: %s / %s", first.Body, second.Body)
	}
}

func TestHTTPQuantityBoundary(t *testing.T) {
	for _, body := range []string{
		`{"sku":"coffee","quantity":1}`,
		`{"sku":"coffee","quantity":20}`,
	} {
		got := request(endpoint(), "POST", "/orders", body)
		if got.Code != 201 {
			t.Fatalf("create %s: got %d %s; want 201", body, got.Code, got.Body)
		}
	}
}

func TestHTTPFailures(t *testing.T) {
	cases := []struct {
		name, body string
		status     int
	}{
		{"broken json", `{`, 400},
		{"unknown field", `{"sku":"tea","quantity":1,"price":0}`, 400},
		{"wrong type", `{"sku":"tea","quantity":"1"}`, 400},
		{"trailing json", `{"sku":"tea","quantity":1}{}`, 400},
		{"empty sku", `{"sku":"","quantity":1}`, 422},
		{"zero quantity", `{"sku":"tea","quantity":0}`, 422},
		{"large quantity", `{"sku":"tea","quantity":21}`, 422},
		{"large body", strings.Repeat("x", 4097), 413},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := request(endpoint(), "POST", "/orders", tc.body)
			if got.Code != tc.status {
				t.Fatalf("got %d %s; want %d", got.Code, got.Body, tc.status)
			}
		})
	}
	if w := request(endpoint(), "GET", "/orders/missing", ""); w.Code != 404 {
		t.Fatalf("missing order: %d %s", w.Code, w.Body)
	}
	r := httptest.NewRequest("POST", "/orders", strings.NewReader("{}"))
	w := httptest.NewRecorder()
	endpoint().ServeHTTP(w, r)
	if w.Code != 415 {
		t.Fatalf("content type: %d", w.Code)
	}
}

type failedStore struct{ order.Store }

func (failedStore) Create(context.Context, order.Order) error {
	return errors.New("private database details")
}

func TestInternalErrorIsNotExposed(t *testing.T) {
	e := httpx.New(httpx.Config{})
	httpapi.Register(e, order.New(failedStore{}), func(context.Context) error { return errors.New("offline") })
	w := request(e, "POST", "/orders", `{"sku":"tea","quantity":1}`)
	if w.Code != 500 || strings.Contains(w.Body.String(), "private") {
		t.Fatalf("unsafe response: %d %s", w.Code, w.Body)
	}
	if w := request(e, "GET", "/readyz", ""); w.Code != 503 {
		t.Fatalf("readiness = %d", w.Code)
	}
	if w := request(e, "GET", "/livez", ""); w.Code != 200 {
		t.Fatalf("liveness = %d", w.Code)
	}
}
