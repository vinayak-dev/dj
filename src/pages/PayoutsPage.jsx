import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import { Wallet } from 'lucide-react'

export default function PayoutsPage() {
  return (
    <AppLayout>
      <Header title="Payouts" subtitle="Track your earnings and bank transfers" />
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
        <Wallet size={44} className="mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Payouts</p>
        <p className="text-xs mt-1">Connect your bank account to receive payouts. Coming soon.</p>
      </div>
    </AppLayout>
  )
}
