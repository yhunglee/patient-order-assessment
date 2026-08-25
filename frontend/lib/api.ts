import { Patient, Order } from './types';
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? '系統發生錯誤');
  return body as T;
}
export const api = {
  listPatients: () => request<Patient[]>('/api/patients'),
  createOrder: (patientId: string, message: string) => request<Order>(`/api/patients/${patientId}/orders`, { method: 'POST', body: JSON.stringify({ message }) }),
  updateOrder: (orderId: string, message: string) => request<Order>(`/api/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ message }) }),
};
