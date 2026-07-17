// ============================================================
// Frontend API Service — connects to backend
// BTC Logic Stack V3
// ============================================================

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

// ============================================================
// Market
// ============================================================
export const marketApi = {
  overview: () => request<any>('/market/overview'),
  history: (limit = 50) => request<any>(`/market/history?limit=${limit}`),
  predictions: () => request<any>('/market/predictions'),
  saveSnapshot: (data: any) => request<any>('/market/save', { method: 'POST', body: JSON.stringify(data) }),
}

// ============================================================
// Signals
// ============================================================
export const signalsApi = {
  list: (status = 'active') => request<any>(`/signals?status=${status}`),
  all: (limit = 50) => request<any>(`/signals/all?limit=${limit}`),
  create: (data: any) => request<any>('/signals/create', { method: 'POST', body: JSON.stringify(data) }),
  executeSignal: (id: string) => request<any>(`/signals/${id}/execute`, { method: 'PUT' }),
}

// ============================================================
// Trades
// ============================================================
export const tradesApi = {
  list: (mode = 'paper', limit = 50) => request<any>(`/trades?mode=${mode}&limit=${limit}`),
  stats: () => request<any>('/trades/stats'),
  open: (data: any) => request<any>('/trades/open', { method: 'POST', body: JSON.stringify(data) }),
  close: (id: string, exitPrice: number, reason = '') =>
    request<any>(`/trades/${id}/close`, { method: 'PUT', body: JSON.stringify({ exit_price: exitPrice, reason }) }),
}

// ============================================================
// Trade Execution
// ============================================================
export const executionApi = {
  execute: (params: any) => request<any>('/trade/execute', { method: 'POST', body: JSON.stringify(params) }),
  close: (tradeId: string, exitPrice: number, reason = '') =>
    request<any>('/trade/close', { method: 'POST', body: JSON.stringify({ tradeId, exitPrice, reason }) }),
}

// ============================================================
// Risk
// ============================================================
export const riskApi = {
  state: () => request<any>('/risk/state'),
  logs: (limit = 20) => request<any>(`/risk/logs?limit=${limit}`),
  log: (data: any) => request<any>('/risk/log', { method: 'POST', body: JSON.stringify(data) }),
}

// ============================================================
// API Config
// ============================================================
export const configApi = {
  list: () => request<any>('/config'),
  save: (data: any) => request<any>('/config/save', { method: 'POST', body: JSON.stringify(data) }),
  disconnect: (exchange: string) => request<any>(`/config/${exchange}`, { method: 'DELETE' }),
  test: (exchange: string) => request<any>('/config/test', { method: 'POST', body: JSON.stringify({ exchange }) }),
}
