// ============================================================
// OKX API Service
// Handles real & simulated orders for OKX
// ============================================================

import crypto from 'crypto'

const BASE = 'https://www.okx.com'

/** Create OKX v5 REST API signature */
function signOKX(timestamp, method, requestPath, body, secretKey) {
  const message = timestamp + method + requestPath + (body || '')
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64')
}

/** Place order on OKX */
export async function placeOKXOrder({ apiKey, secretKey, passphrase, symbol, side, type, size, price }) {
  const timestamp = new Date().toISOString()
  const body = JSON.stringify({
    instId: symbol || 'BTC-USDT-SWAP',
    tdMode: 'cross',
    side: side || 'buy',
    ordType: type || 'market',
    sz: size?.toString() || '0.001',
  })
  if (type === 'limit' && price) {
    const parsedBody = JSON.parse(body)
    parsedBody.price = price.toString()
    body = JSON.stringify(parsedBody)
  }
  const sig = signOKX(timestamp, 'POST', '/api/v5/trade/order', body, secretKey)

  try {
    const res = await fetch(`${BASE}/api/v5/trade/order`, {
      method: 'POST',
      headers: {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sig,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        'Content-Type': 'application/json',
      },
      body,
    })
    const data = await res.json()
    if (data.code !== '0') throw new Error(data.msg || 'OKX order failed')
    return { success: true, orderId: data.data?.[0]?.ordId, status: 'filled' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** Get OKX account balance */
export async function getOKXBalance(apiKey, secretKey, passphrase) {
  const timestamp = new Date().toISOString()
  const sig = signOKX(timestamp, 'GET', '/api/v5/account/balance', '', secretKey)

  try {
    const res = await fetch(`${BASE}/api/v5/account/balance`, {
      headers: {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sig,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
      },
    })
    const data = await res.json()
    const usdt = data.data?.[0]?.details?.find(d => d.ccy === 'USDT')
    return { success: true, balance: parseFloat(usdt?.eq || 0), available: parseFloat(usdt?.availBal || 0) }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** Get OKX positions */
export async function getOKXPositions(apiKey, secretKey, passphrase) {
  const timestamp = new Date().toISOString()
  const sig = signOKX(timestamp, 'GET', '/api/v5/account/positions', '', secretKey)

  try {
    const res = await fetch(`${BASE}/api/v5/account/positions`, {
      headers: {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sig,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
      },
    })
    const data = await res.json()
    return {
      success: true,
      positions: (data.data || []).filter(p => parseFloat(p.pos) !== 0).map(p => ({
        symbol: p.instId,
        size: parseFloat(p.pos),
        entryPrice: parseFloat(p.avgPx),
        pnl: parseFloat(p.upl),
        leverage: parseInt(p.lever),
      })),
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
