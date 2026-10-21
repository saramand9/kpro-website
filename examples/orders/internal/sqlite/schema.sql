CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    status TEXT NOT NULL CHECK (status IN ('pending', 'cancelled')),
    created_at TEXT NOT NULL
);
