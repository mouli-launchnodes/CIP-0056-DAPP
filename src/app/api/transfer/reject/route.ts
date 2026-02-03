import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { rejectTransferSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Reject transfer request body:', body)
    
    // Validate input
    const validatedData = rejectTransferSchema.parse(body)
    console.log('Validated reject transfer data:', validatedData)
    
    // Reject the transfer proposal using DAML ledger
    console.log('Rejecting transfer proposal via DAML ledger...')
    const rejectResult = await damlClient.rejectTransferProposal({
      recipientPartyId: validatedData.recipientPartyId,
      proposalId: validatedData.proposalId
    })
    
    console.log('DAML reject result:', rejectResult)
    
    // Create notification for sender about rejected proposal
    try {
      // First get the proposal details to know who the sender is
      const proposals = await damlClient.getPendingTransferProposals(validatedData.recipientPartyId)
      const rejectedProposal = proposals.find(p => p.contractId === validatedData.proposalId)
      
      if (rejectedProposal) {
        await fetch('http://localhost:3000/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyId: rejectedProposal.proposal.currentOwner,
            type: 'transfer_rejected',
            from: rejectedProposal.proposal.currentOwner,
            to: rejectedProposal.proposal.newOwner,
            tokenName: rejectedProposal.proposal.tokenName,
            amount: rejectedProposal.proposal.transferAmount,
            message: `Your transfer proposal for ${rejectedProposal.proposal.transferAmount} ${rejectedProposal.proposal.tokenName} tokens has been rejected by ${rejectedProposal.proposal.newOwner}.`
          })
        })
      }
    } catch (notificationError) {
      console.warn('Failed to create rejection notification:', notificationError)
    }
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: rejectResult.transactionId,
        status: 'rejected'
      },
      message: 'Transfer proposal rejected successfully',
      notification: {
        message: 'Sender has been notified that you rejected their transfer proposal.',
        senderNotified: true
      }
    })
    
  } catch (error) {
    console.error('Reject transfer error:', error)
    
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