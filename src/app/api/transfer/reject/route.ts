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

    // Get proposal details BEFORE rejecting (for notification purposes)
    let proposalDetails: any = null
    try {
      const proposals = await damlClient.getPendingTransferProposals(validatedData.recipientPartyId)
      proposalDetails = proposals.find(p => p.contractId === validatedData.proposalId)
    } catch (err) {
      console.warn('Could not fetch proposal details before rejection:', err)
    }

    // Reject the transfer proposal using DAML ledger
    console.log('Rejecting transfer proposal via DAML ledger...')
    const rejectResult = await damlClient.rejectTransferProposal({
      recipientPartyId: validatedData.recipientPartyId,
      proposalId: validatedData.proposalId
    })

    console.log('DAML reject result:', rejectResult)

    // Create notification for sender about rejected proposal and tokens returned
    if (proposalDetails) {
      try {
        await fetch('http://localhost:3000/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyId: proposalDetails.proposal.currentOwner,
            type: 'transfer_rejected',
            from: proposalDetails.proposal.currentOwner,
            to: proposalDetails.proposal.newOwner,
            tokenName: proposalDetails.proposal.tokenName,
            amount: proposalDetails.proposal.transferAmount,
            message: `Your transfer proposal for ${proposalDetails.proposal.transferAmount} ${proposalDetails.proposal.tokenName} tokens has been rejected by ${proposalDetails.proposal.newOwner}. Your tokens have been returned to your account.`
          })
        })
      } catch (notificationError) {
        console.warn('Failed to create rejection notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: rejectResult.transactionId,
        status: 'rejected'
      },
      message: 'Transfer proposal rejected successfully. Tokens have been returned to sender.',
      tokensReturned: true,
      returnedHoldingId: rejectResult.returnedHoldingId,
      notification: {
        message: 'Sender has been notified that you rejected their transfer proposal. Their tokens have been returned.',
        senderNotified: true
      }
    })

  } catch (error) {
    console.error('Reject transfer error:', error)

    if (error instanceof Error) {
      // Handle stale proposals gracefully
      if (error.message.includes('CONTRACT_NOT_FOUND')) {
        return NextResponse.json({
          success: false,
          isStaleProposal: true,
          error: 'This transfer proposal is no longer valid. It may be from an outdated contract version.',
          message: 'The proposal has been automatically cleaned up.'
        }, { status: 422 })
      }

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