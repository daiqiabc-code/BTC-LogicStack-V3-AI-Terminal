import { Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/layouts/Sidebar'
import Dashboard from '@/pages/Dashboard'
import LogicStack from '@/pages/LogicStack'
import Signals from '@/pages/Signals'
import Risk from '@/pages/Risk'
import Backtest from '@/pages/Backtest'
import AICommittee from '@/pages/AICommittee'
import MarketChart from '@/pages/MarketChart'
import APIConfig from '@/pages/APIConfig'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logic-stack" element={<LogicStack />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/market-chart" element={<MarketChart />} />
          <Route path="/ai-committee" element={<AICommittee />} />
          <Route path="/api-config" element={<APIConfig />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
