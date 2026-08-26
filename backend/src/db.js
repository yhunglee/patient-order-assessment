import pg from "pg";

const { Pool } = pg;
export const createPool = (connectionString) => new Pool({ connectionString });

/**
 * 將資料庫列轉換為前端需要的醫囑格式。
 * @param {{ id: number; message: string; createdAt: Date; updatedAt: Date }} order 資料庫醫囑列。
 * @returns {{ id: string; message: string; createdAt: Date; updatedAt: Date }} API 醫囑資料。
 */
const toOrder = (order) => ({ ...order, id: String(order.id) });

export const createRepositories = (pool) => ({
  async listPatients() {
    const [patientsResult, ordersResult] = await Promise.all([
      pool.query("SELECT id, name FROM patients ORDER BY id::integer"),
      pool.query(`
        SELECT id, patient_id AS "patientId", message,
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM orders
        ORDER BY patient_id, created_at DESC, id DESC;
      `),
    ]);

    const ordersByPatientId = new Map();
    for (const order of ordersResult.rows) {
      const history = ordersByPatientId.get(order.patientId) ?? [];
      history.push(toOrder(order));
      ordersByPatientId.set(order.patientId, history);
    }

    return patientsResult.rows.map((patient) => {
      const orderHistory = ordersByPatientId.get(patient.id) ?? [];
      return {
        ...patient,
        // 排序後第一筆永遠是目前有效的最新醫囑，避免前端自行判斷版本。
        order: orderHistory[0] ?? null,
        orderHistory,
      };
    });
  },

  async createOrder(patientId, message) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const patient = await client.query(
        "SELECT id FROM patients WHERE id = $1 FOR UPDATE",
        [patientId],
      );
      if (patient.rowCount === 0) return null;

      const order = await client.query(
        `INSERT INTO orders (patient_id, message)
         VALUES ($1, $2)
         RETURNING id, message, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [patientId, message],
      );
      await client.query("COMMIT");
      return toOrder(order.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async updateOrder(orderId, message) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const currentOrder = await client.query(
        "SELECT patient_id FROM orders WHERE id = $1 FOR UPDATE",
        [orderId],
      );
      if (currentOrder.rowCount === 0) return null;

      // 修改以新增版本實作，絕不覆寫既有內容，讓同一病人的醫囑可追溯。
      const order = await client.query(
        `INSERT INTO orders (patient_id, message)
         VALUES ($1, $2)
         RETURNING id, message, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [currentOrder.rows[0].patient_id, message],
      );
      await client.query("COMMIT");
      return toOrder(order.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
});
