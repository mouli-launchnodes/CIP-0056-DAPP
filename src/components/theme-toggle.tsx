'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { motion, AnimatePresence } from 'framer-motion'
import * as Switch from '@radix-ui/react-switch'
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
      <Switch.Root
        className="relative w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full transition-all duration-300 data-[state=checked]:bg-gray-800 dark:data-[state=checked]:bg-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner cursor-pointer group"
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <Switch.Thumb className="block w-6 h-6 bg-white dark:bg-gray-900 rounded-full transition-all duration-300 translate-x-1 will-change-transform data-[state=checked]:translate-x-[26px] shadow-lg group-hover:shadow-xl">
          <AnimatePresence mode="wait">
            {theme === 'light' ? (
              <motion.div
                key="sun"
                className="w-full h-full flex items-center justify-center"
                initial={prefersReducedMotion ? {} : { rotate: -180, opacity: 0 }}
                animate={prefersReducedMotion ? {} : { rotate: 0, opacity: 1 }}
                exit={prefersReducedMotion ? {} : { rotate: 180, opacity: 0 }}
                transition={prefersReducedMotion ? {} : { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                className="w-full h-full flex items-center justify-center"
                initial={prefersReducedMotion ? {} : { rotate: -180, opacity: 0 }}
                animate={prefersReducedMotion ? {} : { rotate: 0, opacity: 1 }}
                exit={prefersReducedMotion ? {} : { rotate: 180, opacity: 0 }}
                transition={prefersReducedMotion ? {} : { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Moon className="h-3.5 w-3.5 text-blue-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </Switch.Thumb>
        
        {/* Background icons for better visual feedback */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <motion.div
            animate={prefersReducedMotion ? {} : {
              opacity: theme === 'light' ? 0.3 : 0.1,
              scale: theme === 'light' ? 0.8 : 0.6
            }}
            transition={prefersReducedMotion ? {} : { duration: 0.3 }}
          >
            <Sun className="h-3 w-3 text-amber-400" />
          </motion.div>
          <motion.div
            animate={prefersReducedMotion ? {} : {
              opacity: theme === 'dark' ? 0.3 : 0.1,
              scale: theme === 'dark' ? 0.8 : 0.6
            }}
            transition={prefersReducedMotion ? {} : { duration: 0.3 }}
          >
            <Moon className="h-3 w-3 text-blue-300" />
          </motion.div>
        </div>
      </Switch.Root>
      <span className="sr-only">
        Current theme: {theme}. Click to switch to {theme === 'light' ? 'dark' : 'light'} mode.
      </span>
    </MotionWrapper>
  )
}