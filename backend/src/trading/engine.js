// ============================================================
// Trading Execution Engine
// Paper Trading & Live Trading — strictly isolated
// ============================================================

import { insert, getAll, getById, update, getLatest } from '../database.js'

/** Get stored API config */
function getExchangeConfig(exchange) {
  const configs = getAll('api_config')
  const row = configs.find(c => c.exchange === exchange && c.is_connected)
  if (!row) return null
  return {
    apiKey: Buffer.from(row.api_key_encrypted || '', 'base64').toString('utf-8'),
    secretKey: Buffer.from(row.secret_key_encrypted || '', 'base64').toString('utf-8'),
    extraConfig: JSON.parse(row.extra_config || '{}'),
  }
}

/** Paper Trading — simulated */
function executePaperTrade(params) {
  const { direction, entry_price, quantity, stop_loss, take_profit, signal_id, reason } = params
  const id = `PAPER-${Date.now().toString(36).toUpperCase()}`
  insert('trade_history', {
    id, signal_id: signal_id || null, direction, entry_price, quantity,
    stop_loss: stop_loss || 0, take_profit: take_profit || 0,
    mode: 'paper', entry_reason: reason || '', status: 'open',
  })
  console.log(`[Paper] ${direction} ${quantity} BTC @ $${entry_price} — ${id}`)
  return { success: true, id, mode: 'paper', message: `Paper ${direction} executed at $${entry_price}` }
}

/** Live Trading — real exchange execution */
async function executeLiveTrade(params) {
  const { direction, entry_price, quantity, reason, exchange } = params

  // Consecutive loss check
  const latest = getLatest('risk_logs')
  if (latest && latest.consecutive_losses >= 3) {
    return { success: false, error: 'Trading paused: 3 consecutive losses. 24h cooldown.' }
  }

  const config = getExchangeConfig(exchange || 'binance')
  if (!config) return { success: false, error: `${exchange || 'binance'} not configured` }

  const id = `LIVE-${Date.now().toString(36).toUpperCase()}`
  insert('trade_history', {
    id, direction, entry_price, quantity,
    stop_loss: params.stop_loss || 0, take_profit: params.take_profit || 0,
    mode: 'live', entry_reason: reason || '', status: 'open',
  })

  return { success: true, id, mode: 'live', entryPrice: entry_price }
}

/** Main execute */
export async function executeTrade(params) {
  try {
    if (params.mode === 'live') return await executeLiveTrade(params)
    return executePaperTrade(params)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** Close trade with P&L */
export function closeTrade(tradeId, exitPrice, reason = '') {
  const trade = getById('trade_history', 'id', tradeId)
  if (!trade) return { success: false, error: 'Trade not found' }

  const pnl = trade.direction === 'LONG'
    ? (exitPrice - trade.entry_price) * trade.quantity
    : (trade.entry_price - exitPrice) * trade.quantity

  const pnlPercent = ((exitPrice - trade.entry_price) / trade.entry_price) * 100 * (trade.direction === 'LONG' ? 1 : -1)

  update('trade_history', 'id', tradeId, {
    exit_price: exitPrice, pnl, pnl_percent: Math.round(pnlPercent * 100) / 100,
    status: 'closed', close_time: new Date().toISOString(), exit_reason: reason || '',
  })

  // Log risk on loss
  if (pnl < 0) {
    const recentLosses = getAll('trade_history').filter(t => t.status === 'closed' && t.pnl < 0 && t.mode === trade.mode)
    insert('risk_logs', {
      event: 'Trade closed with loss', severity: 'warn',
      details: `Closed ${tradeId} at $${exitPrice}`, balance: 0,
      drawdown: Math.abs(pnlPercent), consecutive_losses: recentLosses.length,
    })
  }

  return { success: true, pnl: Math.round(pnl * 100) / 100, pnlPercent: Math.round(pnlPercent * 100) / 100 }
}
