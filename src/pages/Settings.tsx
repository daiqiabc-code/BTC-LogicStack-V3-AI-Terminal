import { Settings as SettingsIcon, FileText, Database, Bell, Palette } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  const sections = [
    { title: '显示', icon: Palette, items: [
      { label: '主题', control: <button onClick={toggleTheme} className="px-3 py-1.5 rounded bg-muted text-sm font-medium hover:bg-accent transition-colors">{theme === 'dark' ? '🌙 暗色' : '☀️ 亮色'}</button> },
      { label: '时区', control: <span className="text-sm text-muted-foreground">Asia/Shanghai (UTC+8)</span> },
    ]},
    { title: '数据', icon: Database, items: [
      { label: '自动刷新', control: <span className="text-sm text-muted-foreground">每5秒</span> },
      { label: '数据源', control: <span className="text-sm text-muted-foreground">Binance合约</span> },
    ]},
    { title: '通知', icon: Bell, items: [
      { label: '信号提醒', control: <span className="text-sm text-bull">已开启</span> },
      { label: '风险警告', control: <span className="text-sm text-signal-yellow">已开启</span> },
    ]},
    { title: '报告', icon: FileText, items: [
      { label: '每日交易报告', control: <span className="text-sm text-bull">自动生成</span> },
      { label: '报告时间', control: <span className="text-sm text-muted-foreground">00:00 UTC+8</span> },
    ]},
  ]

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-lg font-bold">系统设置</h1><p className="text-xs text-muted-foreground mt-1">全局配置与偏好设置</p></div>
      <div className="space-y-4">{sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="trading-card">
            <div className="flex items-center gap-2 mb-3"><Icon size={16} className="text-signal-blue" /><span className="trading-label">{section.title}</span></div>
            <div className="space-y-2">{section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded bg-muted/20"><span className="text-sm text-muted-foreground">{item.label}</span>{item.control}</div>
            ))}</div>
          </div>
        )
      })}</div>
    </div>
  )
}
