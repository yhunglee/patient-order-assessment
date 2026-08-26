CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(10) NOT NULL REFERENCES patients(id),
  message VARCHAR(500) NOT NULL CHECK (length(trim(message)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_patient_created_at_idx
  ON orders (patient_id, created_at DESC, id DESC);

INSERT INTO patients (id, name) VALUES
  ('1', '小民'), ('2', '小美'), ('3', '阿明'), ('4', '小華'), ('5', '阿芳')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, patient_id, message) VALUES
  (1, '1', '超過120請施打8u'),
  (2, '2', '每日早晨量測血壓並記錄'),
  (3, '3', '晚餐採低鈉飲食'),
  (4, '4', '午餐後協助進行15分鐘復健運動'),
  (5, '5', '睡前量測血糖並記錄')
ON CONFLICT (id) DO NOTHING;

SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
