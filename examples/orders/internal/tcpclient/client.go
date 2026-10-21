package tcpclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"time"

	"example.com/orders/internal/messageapi"
	"example.com/orders/internal/order"
	"github.com/saramand9/kpro/codec"
	"github.com/saramand9/kpro/core"
)

func Get(addr, id string) (order.Order, error) {
	conn, err := net.DialTimeout("tcp", addr, 3*time.Second)
	if err != nil {
		return order.Order{}, err
	}
	defer conn.Close()
	if err := conn.SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
		return order.Order{}, err
	}
	body, err := json.Marshal(messageapi.GetRequest{ID: id})
	if err != nil {
		return order.Order{}, err
	}
	frame, err := codec.KProV1().Encode(core.Message{ID: messageapi.GetOrderID, Seq: 1, Data: body})
	if err != nil {
		return order.Order{}, err
	}
	if _, err := io.Copy(conn, bytes.NewReader(frame)); err != nil {
		return order.Order{}, err
	}
	result, err := codec.KProV1().Read(conn, 4<<10)
	if err != nil {
		return order.Order{}, err
	}
	if result.Message.ID != messageapi.GetOrderID || result.Message.Seq != 1 {
		return order.Order{}, fmt.Errorf("unexpected reply id/sequence")
	}
	var response messageapi.Response
	if err := json.Unmarshal(result.Message.Data, &response); err != nil {
		return order.Order{}, err
	}
	if response.Error != "" {
		return order.Order{}, fmt.Errorf("server: %s", response.Error)
	}
	if response.Order == nil {
		return order.Order{}, fmt.Errorf("missing order in response")
	}
	return *response.Order, nil
}
