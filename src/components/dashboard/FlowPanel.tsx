import { formatPercent, formatNumber } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Waves } from 'lucide-react'

interface FlowPanelProps {
  fundingRate: number
  openInterest: number
  etfFlow: number
  whaleActivity: 'high' | 'normal' | 'low'
  longShortRatio: number
}

export default function FlowPanel({ fundingRate, openInterest, etfFlow, whaleActivity, longShortRatio }: FlowPanelProps) {
  const isFundingHigh = fundingRate > 0.0008
  const isFundingLow = fundingRate < -0.0005
  const isEtfPositive = etfFlow >= 0

  return (
    <div className="trading-card">
      <div className="flex items-center gap-2 mb-4">
        <Waves size={16} className="text-signal-blue" />
        <span className="trading-label">机构资金流</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-xs text-muted-foreground">资金费率</span>
          <div className="flex items-center gap-1">
            {isFundingHigh && <AlertTriangle size={12} className="text-signal-yellow" />}
            {isFundingLow && <AlertTriangle size={12} className="text-bull" />}
            <span className={`text-sm font-mono font-semibold ${isFundingHigh ? 'text-signal-yellow' : isFundingLow ? 'text-bull' : 'text-foreground'}`}>
              {formatPercent(fundingRate * 100)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-xs text-muted-foreground">持仓量 (OI)</span>
          <span className="text-sm font-mono font-semibold">{formatNumber(openInterest)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-xs text-muted-foreground">ETF净流入</span>
          <span className={`flex items-center gap-1 text-sm font-mono font-semibold ${isEtfPositive ? 'text-bull' : 'text-bear'}`}>
            {isEtfPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {formatNumber(Math.abs(etfFlow))}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-xs text-muted-foreground">巨鲸活跃度</span>
          <span className={`text-sm font-mono font-semibold ${whaleActivity === 'high' ? 'text-signal-yellow' : 'text-muted-foreground'}`}>
            {whaleActivity === 'high' ? '🟡 高' : whaleActivity === 'low' ? '⚪ 低' : '🟢 正常'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-xs text-muted-foreground">多空比</span>
          <span className="text-sm font-mono font-semibold">{longShortRatio.toFixed(2)}</span>
        </div>
      </div>

      {isFundingHigh && (
        <div className="mt-3 p-2 rounded bg-signal-yellow/10 border border-signal-yellow/20">
          <div className="flex items-center gap-1.5 text-xs text-signal-yellow">
            <AlertTriangle size={12} />
            <span>资金费率偏高 — 多头拥挤，建议谨慎</span>
          </div>
        </div>
      )}
      {isFundingLow && (
        <div className="mt-3 p-2 rounded bg-bull/10 border border-bull/20">
          <div className="flex items-center gap-1.5 text-xs text-bull">
            <AlertTriangle size={12} />
            <span>资金费率偏低 — 空头拥挤，可能存在机会</span>
          </div>
        </div>
      )}
    </div>
  )
}
