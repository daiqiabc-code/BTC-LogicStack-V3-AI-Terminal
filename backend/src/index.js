// ============================================================
// BTC Logic Stack V3 — Backend Server
// Express + SQLite + Exchange API Integration
// ============================================================

import express from 'express'
import cors from 'cors'
import { initDatabase } from './database.js'
import { marketRoutes } from './routes/market.js'
import { signalRoutes } from './routes/signals.js'
import { tradeRoutes } from './routes/trades.js'
import { riskRoutes } from './routes/risk.js'
import { apiConfigRoutes } from './routes/apiConfig.js'
import { executeTrade, closeTrade } from './trading/engine.js'

const PORT = process.env.PORT || 3001
const app = express()

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' })
})

// API Routes
app.use('/api/market', marketRoutes)
app.use('/api/signals', signalRoutes)
app.use('/api/trades', tradeRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/config', apiConfigRoutes)

// Trade execution endpoints
app.post('/api/trade/execute', async (req, res) => {
  try {
    const result = await executeTrade(req.body)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/api/trade/close', (req, res) => {
  try {
    const { tradeId, exitPrice, reason } = req.body
    const result = closeTrade(tradeId, exitPrice, reason)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Start server
initDatabase()

const server = app.listen(PORT, () => {
  console.log(`[Server] BTC Logic Stack V3 Backend running on port ${PORT}`)
  console.log(`[Server] API: http://localhost:${PORT}/api`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Server] Shutting down...')
  server.close(() => process.exit(0))
})
process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
