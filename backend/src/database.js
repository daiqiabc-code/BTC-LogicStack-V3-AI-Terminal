// ============================================================
// Database Layer — JSON file store (PostgreSQL-ready schema)
// BTC Logic Stack V3 Backend
// For production, swap to PostgreSQL / better-sqlite3
// ============================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'btc-v3.json')

let store = {}

function getDbPath(collection) {
  return path.join(DATA_DIR, `${collection}.json`)
}

function readCollection(collection) {
  const p = getDbPath(collection)
  if (!fs.existsSync(p)) return []
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch { return [] }
}

function writeCollection(collection, data) {
  const p = getDbPath(collection)
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

export function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  // Initialize empty collections
  const collections = ['market_data', 'signals', 'backtest_results', 'trade_history', 'risk_logs', 'ai_predictions', 'api_config']
  for (const c of collections) {
    if (!fs.existsSync(getDbPath(c))) writeCollection(c, [])
  }
  console.log('[DB] Initialized at', DATA_DIR)
}

// ============================================================
// Generic CRUD operations
// ============================================================

export function getAll(collection) {
  return readCollection(collection)
}

export function getLatest(collection) {
  const data = readCollection(collection)
  return data.length > 0 ? data[data.length - 1] : null
}

export function getById(collection, idField, id) {
  const data = readCollection(collection)
  return data.find(item => item[idField] === id) || null
}

export function insert(collection, item) {
  const data = readCollection(collection)
  item._id = data.length + 1
  item._created_at = new Date().toISOString()
  data.push(item)
  writeCollection(collection, data)
  return item
}

export function update(collection, idField, id, updates) {
  const data = readCollection(collection)
  const idx = data.findIndex(item => item[idField] === id)
  if (idx === -1) return null
  data[idx] = { ...data[idx], ...updates, _updated_at: new Date().toISOString() }
  writeCollection(collection, data)
  return data[idx]
}

export function query(collection, filterFn) {
  return readCollection(collection).filter(filterFn)
}

export function count(collection, filterFn) {
  return readCollection(collection).filter(filterFn).length
}
