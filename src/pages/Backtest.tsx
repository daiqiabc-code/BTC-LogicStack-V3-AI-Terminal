import { useState, useCallback } from 'react'
import { BarChart3, TrendingUp, Clock, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchKlines } from '@/lib/binance'
import { runBacktest } from '@/lib/backtest'
import type { BacktestResult } from '@/types'

export default function Backtest() {
  const [period, setPeriod] = useState('4h')
  const [results, setResults] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = useCallback(async () => {
    try {
      setLoading(true); const limit = period === '15m' ? 500 : period === '1h' ? 300 : 200
      const klines = await fetchKlines('BTCUSDT', period, limit)
      setResults(runBacktest(klines))
    } catch (err) { console.error('回测失败:', err) }
    finally { setLoading(false) }
  }, [period])

  const equityCurve = results?.equityCurve ?? []

  const metrics = results ? [
    { label: '年化收益', value: `${results.cagr}%` }, { label: '夏普比率', value: results.sharpe },
    { label: '索提诺', value: results.sortino }, { label: '卡玛比率', value: results.calmar },
    { label: '最大回撤', value: `${results.maxDrawdown}%` }, { label: '胜率', value: `${results.winRate}%` },
    { label: '盈亏比', value: results.profitFactor }, { label: '平均R值', value: results.averageR },
    { label: '总交易数', value: results.totalTrades },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold">回测中心</h1><p className="text-xs text-muted-foreground mt-1">策略回测验证 · 实时数据驱动</p></div>
        {results && <div className="text-xs text-muted-foreground">{results.totalTrades} 笔交易 · 最后运行: 现在</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="trading-card">
          <div className="flex items-center gap-2 mb-3"><BarChart3 size={16} className="text-signal-blue" /><span className="trading-label">数据来源</span></div>
          <div className="text-xs text-muted-foreground"><p className="mb-2">使用 Binance 合约实时数据</p>
            <div className="p-2 rounded bg-muted/20 font-mono text-[10px]">BTCUSDT · {period} · {period === '15m' ? 500 : period === '1h' ? 300 : 200}根K线</div>
          </div>
        </div>
        <div className="trading-card">
          <div className="flex items-center gap-2 mb-3"><Clock size={16} className="text-signal-blue" /><span className="trading-label">测试周期</span></div>
          <div className="flex gap-2 mb-3">{['15m', '1h', '4h'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>{p}</button>
          ))}</div>
          <button onClick={runTest} disabled={loading} className="w-full py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />{loading ? '运行中...' : '运行回测'}
          </button>
        </div>
        <div className="trading-card">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-signal-blue" /><span className="trading-label">快速概览</span></div>
          {results ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between p-1"><span>胜率</span><span className={`font-mono font-semibold ${results.winRate >= 50 ? 'text-bull' : 'text-bear'}`}>{results.winRate}%</span></div>
              <div className="flex justify-between p-1"><span>盈亏比</span><span className={`font-mono font-semibold ${results.profitFactor >= 1.5 ? 'text-bull' : 'text-signal-yellow'}`}>{results.profitFactor}</span></div>
              <div className="flex justify-between p-1"><span>最大回撤</span><span className="font-mono font-semibold text-bear">{results.maxDrawdown}%</span></div>
              <div className="flex justify-between p-1"><span>夏普比率</span><span className={`font-mono font-semibold ${results.sharpe >= 1 ? 'text-bull' : 'text-signal-yellow'}`}>{results.sharpe}</span></div>
            </div>
          ) : <div className="text-xs text-muted-foreground py-2">点击"运行回测"开始</div>}
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="trading-card">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-signal-blue" /><span className="trading-label">回测结果</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{metrics.map((m) => (
            <div key={m.label} className="p-3 rounded bg-muted/20 text-center">
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
              <div className={`text-sm font-mono font-semibold mt-0.5 ${typeof m.value === 'number' && m.value >= 1 ? 'text-bull' : typeof m.value === 'number' && m.value < 0 ? 'text-bear' : 'text-foreground'}`}>
                {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
              </div>
            </div>
          ))}</div>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-signal-blue" /><span className="trading-label">资金曲线</span></div>
            {equityCurve.length > 0 ? (
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs><linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 15%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 16%, 60%)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(215, 16%, 60%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ background: 'hsl(222, 47%, 7%)', border: '1px solid hsl(217, 33%, 15%)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '净值']} />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#equityGradient)" dot={false} />
                </AreaChart>
              </ResponsiveContainer></div>
            ) : <div className="h-48 rounded bg-muted/20 flex items-center justify-center"><TrendingUp size={32} className="text-muted-foreground/40" /></div>}
          </div>
        </div>
      )}
    </div>
  )
}
