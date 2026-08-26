import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Patient } from "../lib/types";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsLoaded(false);
    setError(null);

    try {
      const nextPatients = await api.listPatients();
      setPatients(nextPatients);
      setIsLoaded(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "讀取住民資料失敗");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 延後到 effect 完成後啟動載入，避免 effect 同步觸發 state 更新；仍與外部 reload 共用流程。
    void Promise.resolve().then(load);
  }, [load]);

  return { patients, isLoading, isLoaded, error, reload: load };
}
