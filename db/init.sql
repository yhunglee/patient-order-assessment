CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  message VARCHAR(500) NOT NULL CHECK (length(trim(message)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  order_id INTEGER UNIQUE REFERENCES orders(id)
);

INSERT INTO orders (id, message) VALUES
  (1, '超過120請施打8u'),
  (2, '每日早晨量測血壓並記錄'),
  (3, '晚餐採低鈉飲食'),
  (4, '午餐後協助進行15分鐘復健運動'),
  (5, '睡前量測血糖並記錄')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (id, name, order_id) VALUES
  ('1', '小民', 1), ('2', '小美', 2), ('3', '阿明', 3), ('4', '小華', 4), ('5', '阿芳', 5)
ON CONFLICT (id) DO NOTHING;

SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
