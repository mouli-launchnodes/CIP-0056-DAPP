'use client'

import { Copy, LogOut, User, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ThemeToggle } from './theme-toggle'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useReducedMotion, getAnimationConfig, getSpringConfig } from '@/hooks/use-reduced-motion'

interface TopNavbarProps {
  userPartyId: string
  onSidebarToggle?: (collapsed: boolean) => void
  isMobileMenuOpen?: boolean
  onMobileMenuToggle?: (isOpen: boolean) => void
}

export function TopNavbar({ userPartyId, onSidebarToggle, isMobileMenuOpen, onMobileMenuToggle }: TopNavbarProps) {
  const { user } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const animationConfig = getAnimationConfig(prefersReducedMotion)
  const springConfig = getSpringConfig(prefersReducedMotion)

  // Add scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const copyPartyId = () => {
    navigator.clipboard.writeText(userPartyId)
    toast.success('Party ID copied to clipboard!')
  }

  const handleLogout = () => {
    localStorage.removeItem('userPartyId')
    localStorage.removeItem('userEmail')
    window.location.href = '/auth/logout'
  }

  const formatPartyId = (partyId: string) => {
    if (!partyId) return 'Loading...'
    if (partyId.length <= 12) return partyId
    return `${partyId.substring(0, 6)}...${partyId.substring(partyId.length - 6)}`
  }

  const getUserInitials = (user: any) => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const MotionWrapper = prefersReducedMotion ? 'nav' : motion.nav
  const MotionButton = prefersReducedMotion ? 'button' : motion.button
  const MotionDiv = prefersReducedMotion ? 'div' : motion.div

  const navbarMotionProps = prefersReducedMotion ? {} : {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 30,
      duration: 0.6 
    }
  }

  const buttonMotionProps = prefersReducedMotion ? {} : {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: springConfig
  }

  return (
    <Tooltip.Provider>
      <MotionWrapper 
        className={`top-navbar ${isScrolled ? 'scrolled' : ''}`}
        {...navbarMotionProps}
      >
        <div className="navbar-content">
          {/* Left side - Mobile menu only */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Toggle Button - Larger touch target */}
            <MotionButton
              onClick={() => onMobileMenuToggle?.(!isMobileMenuOpen)}
              className="mobile-menu-button lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
              {...buttonMotionProps}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <MotionDiv
                    key="close"
                    {...(prefersReducedMotion ? {} : {
                      initial: { rotate: -90, opacity: 0 },
                      animate: { rotate: 0, opacity: 1 },
                      exit: { rotate: 90, opacity: 0 },
                      transition: { duration: 0.2 }
                    })}
                  >
                    <X className="h-5 w-5" />
                  </MotionDiv>
                ) : (
                  <MotionDiv
                    key="menu"
                    {...(prefersReducedMotion ? {} : {
                      initial: { rotate: 90, opacity: 0 },
                      animate: { rotate: 0, opacity: 1 },
                      exit: { rotate: -90, opacity: 0 },
                      transition: { duration: 0.2 }
                    })}
                  >
                    <Menu className="h-5 w-5" />
                  </MotionDiv>
                )}
              </AnimatePresence>
            </MotionButton>
          </div>

          {/* Right side - Responsive layout */}
          <div className="navbar-right">
            {/* Party ID Display - Responsive */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <MotionDiv 
                  className="party-id-display"
                  {...(prefersReducedMotion ? {} : {
                    whileHover: { scale: 1.02 },
                    transition: springConfig
                  })}
                >
                  <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="party-id-text text-xs md:text-sm" title={userPartyId}>
                    {formatPartyId(userPartyId)}
                  </span>
                  <MotionButton
                    onClick={copyPartyId}
                    className="copy-button min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Copy Party ID"
                    {...(prefersReducedMotion ? {} : {
                      whileHover: { scale: 1.1 },
                      whileTap: { scale: 0.9 }
                    })}
                  >
                    <Copy className="h-3 w-3" />
                  </MotionButton>
                </MotionDiv>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-black text-white px-2 py-1 rounded text-xs z-50"
                  sideOffset={5}
                >
                  <MotionDiv
                    {...(prefersReducedMotion ? {} : {
                      initial: { opacity: 0, scale: 0.8 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0, scale: 0.8 }
                    })}
                  >
                    Click to copy full Party ID
                  </MotionDiv>
                  <Tooltip.Arrow className="fill-black" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown - Mobile optimized */}
            {user && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <MotionButton 
                    className="user-profile min-w-[44px] min-h-[44px]"
                    {...buttonMotionProps}
                  >
                    <div className="user-avatar">
                      {user.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name || 'User'} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold">
                          {getUserInitials(user)}
                        </span>
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-medium text-foreground truncate max-w-24">
                        {user.name || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-24">
                        {user.email}
                      </div>
                    </div>
                  </MotionButton>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="bg-card border border-border rounded-lg shadow-lg p-2 min-w-48 z-50"
                    sideOffset={5}
                  >
                    <MotionDiv
                      {...(prefersReducedMotion ? {} : {
                        initial: { opacity: 0, scale: 0.95, y: -10 },
                        animate: { opacity: 1, scale: 1, y: 0 },
                        exit: { opacity: 0, scale: 0.95, y: -10 },
                        transition: { duration: 0.2 }
                      })}
                    >
                      <DropdownMenu.Item className="flex items-center gap-2 p-3 text-sm hover:bg-accent rounded cursor-pointer min-h-[44px]">
                        <User className="h-4 w-4" />
                        Profile
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-border my-1" />
                      <DropdownMenu.Item 
                        className="flex items-center gap-2 p-3 text-sm hover:bg-accent rounded cursor-pointer text-destructive min-h-[44px]"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </DropdownMenu.Item>
                    </MotionDiv>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>
        </div>
      </MotionWrapper>
    </Tooltip.Provider>
  )
}