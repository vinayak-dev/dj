import Sidebar from './Sidebar'
import { LayoutProvider } from '../../contexts/LayoutContext'

function AppLayoutInner({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default function AppLayout({ children }) {
  return (
    <LayoutProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </LayoutProvider>
  )
}
