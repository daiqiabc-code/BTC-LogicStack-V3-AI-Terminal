import { Router } from 'express'
import { insert, query, getAll, update } from '../database.js'

export const signalRoutes = Router()

signalRoutes.get('/', (req, res) => {
  try {
    const status = req.query.status || 'active'
    const rows = query('signals', s => s.status === status).reverse()
    res.json({ success: true, data: rows, count: rows.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

signalRoutes.get('/all', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const rows = getAll('signals').reverse().slice(0, limit)
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

signalRoutes.post('/create', (req, res) => {
  try {
    const { direction, score, reasons, stop_loss, take_profit, risk_reward } = req.body
    const id = `SIG-${Date.now().toString(36).toUpperCase()}`
    insert('signals', { id, direction: direction || 'LONG', score: score || 0, reasons: JSON.stringify(reasons || []), stop_loss: stop_loss || 0, take_profit: take_profit || 0, risk_reward: risk_reward || 0, status: 'active' })
    res.json({ success: true, id })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

signalRoutes.put('/:id/execute', (req, res) => {
  try {
    update('signals', 'id', req.params.id, { status: 'executed', executed_at: new Date().toISOString() })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
