'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Coins, ArrowRightLeft, Eye, Flame, CheckCircle, TrendingUp, Users, Shield, Activity, ArrowRight, AlertTriangle, RefreshCw } from '@/lib/icons'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { StatsSkeleton } from '@/components/loading-skeleton'
import { CantonAuthStatus } from '@/components/canton-auth-status'
import { Notifications } from '@/components/notifications'

export default function DashboardPage() {
  const router = useRouter()
  const [userPartyId, setUserPartyId] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const { systemStatus, isLoading: statsLoading, error: statsError, refetch } = useDashboardStats()

  useEffect(() => {
    const partyId = localStorage.getItem('userPartyId')
    if (!partyId) {
      router.push('/')
      return
    }
    setUserPartyId(partyId)
  }, [router])

  if (!userPartyId) {
    return (
      <motion.div 
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.p 
          className="mt-4 text-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading dashboard...
        </motion.p>
      </motion.div>
    )
  }

  const features = [
    {
      title: 'Create Token',
      description: 'Deploy new CIP0056-compliant token contracts with enterprise-grade security and custom parameters',
      icon: Plus,
      href: '/create-token',
      color: 'primary'
    },
    {
      title: 'Mint Tokens',
      description: 'Issue new tokens to specific Party IDs with precision control and real-time validation',
      icon: Coins,
      href: '/mint',
      color: 'accent'
    },
    {
      title: 'Transfer Tokens',
      description: 'Send tokens between parties with atomic transactions and instant verification',
      icon: ArrowRightLeft,
      href: '/transfer',
      color: 'secondary'
    },
    {
      title: 'View Holdings',
      description: 'Monitor balances, collateral status, and transaction history across all token types',
      icon: Eye,
      href: '/holdings',
      color: 'muted'
    },
    {
      title: 'Burn Tokens',
      description: 'Permanently destroy tokens with secure multi-step confirmation and audit trails',
      icon: Flame,
      href: '/burn',
      color: 'error'
    }
  ]

  const stats = [
    {
      title: 'Tokens Created',
      value: systemStatus.tokensCreated.toString(),
      icon: Coins,
      change: 'Available for minting'
    },
    {
      title: 'Total Minted',
      value: (typeof systemStatus.totalMinted === 'number' ? systemStatus.totalMinted : 0).toFixed(2),
      icon: TrendingUp,
      change: 'Across all tokens'
    },
    {
      title: 'Active Transactions',
      value: systemStatus.activeTransactions.toString(),
      icon: Activity,
      change: 'Processing now'
    },
    {
      title: 'Security Level',
      value: 'Enterprise',
      icon: Shield,
      change: 'Bank-grade encryption'
    },
    {
      title: 'Token Standard',
      value: 'CIP0056',
      icon: TrendingUp,
      change: 'Latest specification'
    },
    {
      title: 'Network Type',
      value: 'Multi-Party',
      icon: Users,
      change: 'Distributed ledger'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25
      }
    }
  }

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Professional Hero Section */}
      <motion.div className="hero-section" variants={itemVariants}>
        <div className="hero-content">
          {/* Canton Authentication Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <CantonAuthStatus />
          </motion.div>
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          >
            Welcome to Canton Network
            <span className="hero-subtitle">Enterprise Tokenization Platform</span>
          </motion.h1>
          <motion.p 
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
          >
            Deploy, manage, and transfer digital assets with institutional-grade security, privacy, and compliance. Built on Canton's distributed ledger technology for enterprise applications.
          </motion.p>
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          >
            <Link href="/create-token">
              <motion.button 
                className="btn btn-primary btn-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Plus className="h-5 w-5" />
                Create Token Contract
              </motion.button>
            </Link>
            <Link href="/holdings">
              <motion.button 
                className="btn btn-secondary btn-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Eye className="h-5 w-5" />
                View Portfolio
              </motion.button>
            </Link>
          </motion.div>
        </div>
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
        >
          <div className="grid grid-cols-3 gap-4 p-8">
            {[
              { icon: Activity, value: 'Active', title: 'Network', delay: 0.1 },
              { icon: Shield, value: 'Secure', title: 'Protocol', delay: 0.2 },
              { icon: TrendingUp, value: 'Ready', title: 'Platform', delay: 0.3 }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                className="stat-card"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  delay: 0.8 + item.delay, 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 25 
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
              >
                <div className="stat-header">
                  <div className="stat-icon">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="stat-value">{item.value}</div>
                <div className="stat-title">{item.title}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <motion.div className="mb-12" variants={itemVariants}>
        <div className="section-header">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            Platform Overview
          </motion.h2>
          <motion.p 
            className="section-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            Real-time status and capabilities of your Canton Network environment
          </motion.p>
        </div>
        
        {statsLoading ? (
          <StatsSkeleton />
        ) : statsError ? (
          <div className="alert alert-error">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load system statistics. {statsError}</span>
            <button onClick={refetch} className="btn btn-sm btn-outline ml-4">
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <motion.div 
            className="stats-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div 
                  key={stat.title} 
                  className="stat-card"
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { type: 'spring', stiffness: 400, damping: 25 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="stat-header">
                    <div className="stat-title">{stat.title}</div>
                    <motion.div 
                      className="stat-icon"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-change positive">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Features Grid */}
      <motion.div className="mb-12" variants={itemVariants}>
        <div className="section-header">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            Token Operations
          </motion.h2>
          <motion.p 
            className="section-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            Complete suite of tools for managing digital assets on Canton Network
          </motion.p>
        </div>
        <motion.div 
          className="feature-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link key={feature.title} href={feature.href}>
                <motion.div 
                  className="feature-card"
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    transition: { type: 'spring', stiffness: 400, damping: 25 }
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div 
                    className="feature-icon"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <Icon className="h-8 w-8" />
                  </motion.div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <motion.div 
                    className="feature-arrow"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </motion.div>
              </Link>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Professional System Information */}
      <motion.div 
        className="card"
        variants={itemVariants}
        whileHover={{ 
          scale: 1.02,
          transition: { type: 'spring', stiffness: 400, damping: 25 }
        }}
      >
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">System Information</h3>
              <p className="card-description">Current environment and configuration details</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="grid-responsive cols-2">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
            >
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="font-medium text-muted">Network Environment</span>
                <span className="font-semibold">Canton Network</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="font-medium text-muted">Token Standard</span>
                <span className="font-semibold">CIP0056 Compliant</span>
              </div>
            </motion.div>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
            >
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="font-medium text-muted">Authentication</span>
                <span className="font-semibold">Auth0 Enterprise</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="font-medium text-muted">Your Party ID</span>
                <span className="font-mono text-xs truncate max-w-32" title={userPartyId}>
                  {userPartyId}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Notifications Section */}
      <motion.div 
        id="notifications"
        className="mt-12"
        variants={itemVariants}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <Notifications partyId={userPartyId} />
      </motion.div>
    </motion.div>
  )
}