import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import useStore from '../../store/useStore'

export default function Layout({ children }) {
  const sidebarOpen = useStore(s => s.sidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scroll p-5 md:p-8">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
