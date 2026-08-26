export type Order = {
  id: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
};

export type Patient = {
  id: string;
  name: string;
  order: Order | null;
  // 建立時間由新到舊排序，第一筆即為目前有效醫囑。
  orderHistory: Order[];
};
