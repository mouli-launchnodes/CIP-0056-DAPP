import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { acceptTransferSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Accept transfer request body:', body)
    
    // Validate input
    const validatedData = acceptTransferSchema.parse(body)
    console.log('Validated accept transfer data:', validatedData)
    
    // Accept the transfer proposal using DAML ledger
    console.log('Accepting transfer proposal via DAML ledger...')
    const acceptResult = await damlClient.acceptTransferProposal({
      recipientPartyId: validatedData.recipientPartyId,
      proposalId: validatedData.proposalId
    })
    
    console.log('DAML accept result:', acceptResult)
    
    // Create notification for sender about accepted proposal
    try {
      // First get the proposal details to know who the sender is
      const proposals = await damlClient.getPendingTransferProposals(validatedData.recipientPartyId)
      const acceptedProposal = proposals.find(p => p.contractId === validatedData.proposalId)
      
      if (acceptedProposal) {
        await fetch('http://localhost:3000/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyId: acceptedProposal.proposal.currentOwner,
            type: 'transfer_completed',
            from: acceptedProposal.proposal.currentOwner,
            to: acceptedProposal.proposal.newOwner,
            tokenName: acceptedProposal.proposal.tokenName,
            amount: acceptedProposal.proposal.transferAmount,
            message: `Your transfer proposal for ${acceptedProposal.proposal.transferAmount} ${acceptedProposal.proposal.tokenName} tokens has been accepted by ${acceptedProposal.proposal.newOwner}.`
          })
        })
      }
    } catch (notificationError) {
      console.warn('Failed to create acceptance notification:', notificationError)
    }
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: acceptResult.transactionId,
        status: 'confirmed'
      },
      message: acceptResult.message || 'Transfer proposal accepted successfully on DAML ledger',
      method: acceptResult.method || 'proposal_acceptance',
      isCleanup: acceptResult.method === 'stale_proposal_cleanup',
      notification: {
        message: acceptResult.method === 'stale_proposal_cleanup' 
          ? 'Stale proposal has been removed from your notifications.'
          : 'Sender has been notified that you accepted their transfer proposal.',
        senderNotified: acceptResult.method !== 'stale_proposal_cleanup'
      }
    })
    
  } catch (error) {
    console.error('Accept transfer error:', error)
    
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