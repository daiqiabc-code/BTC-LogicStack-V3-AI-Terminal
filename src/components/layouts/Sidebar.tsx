import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import {
  LayoutDashboard,
  Brain,
  TrendingUp,
  Shield,
  TestTube,
  Bot,
  Cable,
  Settings, BarChart3,
  ChevronLeft, ChevronRight,
  Sun, Moon, Bitcoin,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

const navItems: NavItem[] = [
  { label: '控制台', icon: <LayoutDashboard size={18} />, path: '/' },
  { label: '评分引擎', icon: <Brain size={18} />, path: '/logic-stack' },
  { label: '行情图表', icon: <BarChart3 size={18} />, path: '/market-chart' },
  { label: '交易信号', icon: <TrendingUp size={18} />, path: '/signals' },
  { label: '风险管理', icon: <Shield size={18} />, path: '/risk' },
  { label: '回测中心', icon: <TestTube size={18} />, path: '/backtest' },
  { label: 'AI委员会', icon: <Bot size={18} />, path: '/ai-committee' },
  { label: 'API配置', icon: <Cable size={18} />, path: '/api-config' },
  { label: '系统设置', icon: <Settings size={18} />, path: '/settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside
      className={cn(
        'h-screen bg-card border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-signal-blue/20">
          <Bitcoin size={18} className="text-signal-blue" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground leading-tight">LogicStack V3</span>
            <span className="text-[10px] text-muted-foreground">AI量化交易终端</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-border px-2 py-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>收起</span>}
        </button>
      </div>
    </aside>
  )
}
