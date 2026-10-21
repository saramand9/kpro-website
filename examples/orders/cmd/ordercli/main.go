package main

import (
	"encoding/json"
	"flag"
	"log"
	"os"

	"example.com/orders/internal/tcpclient"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8088", "TCP address")
	id := flag.String("id", "", "order ID returned by HTTP")
	flag.Parse()
	if *id == "" {
		log.Fatal("pass -id with an existing order ID")
	}
	o, err := tcpclient.Get(*addr, *id)
	if err != nil {
		log.Fatal(err)
	}
	if err := json.NewEncoder(os.Stdout).Encode(o); err != nil {
		log.Fatal(err)
	}
}
