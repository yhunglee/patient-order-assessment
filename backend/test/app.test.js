import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

const repositories = {
  listPatients: async () => [{ id: '1', name: '小民', orderId: '1', order: { id: '1', message: '超過120請施打8u' } }],
  createOrder: async (patientId, message) => patientId === '404' ? null : { id: '2', message },
  updateOrder: async (orderId, message) => orderId === '404' ? null : { id: orderId, message },
};
const app = createApp({ repositories });
test('GET /api/patients returns patient list', async () => {
  const response = await request(app).get('/api/patients').expect(200);
  assert.equal(response.body[0].name, '小民');
});
test('POST creates a valid order and rejects blank content', async () => {
  await request(app).post('/api/patients/2/orders').send({ message: '睡前量測血糖' }).expect(201);
  const invalid = await request(app).post('/api/patients/2/orders').send({ message: '  ' }).expect(400);
  assert.match(invalid.body.message, /不可空白/);
});
test('PUT updates an order and reports missing order', async () => {
  await request(app).put('/api/orders/1').send({ message: '更新後醫囑' }).expect(200);
  await request(app).put('/api/orders/404').send({ message: '更新後醫囑' }).expect(404);
});
