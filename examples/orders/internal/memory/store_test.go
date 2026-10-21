package memory_test

import (
	"testing"

	"example.com/orders/internal/memory"
	"example.com/orders/internal/storetest"
)

func TestStoreContract(t *testing.T) { storetest.Run(t, memory.New()) }
