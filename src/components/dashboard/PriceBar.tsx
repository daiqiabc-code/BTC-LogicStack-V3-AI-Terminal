import { formatPrice, formatPercent, formatNumber } from '@/lib/utils'
import type { MarketOverview } from '@/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PriceBarProps {
  data: MarketOverview | null
}

export default function PriceBar({ data }: PriceBarProps) {
  if (!data) {
    return (
      <div className="h-16 bg-card border-b border-border flex items-center px-6 gap-6">
        <div className="text-sm text-muted-foreground">加载BTC数据中...</div>
      </div>
    )
  }

  const isUp = data.changePercent24h >= 0
  const trendColor = isUp ? 'text-bull' : 'text-bear'
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  return (
    <div className="h-16 bg-card border-b border-border flex items-center px-6 gap-6 overflow-x-auto shrink-0">
      {/* BTC Price */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xl font-bold font-mono">{formatPrice(data.price)}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon size={14} />
          {formatPercent(data.changePercent24h)}
        </span>
      </div>

      <div className="w-px h-8 bg-border" />

      {/* Volume */}
      <div className="flex flex-col shrink-0">
        <span className="trading-label">24h成交量</span>
        <span className="text-sm font-semibold font-mono">{formatNumber(data.volume24h)}</span>
      </div>

      {/* Funding Rate */}
      <div className="flex flex-col shrink-0">
        <span className="trading-label">资金费率</span>
        <span className={`text-sm font-semibold font-mono ${data.fundingRate > 0.0008 ? 'text-signal-yellow' : data.fundingRate < -0.0005 ? 'text-bull' : 'text-foreground'}`}>
          {formatPercent(data.fundingRate * 100)}
        </span>
      </div>

      {/* Open Interest */}
      <div className="flex flex-col shrink-0">
        <span className="trading-label">持仓量</span>
        <span className="text-sm font-semibold font-mono">{formatNumber(data.openInterest)}</span>
      </div>

      {/* Fear & Greed */}
      <div className="flex flex-col shrink-0">
        <span className="trading-label">恐惧贪婪指数</span>
        <span className={`text-sm font-semibold font-mono ${
          data.fearGreedIndex >= 75 ? 'text-signal-yellow' : 
          data.fearGreedIndex <= 25 ? 'text-bear' : 'text-foreground'
        }`}>
          {data.fearGreedIndex}/100
        </span>
      </div>

      <div className="w-px h-8 bg-border" />

      {/* Market Regime Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          data.regime === 'bull' ? 'bg-bull/15 text-bull' :
          data.regime === 'bear' ? 'bg-bear/15 text-bear' :
          'bg-yellow-400/15 text-yellow-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            data.regime === 'bull' ? 'bg-bull' :
            data.regime === 'bear' ? 'bg-bear' : 'bg-yellow-400'
          }`} />
          {data.regime === 'bull' ? '多头趋势' : data.regime === 'bear' ? '空头趋势' : '震荡'}
        </span>
        <span className="text-xs text-muted-foreground">
          置信度 {data.regimeConfidence}%
        </span>
      </div>
    </div>
  )
}
