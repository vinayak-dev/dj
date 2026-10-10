import { createContext, useContext, useState } from 'react'

const LayoutContext = createContext({
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
})

export function LayoutProvider({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <LayoutContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
