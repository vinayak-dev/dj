import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import { Zap } from 'lucide-react'

export default function AutomationsPage() {
  return (
    <AppLayout>
      <Header title="Automations" subtitle="Automate repetitive tasks and workflows" />
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
        <Zap size={44} className="mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Automations</p>
        <p className="text-xs mt-1">Set up automatic actions for your orders and customers. Coming soon.</p>
      </div>
    </AppLayout>
  )
}
