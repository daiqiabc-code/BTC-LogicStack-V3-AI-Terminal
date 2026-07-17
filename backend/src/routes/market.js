import { Router } from 'express'
import { getLatest, getAll, insert } from '../database.js'

export const marketRoutes = Router()

marketRoutes.get('/overview', (req, res) => {
  try {
    const data = getLatest('market_data')
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

marketRoutes.post('/save', (req, res) => {
  try {
    const item = insert('market_data', req.body)
    res.json({ success: true, id: item._id })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

marketRoutes.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const data = getAll('market_data').slice(-limit)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

marketRoutes.get('/predictions', (req, res) => {
  try {
    const data = getAll('ai_predictions').slice(-5).reverse()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
