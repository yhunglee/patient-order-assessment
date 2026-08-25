import cors from 'cors';
import express from 'express';
import { z } from 'zod';

const messageSchema = z.object({ message: z.string().trim().min(1, '醫囑內容不可空白').max(500, '醫囑內容不可超過 500 字') });

export function createApp({ repositories, corsOrigin = 'http://localhost:3000' }) {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/patients', async (_req, res, next) => {
    try { res.json(await repositories.listPatients()); } catch (error) { next(error); }
  });
  app.post('/api/patients/:patientId/orders', async (req, res, next) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    try {
      const order = await repositories.createOrder(req.params.patientId, parsed.data.message);
      if (!order) return res.status(404).json({ message: '找不到指定住民' });
      return res.status(201).json(order);
    } catch (error) {
      if (error.code === 'PATIENT_ALREADY_HAS_ORDER') return res.status(409).json({ message: '此住民已有醫囑，請改用編輯功能' });
      return next(error);
    }
  });
  app.put('/api/orders/:orderId', async (req, res, next) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    try {
      const order = await repositories.updateOrder(req.params.orderId, parsed.data.message);
      if (!order) return res.status(404).json({ message: '找不到指定醫囑' });
      return res.json(order);
    } catch (error) { return next(error); }
  });
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: '系統發生非預期錯誤' });
  });
  return app;
}
