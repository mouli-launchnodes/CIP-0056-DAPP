'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useReducedMotion, getSpringConfig } from '@/hooks/use-reduced-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-14 h-8 bg-gray-200 rounded-full opacity-50" />
    )
  }

  const springConfig = getSpringConfig(prefersReducedMotion)
  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div
  const motionProps = prefersReducedMotion ? {} : {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: {
      type: "spring" as const,
      stiffness: springConfig.stiffness,
      damping: springConfig.damping,
      mass: springConfig.mass
    }
  }

  return (
    <MotionWrapper
      className="flex items-center"
      {...motionProps}
    >
      <button
        onClick={toggleTheme}
        className="h-10 w-10 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <AnimatePresence mode="wait">
          {theme === 'light' ? (
            <motion.div
              key="sun"
              initial={prefersReducedMotion ? {} : { rotate: -90, opacity: 0 }}
              animate={prefersReducedMotion ? {} : { rotate: 0, opacity: 1 }}
              exit={prefersReducedMotion ? {} : { rotate: 90, opacity: 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.2 }}
            >
              <Sun className="h-5 w-5 text-amber-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={prefersReducedMotion ? {} : { rotate: 90, opacity: 0 }}
              animate={prefersReducedMotion ? {} : { rotate: 0, opacity: 1 }}
              exit={prefersReducedMotion ? {} : { rotate: -90, opacity: 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.2 }}
            >
              <Moon className="h-5 w-5 text-blue-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <span className="sr-only">
        Current theme: {theme}. Click to switch to {theme === 'light' ? 'dark' : 'light'} mode.
      </span>
    </MotionWrapper>
  )
}