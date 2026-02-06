import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'

// In-memory storage for notifications (in production, use a database)
const notifications = new Map<string, Array<{
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
}>>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    
    if (!partyId) {
      return NextResponse.json(
        { error: 'Party ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`Getting notifications for party: ${partyId}`)
    
    // Get notifications for this party
    const partyNotifications = notifications.get(partyId) || []
    
    // Also check for pending transfer proposals from DAML
    const pendingProposals = await damlClient.getPendingTransferProposals(partyId)
    
    // Convert DAML proposals to notifications
    // Flag legacy proposals that may be stale
    const proposalNotifications = pendingProposals.map(p => {
      const isLegacy = p.isLegacy || p.proposal.holdingId !== undefined
      const fromPartyDisplay = p.proposal.currentOwner.split('::')[0]

      return {
        id: `proposal-${p.contractId}`,
        type: 'transfer_proposal' as const,
        from: p.proposal.currentOwner,
        to: p.proposal.newOwner,
        tokenName: p.proposal.tokenName,
        amount: p.proposal.transferAmount,
        proposalId: p.contractId,
        message: isLegacy
          ? `[LEGACY] Transfer proposal for ${p.proposal.transferAmount} ${p.proposal.tokenName} tokens from ${fromPartyDisplay}. This proposal may be stale and could fail to accept.`
          : `You have received a transfer proposal for ${p.proposal.transferAmount} ${p.proposal.tokenName} tokens from ${fromPartyDisplay}`,
        timestamp: new Date().toISOString(),
        read: false,
        isLegacy
      }
    })
    
    // Combine stored notifications with proposal notifications
    const allNotifications = [...partyNotifications, ...proposalNotifications]
    
    // Sort by timestamp (newest first)
    allNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return NextResponse.json({
      success: true,
      notifications: allNotifications,
      unreadCount: allNotifications.filter(n => !n.read).length,
      partyId
    })
    
  } catch (error) {
    console.error('Get notifications error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partyId, type, from, to, tokenName, amount, proposalId, message } = body
    
    if (!partyId || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log('Creating notification:', body)
    
    // Create notification
    const notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      from: from || '',
      to: to || '',
      tokenName: tokenName || '',
      amount: amount || '',
      proposalId: proposalId || undefined,
      message,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    // Store notification
    const partyNotifications = notifications.get(partyId) || []
    partyNotifications.push(notification)
    notifications.set(partyId, partyNotifications)
    
    console.log(`Notification created for party ${partyId}:`, notification)
    
    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification created successfully'
    })
    
  } catch (error) {
    console.error('Create notification error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { partyId, notificationId, read } = body
    
    if (!partyId || !notificationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log(`Marking notification ${notificationId} as ${read ? 'read' : 'unread'} for party ${partyId}`)
    
    // Update notification
    const partyNotifications = notifications.get(partyId) || []
    const notification = partyNotifications.find(n => n.id === notificationId)
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }
    
    notification.read = read !== undefined ? read : true
    
    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification updated successfully'
    })
    
  } catch (error) {
    console.error('Update notification error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}