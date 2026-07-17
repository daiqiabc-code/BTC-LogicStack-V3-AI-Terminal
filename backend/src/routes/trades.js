import { Router } from 'express'
import { insert, query, getAll, getById, update } from '../database.js'

export const tradeRoutes = Router()

tradeRoutes.get('/', (req, res) => {
  try {
    const mode = req.query.mode || 'paper'
    const limit = parseInt(req.query.limit) || 50
    const rows = query('trade_history', t => t.mode === mode).reverse().slice(0, limit)
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

tradeRoutes.post('/open', (req, res) => {
  try {
    const { direction, entry_price, quantity, signal_id, stop_loss, take_profit, mode, reason } = req.body
    const id = `TRD-${Date.now().toString(36).toUpperCase()}`
    insert('trade_history', { id, signal_id: signal_id || null, direction: direction || 'LONG', entry_price: entry_price || 0, quantity: quantity || 0, stop_loss: stop_loss || 0, take_profit: take_profit || 0, mode: mode || 'paper', entry_reason: reason || '', status: 'open' })
    res.json({ success: true, id })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

tradeRoutes.put('/:id/close', (req, res) => {
  try {
    const { exit_price, reason } = req.body
    const trade = getById('trade_history', 'id', req.params.id)
    if (!trade) return res.status(404).json({ success: false, error: 'Trade not found' })
    const pnl = trade.direction === 'LONG' ? (exit_price - trade.entry_price) * trade.quantity : (trade.entry_price - exit_price) * trade.quantity
    const pnlPercent = ((exit_price - trade.entry_price) / trade.entry_price) * 100 * (trade.direction === 'LONG' ? 1 : -1)
    update('trade_history', 'id', req.params.id, { exit_price: exit_price || 0, pnl, pnl_percent: Math.round(pnlPercent * 100) / 100, status: 'closed', close_time: new Date().toISOString(), exit_reason: reason || '' })
    res.json({ success: true, pnl, pnlPercent: Math.round(pnlPercent * 100) / 100 })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

tradeRoutes.get('/stats', (req, res) => {
  try {
    const all = getAll('trade_history')
    const stats = {}
    for (const t of all) {
      const key = `${t.mode}_${t.status}`
      if (!stats[key]) stats[key] = { mode: t.mode, status: t.status, count: 0, total_pnl: 0 }
      stats[key].count++
      stats[key].total_pnl += t.pnl || 0
    }
    res.json({ success: true, data: Object.values(stats) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
