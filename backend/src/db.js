import pg from "pg";

const { Pool } = pg;
export const createPool = (connectionString) => new Pool({ connectionString });

export const createRepositories = (pool) => ({
  async listPatients() {
    const { rows } = await pool.query(`
      SELECT p.id, p.name, p.order_id AS "orderId", o.id AS "linkedOrderId", o.message AS "orderMessage", o.created_at AS "orderCreatedAt", o.updated_at AS "orderUpdatedAt"
      FROM patients p LEFT JOIN orders o ON o.id = p.order_id ORDER BY p.id::integer;
    `);
    return rows.map(
      ({
        linkedOrderId,
        orderMessage,
        orderCreatedAt,
        orderUpdatedAt,
        ...patient
      }) => ({
        ...patient,
        order: linkedOrderId
          ? {
              id: linkedOrderId,
              message: orderMessage,
              createdAt: orderCreatedAt,
              updatedAt: orderUpdatedAt,
            }
          : null,
      }),
    );
  },
  async createOrder(patientId, message) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const patient = await client.query(
        "SELECT id, order_id FROM patients WHERE id = $1 FOR UPDATE",
        [patientId],
      );
      if (patient.rowCount === 0) return null;
      if (patient.rows[0].order_id) {
        const error = new Error("PATIENT_ALREADY_HAS_ORDER");
        error.code = "PATIENT_ALREADY_HAS_ORDER";
        throw error;
      }
      const order = await client.query(
        'INSERT INTO orders (message) VALUES ($1) RETURNING id, message, created_at AS "createdAt", updated_at AS "updatedAt"',
        [message],
      );
      await client.query("UPDATE patients SET order_id = $1 WHERE id = $2", [
        order.rows[0].id,
        patientId,
      ]);
      await client.query("COMMIT");
      return order.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
  async updateOrder(orderId, message) {
    const { rows } = await pool.query(
      'UPDATE orders SET message = $1, updated_at = NOW() WHERE id = $2 RETURNING id, message, created_at AS "createdAt", updated_at AS "updatedAt"',
      [message, orderId],
    );
    return rows[0] ?? null;
  },
});
