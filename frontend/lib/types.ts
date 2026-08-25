export type Order = { id: string; message: string; createdAt?: string; updatedAt?: string };
export type Patient = { id: string; name: string; orderId: string | null; order: Order | null };
