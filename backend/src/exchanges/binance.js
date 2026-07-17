// ============================================================
// Binance Futures API Service
// Handles real & simulated orders for Binance USDⓈ-M
// ============================================================

import crypto from 'crypto'

const BASE = 'https://fapi.binance.com'

/** Create Binance signed request headers */
function createHeaders(apiKey, secretKey, queryString = '') {
  const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex')
  return {
    'X-MBX-APIKEY': apiKey,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

/** Place a real limit/market order on Binance Futures */
export async function placeOrder({ apiKey, secretKey, symbol, side, type, quantity, price, reduceOnly = false }) {
  const params = new URLSearchParams({
    symbol: symbol || 'BTCUSDT',
    side: side || 'BUY', // BUY or SELL
    type: type || 'MARKET', // MARKET or LIMIT
    quantity: quantity.toString(),
    timestamp: Date.now().toString(),
  })
  if (type === 'LIMIT' && price) params.append('price', price.toString())
  if (type === 'LIMIT') params.append('timeInForce', 'GTC')
  if (reduceOnly) params.append('reduceOnly', 'true')

  const queryString = params.toString()
  const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex')
  params.append('signature', signature)

  try {
    const res = await fetch(`${BASE}/fapi/v1/order`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.msg || 'Binance order failed')
    return { success: true, orderId: data.orderId, price: parseFloat(data.price), status: data.status }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** Get Binance Futures account balance */
export async function getBalance(apiKey, secretKey) {
  const timestamp = Date.now().toString()
  const queryString = `timestamp=${timestamp}`
  const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex')

  try {
    const res = await fetch(`${BASE}/fapi/v2/account?timestamp=${timestamp}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    })
    const data = await res.json()
    const usdt = data.assets?.find(a => a.asset === 'USDT')
    return { success: true, balance: parseFloat(usdt?.walletBalance || 0), available: parseFloat(usdt?.availableBalance || 0) }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** Get Binance current positions */
export async function getPositions(apiKey, secretKey) {
  const timestamp = Date.now().toString()
  const queryString = `timestamp=${timestamp}`
  const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex')

  try {
    const res = await fetch(`${BASE}/fapi/v2/positionRisk?timestamp=${timestamp}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    })
    const data = await res.json()
    return {
      success: true,
      positions: data.filter(p => parseFloat(p.positionAmt) !== 0).map(p => ({
        symbol: p.symbol,
        size: parseFloat(p.positionAmt),
        entryPrice: parseFloat(p.entryPrice),
        pnl: parseFloat(p.unRealizedProfit),
        leverage: parseInt(p.leverage),
      })),
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
