import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchKlines } from '@/lib/binance'
import { LineChart, RefreshCw } from 'lucide-react'

interface ChartDataPoint {
  time: string
  price: number
  volume: number
}

function ema(data: number[], period: number): number[] {
  const result: number[] = []; const k = 2 / (period + 1)
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(prev)
  for (let i = period; i < data.length; i++) { prev = data[i] * k + prev * (1 - k); result.push(prev) }
  return result
}

export default function PriceChart() {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const loadData = async () => {
    try {
      setLoading(true); const klines = await fetchKlines('BTCUSDT', '1h', 100)
      const chartData: ChartDataPoint[] = klines.map(k => ({
        time: new Date(k.time * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit' }),
        price: k.close, volume: k.volume,
      }))
      setData(chartData)
    } catch (err) { console.error('图表数据加载失败:', err) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])

  if (loading) return (
    <div className="trading-card"><div className="flex items-center justify-center h-48 text-xs text-muted-foreground">加载图表数据...</div></div>
  )

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0
  const prevPrice = data.length > 1 ? data[data.length - 2].price : currentPrice
  const isUp = currentPrice >= prevPrice

  return (
    <div className="trading-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LineChart size={16} className="text-signal-blue" />
          <span className="trading-label">BTC/USDT · 1小时</span>
          <span className={`text-sm font-mono font-semibold ${isUp ? 'text-bull' : 'text-bear'}`}>${currentPrice.toLocaleString()}</span>
        </div>
        <button onClick={loadData} className="text-muted-foreground hover:text-foreground"><RefreshCw size={14} /></button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs><linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2979ff" stopOpacity={0.3} /><stop offset="95%" stopColor="#2979ff" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 15%)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215, 16%, 60%)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(215, 16%, 60%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
            <Tooltip contentStyle={{ background: 'hsl(222, 47%, 7%)', border: '1px solid hsl(217, 33%, 15%)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '价格']} />
            <Area type="monotone" dataKey="price" stroke="#2979ff" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>最高: ${Math.max(...data.map(d => d.price)).toLocaleString()}</span>
        <span>最低: ${Math.min(...data.map(d => d.price)).toLocaleString()}</span>
        <span>波幅: ${(Math.max(...data.map(d => d.price)) - Math.min(...data.map(d => d.price))).toLocaleString()}</span>
      </div>
    </div>
  )
}
