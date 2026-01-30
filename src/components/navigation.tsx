'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Plus, Coins, ArrowRightLeft, Eye, Flame, ChevronLeft, ChevronRight, Activity } from '@/lib/icons'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Create Token', href: '/create-token', icon: Plus },
  { name: 'Mint Tokens', href: '/mint', icon: Coins },
  { name: 'Transfer Tokens', href: '/transfer', icon: ArrowRightLeft },
  { name: 'View Holdings', href: '/holdings', icon: Eye },
  { name: 'Burn Tokens', href: '/burn', icon: Flame },
  { name: 'Transactions', href: '/transactions', icon: Activity },
]

interface NavigationProps {
  onMobileMenuToggle?: (isOpen: boolean) => void
  onSidebarToggle?: (isCollapsed: boolean) => void
}

export function Navigation({ onMobileMenuToggle, onSidebarToggle }: NavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktopSize = window.innerWidth >= 1024
      setIsDesktop(isDesktopSize)
    }
    
    // Initial check
    checkScreenSize()
    
    // Add event listener
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)
    onMobileMenuToggle?.(newState)
  }

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    onSidebarToggle?.(newState)
  }

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    }
  }

  const menuItemVariants = {
    closed: {
      x: -20,
      opacity: 0
    },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    })
  }

  const textVariants = {
    expanded: {
      opacity: 1,
      width: 'auto',
      transition: {
        delay: 0.1,
        duration: 0.2
      }
    },
    collapsed: {
      opacity: 0,
      width: 0,
      transition: {
        duration: 0.1
      }
    }
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <motion.button
        onClick={toggleMobileMenu}
        className="mobile-menu-button lg:hidden"
        aria-label="Toggle navigation menu"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isMobileMenuOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Overlay - Only render on mobile when menu is open */}
      {!isDesktop && isMobileMenuOpen && (
        <div 
          className="mobile-overlay visible"
          onClick={() => {
            setIsMobileMenuOpen(false)
            onMobileMenuToggle?.(false)
          }}
        />
      )}

      {/* Professional Side Navigation */}
      <motion.aside 
        className={`sidebar ${isMobileMenuOpen ? 'sidebar-visible' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          width: isDesktop ? (isSidebarCollapsed ? '4rem' : '16rem') : '16rem'
        }}
        animate={{
          x: isDesktop ? 0 : (isMobileMenuOpen ? 0 : '-100%')
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40
        }}
        initial={false}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Desktop Sidebar Toggle Button */}
        {isDesktop && (
          <motion.button
            onClick={() => {
              toggleSidebar()
            }}
            className="sidebar-toggle-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <AnimatePresence mode="wait">
              {isSidebarCollapsed ? (
                <motion.div
                  key="expand"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="collapse"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
        
        {/* Navigation Header */}
        <motion.div 
          className="nav-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Link href="/dashboard" className="nav-title">
            <motion.div 
              className="nav-logo"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              C
            </motion.div>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.div
                  variants={textVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="overflow-hidden"
                >
                  <div className="font-bold whitespace-nowrap">Canton Network</div>
                  <div className="text-xs text-muted opacity-75 whitespace-nowrap">Tokenization Platform</div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </motion.div>

        {/* Navigation Content */}
        <div className="nav-content">
          <NavigationMenu.Root className="space-y-1">
            <NavigationMenu.List className="space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <NavigationMenu.Item key={item.name}>
                    <motion.div
                      variants={menuItemVariants}
                      initial="closed"
                      animate="open"
                      custom={index}
                    >
                      <NavigationMenu.Link asChild>
                        <Link 
                          href={item.href}
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            onMobileMenuToggle?.(false)
                          }}
                          className={`nav-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'nav-link-collapsed' : ''}`}
                          title={isSidebarCollapsed ? item.name : undefined}
                          aria-label={`Navigate to ${item.name}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <motion.div
                            className="flex items-center gap-3 w-full"
                            whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          >
                            <Icon className="nav-icon flex-shrink-0" />
                            <AnimatePresence>
                              {!isSidebarCollapsed && (
                                <motion.span
                                  variants={textVariants}
                                  initial="collapsed"
                                  animate="expanded"
                                  exit="collapsed"
                                  className="whitespace-nowrap overflow-hidden"
                                >
                                  {item.name}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </Link>
                      </NavigationMenu.Link>
                    </motion.div>
                  </NavigationMenu.Item>
                )
              })}
            </NavigationMenu.List>
          </NavigationMenu.Root>
        </div>
      </motion.aside>
    </>
  )
}