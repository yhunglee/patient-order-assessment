import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";

const latestOrder = {
  id: "2",
  message: "最新醫囑",
  createdAt: "2026-08-26T09:00:00.000Z",
};
const repositories = {
  listPatients: async () => [
    {
      id: "1",
      name: "小民",
      order: latestOrder,
      orderHistory: [
        latestOrder,
        {
          id: "1",
          message: "超過120請施打8u",
          createdAt: "2026-08-25T09:00:00.000Z",
        },
      ],
    },
  ],
  createOrder: async (patientId, message) =>
    patientId === "404"
      ? null
      : { id: "3", message, createdAt: "2026-08-26T10:00:00.000Z" },
  // 模擬版本化更新：回傳新 id，而不是覆寫舊 id。
  updateOrder: async (orderId, message) =>
    orderId === "404"
      ? null
      : { id: "3", message, createdAt: "2026-08-26T10:00:00.000Z" },
};
const app = createApp({ repositories });

test("GET /api/patients returns the latest order and reverse-chronological history", async () => {
  const response = await request(app).get("/api/patients").expect(200);
  assert.equal(response.body[0].order.message, "最新醫囑");
  assert.deepEqual(
    response.body[0].orderHistory.map((order) => order.id),
    ["2", "1"],
  );
});

test("POST creates a valid order and rejects blank content", async () => {
  await request(app)
    .post("/api/patients/2/orders")
    .send({ message: "睡前量測血糖" })
    .expect(201);
  const invalid = await request(app)
    .post("/api/patients/2/orders")
    .send({ message: "  " })
    .expect(400);
  assert.match(invalid.body.message, /不可空白/);
});

test("PUT creates and returns a new current order version", async () => {
  const updated = await request(app)
    .put("/api/orders/1")
    .send({ message: "更新後醫囑" })
    .expect(200);
  assert.equal(updated.body.id, "3");
  assert.equal(updated.body.message, "更新後醫囑");
  assert.equal(updated.body.createdAt, "2026-08-26T10:00:00.000Z");

  await request(app)
    .put("/api/orders/404")
    .send({ message: "更新後醫囑" })
    .expect(404);
});
