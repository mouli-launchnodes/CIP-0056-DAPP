'use client'

import { ReactNode, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TopNavbar } from '@/components/top-navbar'
import { Navigation } from '@/components/navigation'

interface AppLayoutProps {
  children: ReactNode
  userPartyId: string
}

export function AppLayout({ children, userPartyId }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }

  const handleMobileMenuToggle = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      >
        Skip to main content
      </a>
      
      {/* Navigation Sidebar - Rendered at root level */}
      <Navigation 
        onMobileMenuToggle={handleMobileMenuToggle}
        onSidebarToggle={handleSidebarToggle}
      />
      
      {/* Top Navbar */}
      <TopNavbar 
        userPartyId={userPartyId} 
        onSidebarToggle={handleSidebarToggle}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={handleMobileMenuToggle}
      />
      
      {/* Main Content Area */}
      <main 
        id="main-content"
        className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        role="main"
        aria-label="Main content"
      >
        <div className="page-container">
          {children}
        </div>
      </main>
      
      <Toaster />
    </div>
  )
}