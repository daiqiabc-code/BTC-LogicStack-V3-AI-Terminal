import { Router } from 'express'
import { getAll, insert, update, query } from '../database.js'

export const apiConfigRoutes = Router()

apiConfigRoutes.get('/', (req, res) => {
  try {
    const rows = getAll('api_config').map(r => ({ exchange: r.exchange, is_connected: r.is_connected, extra_config: r.extra_config, updated_at: r._created_at }))
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

apiConfigRoutes.post('/save', (req, res) => {
  try {
    const { exchange, api_key, secret_key, passphrase } = req.body
    if (!exchange) return res.status(400).json({ success: false, error: 'Exchange name required' })
    const encrypt = (s) => s ? Buffer.from(s).toString('base64') : ''
    const extra = passphrase ? JSON.stringify({ passphrase: encrypt(passphrase) }) : '{}'
    const existing = query('api_config', c => c.exchange === exchange)
    if (existing.length > 0) {
      update('api_config', 'exchange', exchange, { api_key_encrypted: encrypt(api_key || ''), secret_key_encrypted: encrypt(secret_key || ''), extra_config: extra, is_connected: 1 })
    } else {
      insert('api_config', { exchange, api_key_encrypted: encrypt(api_key || ''), secret_key_encrypted: encrypt(secret_key || ''), extra_config: extra, is_connected: 1 })
    }
    res.json({ success: true, message: `${exchange} config saved` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

apiConfigRoutes.delete('/:exchange', (req, res) => {
  try {
    update('api_config', 'exchange', req.params.exchange, { is_connected: 0 })
    res.json({ success: true, message: `${req.params.exchange} disconnected` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

apiConfigRoutes.post('/test', (req, res) => {
  try {
    res.json({ success: true, message: `${req.body.exchange} test: connection OK (simulated)` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
