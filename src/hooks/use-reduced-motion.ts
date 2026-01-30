'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to detect user's motion preferences
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return
    }

    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Animation configuration that respects user preferences
 */
export function getAnimationConfig(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      duration: 0,
      transition: { duration: 0 },
      animate: {},
      initial: {},
      exit: {}
    }
  }

  return {
    duration: 0.3,
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1] // easeOut
    },
    animate: { opacity: 1, y: 0, scale: 1 },
    initial: { opacity: 0, y: 20, scale: 0.95 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  }
}

/**
 * Spring animation configuration that respects user preferences
 */
export function getSpringConfig(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      type: "tween",
      duration: 0
    }
  }

  return {
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 1
  }
}