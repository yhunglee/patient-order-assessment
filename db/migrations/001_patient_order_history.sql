BEGIN;

-- 將舊版 patients.order_id 的目前醫囑關聯，移轉為 orders.patient_id 的一對多關聯。
ALTER TABLE orders ADD COLUMN IF NOT EXISTS patient_id VARCHAR(10);

UPDATE orders AS o
SET patient_id = p.id
FROM patients AS p
WHERE p.order_id = o.id
  AND o.patient_id IS NULL;

-- 移轉完成後，所有既有醫囑都必須有病人；若有未關聯資料應先人工處理，避免遺失病歷脈絡。
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM orders WHERE patient_id IS NULL) THEN
    RAISE EXCEPTION 'orders.patient_id migration failed: found unlinked historical orders';
  END IF;
END $$;

ALTER TABLE orders ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE patients DROP COLUMN IF EXISTS order_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_patient_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES patients(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_patient_created_at_idx
  ON orders (patient_id, created_at DESC, id DESC);

COMMIT;
