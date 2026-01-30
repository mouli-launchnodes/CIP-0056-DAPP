'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from '@/lib/icons'
import { motion } from 'framer-motion'

interface BreadcrumbItem {
  label: string
  href: string
}

const pathMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/create-token': 'Create Token',
  '/mint': 'Mint Tokens',
  '/transfer': 'Transfer Tokens',
  '/holdings': 'View Holdings',
  '/burn': 'Burn Tokens'
}

export function Breadcrumb() {
  const pathname = usePathname()
  
  // Don't show breadcrumbs on home page
  if (pathname === '/' || pathname === '/dashboard') {
    return null
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' }
  ]

  // Build breadcrumb trail
  let currentPath = ''
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    const label = pathMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href: currentPath })
  })

  return (
    <motion.nav 
      className="breadcrumb-nav"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb navigation"
    >
      <ol className="breadcrumb-list">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1
          
          return (
            <li key={item.href} className="breadcrumb-item">
              {index === 0 && (
                <Home className="breadcrumb-home-icon" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href} 
                  className="breadcrumb-link"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                </Link>
              )}
              
              {!isLast && (
                <ChevronRight 
                  className="breadcrumb-separator" 
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </motion.nav>
  )
}