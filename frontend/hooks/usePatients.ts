import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Patient } from '../lib/types';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setPatients(await api.listPatients()); } catch (caught) { setError(caught instanceof Error ? caught.message : '讀取住民資料失敗'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => {
    // 非同步 callback 在資料回應後才更新畫面，避免 render 階段同步更新 state。
    void api.listPatients().then(setPatients).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : '讀取住民資料失敗')).finally(() => setIsLoading(false));
  }, []);
  return { patients, isLoading, error, reload: load };
}
