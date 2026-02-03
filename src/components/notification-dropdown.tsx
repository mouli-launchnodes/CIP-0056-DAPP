'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Bell, Check, X, Clock, ArrowRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: 'transfer_proposal' | 'transfer_completed' | 'transfer_rejected'
  from: string
  to: string
  tokenName: string
  amount: string
  proposalId?: string
  message: string
  timestamp: string
  read: boolean
}

interface NotificationDropdownProps {
  userPartyId: string
}

export function NotificationDropdown({ userPartyId }: NotificationDropdownProps) {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!userPartyId) return

    try {
      const response = await fetch(`/api/notifications?partyId=${encodeURIComponent(userPartyId)}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications.slice(0, 5)) // Show only first 5 in dropdown
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptProposal = async (proposalId: string, notificationId: string) => {
    if (!userPartyId) return

    try {
      const response = await fetch('/api/transfer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientPartyId: userPartyId
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.isCleanup) {
          toast.success('Stale proposal removed from notifications')
        } else {
          toast.success('Transfer proposal accepted successfully!')
        }
        fetchNotifications() // Refresh notifications
        setIsOpen(false) // Close dropdown
      } else {
        toast.error(`Failed to accept proposal: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to accept proposal')
      console.error('Accept proposal error:', error)
    }
  }

  const handleRejectProposal = async (proposalId: string, notificationId: string) => {
    if (!userPartyId) return

    try {
      const response = await fetch('/api/transfer/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientPartyId: userPartyId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Transfer proposal rejected successfully!')
        fetchNotifications() // Refresh notifications
        setIsOpen(false) // Close dropdown
      } else {
        toast.error(`Failed to reject proposal: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to reject proposal')
      console.error('Reject proposal error:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!userPartyId) return

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: userPartyId,
          notificationId,
          read: true
        })
      })
      fetchNotifications() // Refresh to update read status
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userPartyId])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 h-10 w-10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-dropdown-content"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">You'll see transfer proposals here</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className={`p-4 hover:bg-muted transition-colors ${
                        !notification.read ? 'bg-accent-light border-l-2 border-l-primary' : ''
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {notification.type === 'transfer_proposal' && (
                            <ArrowRight className="h-4 w-4 text-blue-500" />
                          )}
                          {notification.type === 'transfer_completed' && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {notification.type === 'transfer_rejected' && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="notification-message text-sm text-foreground mb-1 leading-relaxed">
                            {notification.message.length > 60 
                              ? `${notification.message.substring(0, 60)}...`
                              : notification.message
                            }
                          </p>
                          
                          {notification.tokenName && notification.amount && (
                            <p className="notification-token-info text-xs text-muted-foreground mb-2">
                              <strong className="text-foreground">{notification.amount} {notification.tokenName}</strong>
                              {notification.from && (
                                <span> from {notification.from.split('::')[0]}</span>
                              )}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-primary hover:text-primary/80 transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                          </div>

                          {/* Action Buttons for Transfer Proposals */}
                          {notification.type === 'transfer_proposal' && notification.proposalId && (
                            <div className="notification-actions-buttons">
                              <button
                                onClick={() => handleAcceptProposal(notification.proposalId!, notification.id)}
                                className="notification-accept-btn btn btn-sm"
                                style={{
                                  background: 'var(--success)',
                                  color: 'white',
                                  border: '1px solid var(--success)',
                                  borderRadius: 'var(--radius)',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  marginRight: '0.5rem'
                                }}
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() => handleRejectProposal(notification.proposalId!, notification.id)}
                                className="notification-reject-btn btn btn-sm"
                                style={{
                                  background: 'transparent',
                                  color: 'var(--foreground)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius)',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border bg-muted">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/dashboard#notifications'
                  }}
                  className="w-full text-sm text-foreground hover:bg-accent"
                >
                  View all notifications
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationDropdown