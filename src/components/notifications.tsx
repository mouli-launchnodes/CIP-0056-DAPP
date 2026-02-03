'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Bell, Check, X, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

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

interface NotificationsProps {
  partyId?: string
}

export function Notifications({ partyId }: NotificationsProps) {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  // Get party ID from user email if not provided
  const effectivePartyId = partyId || (user?.email ? 
    `${user.email.split('@')[0]}::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459` : 
    null)

  const fetchNotifications = async () => {
    if (!effectivePartyId) return

    try {
      const response = await fetch(`/api/notifications?partyId=${encodeURIComponent(effectivePartyId)}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptProposal = async (proposalId: string, notificationId: string) => {
    if (!effectivePartyId) return

    try {
      const response = await fetch('/api/transfer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientPartyId: effectivePartyId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Transfer proposal accepted successfully!')
        fetchNotifications() // Refresh notifications
      } else {
        toast.error(`Failed to accept proposal: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to accept proposal')
      console.error('Accept proposal error:', error)
    }
  }

  const handleRejectProposal = async (proposalId: string, notificationId: string) => {
    if (!effectivePartyId) return

    try {
      const response = await fetch('/api/transfer/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientPartyId: effectivePartyId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Transfer proposal rejected successfully!')
        fetchNotifications() // Refresh notifications
      } else {
        toast.error(`Failed to reject proposal: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to reject proposal')
      console.error('Reject proposal error:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!effectivePartyId) return

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: effectivePartyId,
          notificationId,
          read: true
        })
      })
      fetchNotifications() // Refresh to update read status
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [effectivePartyId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading notifications...</div>
        </CardContent>
      </Card>
    )
  }

  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications()}
          >
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Transfer proposals and transaction updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see transfer proposals and updates here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read ? 'bg-muted/50' : 'bg-background border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {notification.type === 'transfer_proposal' && (
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                      )}
                      {notification.type === 'transfer_completed' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {notification.type === 'transfer_rejected' && (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={
                        notification.type === 'transfer_proposal' ? 'default' :
                        notification.type === 'transfer_completed' ? 'secondary' :
                        'destructive'
                      }>
                        {notification.type.replace('_', ' ')}
                      </Badge>
                      {!notification.read && (
                        <Badge variant="outline" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm mb-2">{notification.message}</p>
                    
                    {notification.tokenName && notification.amount && (
                      <div className="text-xs text-muted-foreground mb-2">
                        <strong>{notification.amount} {notification.tokenName}</strong>
                        {notification.from && (
                          <span> from {notification.from.split('::')[0]}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {notification.type === 'transfer_proposal' && notification.proposalId && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAcceptProposal(notification.proposalId!, notification.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectProposal(notification.proposalId!, notification.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length > 5 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All (${notifications.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default Notifications