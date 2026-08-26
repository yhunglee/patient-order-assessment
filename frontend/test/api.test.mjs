import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePatients } from '../hooks/usePatients';
import { api } from '../lib/api';

const firstPatients = [
  { id: '1', name: '小民', orderId: null, order: null },
];
const reloadedPatients = [
  { id: '2', name: '小美', orderId: null, order: null },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('usePatients', () => {
  it('在初次載入成功後回傳 patients 並將 isLoaded 設為 true', async () => {
    const listPatients = vi.spyOn(api, 'listPatients').mockResolvedValueOnce(firstPatients);
    const { result } = renderHook(() => usePatients());

    expect(result.current).toMatchObject({
      patients: [],
      isLoading: true,
      isLoaded: false,
      error: null,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listPatients).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      patients: firstPatients,
      isLoading: false,
      isLoaded: true,
      error: null,
    });
  });

  it('在初次載入失敗後回傳 error，且 isLoaded 維持 false', async () => {
    vi.spyOn(api, 'listPatients').mockRejectedValueOnce(new Error('住民服務暫時無法使用'));
    const { result } = renderHook(() => usePatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      patients: [],
      isLoading: false,
      isLoaded: false,
      error: '住民服務暫時無法使用',
    });
  });

  it('reload 時先清除成功狀態，並在第二次成功後更新 patients', async () => {
    let resolveReload;
    const pendingReload = new Promise((resolve) => {
      resolveReload = resolve;
    });
    const listPatients = vi
      .spyOn(api, 'listPatients')
      .mockResolvedValueOnce(firstPatients)
      .mockReturnValueOnce(pendingReload);
    const { result } = renderHook(() => usePatients());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const reloadPromise = result.current.reload();

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current).toMatchObject({
      patients: firstPatients,
      isLoading: true,
      isLoaded: false,
      error: null,
    });

    resolveReload(reloadedPatients);
    await reloadPromise;
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(listPatients).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({
      patients: reloadedPatients,
      isLoading: false,
      isLoaded: true,
      error: null,
    });
  });
});
