import { useState } from 'react'
import { Shield, Calculator, AlertTriangle, PlayCircle } from 'lucide-react'

export default function Risk() {
  const [balance, setBalance] = useState(50000)
  const [riskPercent, setRiskPercent] = useState(1)
  const [entryPrice, setEntryPrice] = useState(68700)
  const [consecutiveLosses, setConsecutiveLosses] = useState(0)

  const riskAmount = balance * (riskPercent / 100)
  const stopLossDistance = entryPrice * 0.015
  const stopLossPrice = entryPrice - stopLossDistance
  const positionSize = riskAmount / stopLossDistance
  const maxLoss = riskAmount

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-lg font-bold">风险管理中心</h1><p className="text-xs text-muted-foreground mt-1">仓位计算 · 连续亏损保护 · 风险控制</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="trading-card">
          <div className="flex items-center gap-2 mb-4"><Calculator size={16} className="text-signal-blue" /><span className="trading-label">仓位计算器</span></div>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">账户资金 ($)</label>
              <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">每笔风险 (%)</label>
              <input type="number" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">入场价 ($)</label>
              <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary" /></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between p-2 rounded bg-muted/20"><span className="text-xs text-muted-foreground">风险金额</span><span className="text-sm font-mono font-semibold text-bear">${riskAmount.toFixed(2)}</span></div>
            <div className="flex justify-between p-2 rounded bg-muted/20"><span className="text-xs text-muted-foreground">仓位数量 (BTC)</span><span className="text-sm font-mono font-semibold">{positionSize.toFixed(4)}</span></div>
            <div className="flex justify-between p-2 rounded bg-muted/20"><span className="text-xs text-muted-foreground">止损价</span><span className="text-sm font-mono font-semibold text-bear">${stopLossPrice.toFixed(2)}</span></div>
            <div className="flex justify-between p-2 rounded bg-muted/20"><span className="text-xs text-muted-foreground">最大亏损</span><span className="text-sm font-mono font-semibold text-bear">${maxLoss.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="trading-card">
          <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-signal-blue" /><span className="trading-label">连续亏损保护</span></div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-muted/20">
              <span className="text-sm text-muted-foreground">连续亏损次数</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setConsecutiveLosses(Math.max(0, consecutiveLosses - 1))} className="w-7 h-7 rounded bg-muted flex items-center justify-center text-sm hover:bg-accent">-</button>
                <span className={`text-lg font-bold font-mono ${consecutiveLosses >= 3 ? 'text-bear' : 'text-foreground'}`}>{consecutiveLosses}</span>
                <button onClick={() => setConsecutiveLosses(consecutiveLosses + 1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center text-sm hover:bg-accent">+</button>
              </div>
            </div>
            {consecutiveLosses >= 3 ? (
              <div className="p-3 rounded bg-bear/10 border border-bear/20">
                <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-bear" /><span className="text-sm font-semibold text-bear">交易已暂停！</span></div>
                <p className="text-xs text-muted-foreground mt-1">检测到3次连续亏损。系统自动暂停交易24小时，防止报复性交易。</p>
                <div className="mt-2 text-xs text-muted-foreground">暂停至: {new Date(Date.now() + 86400000).toLocaleString('zh-CN')}</div>
              </div>
            ) : (
              <div className="p-3 rounded bg-bull/10 border border-bull/20">
                <div className="flex items-center gap-2"><PlayCircle size={16} className="text-bull" /><span className="text-sm font-semibold text-bull">交易正常</span></div>
                <p className="text-xs text-muted-foreground mt-1">风险在正常范围内。剩余 {3 - consecutiveLosses} 次亏损后触发自动暂停。</p>
              </div>
            )}
          </div>
          <div className="mt-4"><div className="trading-label mb-2">风控规则</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-bull" /><span>每笔最大风险：账户的 {riskPercent}%</span></div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-signal-yellow" /><span>连续3次亏损 → 自动暂停24小时</span></div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-signal-blue" /><span>每日最大亏损：账户的 5%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
