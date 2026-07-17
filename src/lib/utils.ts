import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format number with commas */
export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
  return num.toFixed(decimals)
}

/** Format price */
export function formatPrice(price: number): string {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Format percentage */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/** Format timestamp to readable date */
export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

/** Get color for score */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 75) return '#ffd600'
  return '#6b7280'
}

/** Get color for market trend */
export function getTrendColor(trend: 'bull' | 'bear' | 'range'): string {
  const colors = { bull: '#22c55e', bear: '#ef4444', range: '#ffd600' }
  return colors[trend]
}

/** Format currency with symbol detection */
export function formatCurrency(value: number, currency: 'USD' | 'CNY' | 'BTC' = 'USD'): string {
  const symbols = { USD: '$', CNY: '¥', BTC: '₿' }
  return symbols[currency] + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
