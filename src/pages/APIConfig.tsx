import { useState, useEffect } from 'react'
import { Globe, Webhook, Bot, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { configApi } from '@/lib/api'

interface ApiState { exchange: string; connected: boolean; apiKey: string; secretKey: string; passphrase: string }

const defaultApis = [
  { name: 'Binance Futures', fields: ['API密钥', 'Secret密钥'], needsPassphrase: false },
  { name: 'OKX API', fields: ['API密钥', 'Secret密钥', 'Passphrase'], needsPassphrase: true },
  { name: 'TradingView Webhook', fields: ['Webhook地址', '密钥'], needsPassphrase: false },
  { name: 'AI模型API', fields: ['接口地址', 'API密钥'], needsPassphrase: false },
]

export default function APIConfig() {
  const [tradingMode, setTradingMode] = useState<'paper' | 'live'>('paper')
  const [states, setStates] = useState<Record<string, ApiState>>({})
  const [statusMsg, setStatusMsg] = useState<{ exchange: string; msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    configApi.list().then(res => {
      if (res.success && res.data) {
        const map: Record<string, ApiState> = {}
        for (const cfg of res.data) map[cfg.exchange] = { exchange: cfg.exchange, connected: cfg.is_connected === 1 || cfg.is_connected === true, apiKey: '', secretKey: '', passphrase: '' }
        setStates(map)
      }
    }).catch(() => {})
  }, [])

  const getState = (name: string) => states[name] || { exchange: name, connected: false, apiKey: '', secretKey: '', passphrase: '' }

  const handleSave = async (name: string) => {
    const s = getState(name); const res = await configApi.save({ exchange: name, api_key: s.apiKey, secret_key: s.secretKey, passphrase: s.passphrase || undefined })
    if (res.success) { setStates(prev => ({ ...prev, [name]: { ...s, connected: true } })); setStatusMsg({ exchange: name, msg: '连接成功', ok: true }) }
    else setStatusMsg({ exchange: name, msg: res.error || '连接失败', ok: false })
  }

  const handleDisconnect = async (name: string) => {
    await configApi.disconnect(name); setStates(prev => ({ ...prev, [name]: { ...getState(name), connected: false } }))
    setStatusMsg({ exchange: name, msg: '已断开', ok: true })
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-lg font-bold">API配置中心</h1><p className="text-xs text-muted-foreground mt-1">自动化接口配置 · 后端运行于 localhost:3001</p></div>

      <div className="trading-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield size={16} className="text-signal-blue" /><span className="trading-label">交易模式</span></div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${tradingMode === 'paper' ? 'text-bull' : 'text-muted-foreground'}`}>模拟交易</span>
            <button onClick={() => setTradingMode(tradingMode === 'paper' ? 'live' : 'paper')} className={`relative w-12 h-6 rounded-full transition-colors ${tradingMode === 'live' ? 'bg-bear' : 'bg-bull'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${tradingMode === 'live' ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-xs font-medium ${tradingMode === 'live' ? 'text-bear' : 'text-muted-foreground'}`}>实盘交易</span>
          </div>
        </div>
        {tradingMode === 'live' && <div className="mt-2 p-2 rounded bg-bear/10 border border-bear/20"><div className="flex items-center gap-1.5 text-xs text-bear"><Shield size={12} /><span>⚠️ 实盘模式 — 真实资金风险！请谨慎操作。</span></div></div>}
        <div className="mt-2 p-2 rounded bg-bull/10 border border-bull/20"><div className="flex items-center gap-1.5 text-xs text-bull"><CheckCircle size={12} /><span>✅ 模拟模式 — 仅模拟交易，无真实资金风险。</span></div></div>
      </div>

      {statusMsg && <div className={`p-2 rounded text-xs flex items-center gap-2 ${statusMsg.ok ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'}`}>{statusMsg.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}{statusMsg.exchange}: {statusMsg.msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {defaultApis.map((api) => {
          const state = getState(api.name)
          const Icon = api.name === 'Binance Futures' || api.name === 'OKX API' ? Globe : api.name.includes('Webhook') ? Webhook : Bot
          const fieldKeys = api.needsPassphrase ? ['apiKey', 'secretKey', 'passphrase'] : ['apiKey', 'secretKey']
          return (
            <div key={api.name} className="trading-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Icon size={16} className="text-signal-blue" /><span className="trading-label">{api.name}</span></div>
                <span className={`flex items-center gap-1 text-xs ${state.connected ? 'text-bull' : 'text-muted-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${state.connected ? 'bg-bull' : 'bg-muted-foreground'}`} />
                  {state.connected ? '已连接' : '未连接'}
                </span>
              </div>
              <div className="space-y-2">{api.fields.map((label, i) => (
                <div key={label}><label className="text-xs text-muted-foreground mb-0.5 block">{label}</label>
                  <input type="password" placeholder="····················" value={state[fieldKeys[i]] || ''} onChange={(e) => setStates(prev => ({ ...prev, [api.name]: { ...getState(api.name), [fieldKeys[i]]: e.target.value } }))}
                    className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary" /></div>
              ))}</div>
              <button onClick={() => state.connected ? handleDisconnect(api.name) : handleSave(api.name)}
                className={`w-full mt-3 py-2 rounded text-sm font-medium transition-colors ${state.connected ? 'bg-muted text-muted-foreground hover:bg-accent' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>
                {state.connected ? '断开连接' : '连接'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="trading-card">
        <div className="flex items-center gap-2 mb-2"><RefreshCw size={14} className="text-signal-blue" /><span className="trading-label">后端状态</span></div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-bull" /><span>后端API: localhost:3001</span>
          <span className="text-muted-foreground">|</span><span>数据库: JSON文件存储</span>
          <span className="text-muted-foreground">|</span><span>模拟交易: 已启用</span>
        </div>
      </div>
    </div>
  )
}
