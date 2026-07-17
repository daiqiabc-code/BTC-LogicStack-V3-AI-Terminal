import { Router } from 'express'
import { insert, getAll, getLatest, query } from '../database.js'

export const riskRoutes = Router()

riskRoutes.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const rows = getAll('risk_logs').reverse().slice(0, limit)
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

riskRoutes.post('/log', (req, res) => {
  try {
    const item = insert('risk_logs', req.body)
    res.json({ success: true, id: item._id })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

riskRoutes.get('/state', (req, res) => {
  try {
    const state = { consecutiveLosses: 0, isPaused: false, pauseUntil: null, accountBalance: 10000, riskPercent: 1 }
    const latest = getLatest('risk_logs')
    if (latest) state.consecutiveLosses = latest.consecutive_losses || 0
    if (state.consecutiveLosses >= 3) {
      state.isPaused = true
      const pauseLogs = query('risk_logs', r => r.consecutive_losses >= 3)
      if (pauseLogs.length > 0) {
        const lastPause = pauseLogs[pauseLogs.length - 1]
        const pauseStart = new Date(lastPause._created_at).getTime()
        const pauseDuration = 24 * 60 * 60 * 1000
        state.pauseUntil = new Date(pauseStart + pauseDuration).toISOString()
        if (Date.now() > pauseStart + pauseDuration) {
          state.isPaused = false
          state.pauseUntil = null
        }
      }
    }
    res.json({ success: true, data: state })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
