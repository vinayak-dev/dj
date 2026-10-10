import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import { FileText } from 'lucide-react'

export default function FormsPage() {
  return (
    <AppLayout>
      <Header title="Forms" subtitle="Create and manage customer-facing forms" />
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
        <FileText size={44} className="mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Forms</p>
        <p className="text-xs mt-1">Build custom order forms for your customers. Coming soon.</p>
      </div>
    </AppLayout>
  )
}
