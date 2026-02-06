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

    // Get proposal details BEFORE accepting (for notification purposes)
    let proposalDetails: any = null
    try {
      const proposals = await damlClient.getPendingTransferProposals(validatedData.recipientPartyId)
      proposalDetails = proposals.find(p => p.contractId === validatedData.proposalId)
    } catch (err) {
      console.warn('Could not fetch proposal details before acceptance:', err)
    }

    // Accept the transfer proposal using DAML ledger
    console.log('Accepting transfer proposal via DAML ledger...')
    const acceptResult = await damlClient.acceptTransferProposal({
      recipientPartyId: validatedData.recipientPartyId,
      proposalId: validatedData.proposalId
    })

    console.log('DAML accept result:', acceptResult)

    // Handle stale proposal case
    if (acceptResult.method === 'stale_proposal_cleanup') {
      return NextResponse.json({
        success: false,
        isStaleProposal: true,
        message: acceptResult.message,
        recommendation: 'Please ask the sender to create a new transfer proposal with the updated contract.',
        notification: {
          message: 'This proposal is from an outdated contract version and cannot be accepted.',
          senderNotified: false
        }
      }, { status: 422 })  // 422 Unprocessable Entity
    }

    // Create notification for sender about accepted proposal
    if (proposalDetails) {
      try {
        await fetch('http://localhost:3000/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyId: proposalDetails.proposal.currentOwner,
            type: 'transfer_completed',
            from: proposalDetails.proposal.currentOwner,
            to: proposalDetails.proposal.newOwner,
            tokenName: proposalDetails.proposal.tokenName,
            amount: proposalDetails.proposal.transferAmount,
            message: `Your transfer proposal for ${proposalDetails.proposal.transferAmount} ${proposalDetails.proposal.tokenName} tokens has been accepted by ${proposalDetails.proposal.newOwner}.`
          })
        })
      } catch (notificationError) {
        console.warn('Failed to create acceptance notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: acceptResult.transactionId,
        status: 'confirmed'
      },
      message: acceptResult.message || 'Transfer proposal accepted successfully on DAML ledger',
      method: acceptResult.method || 'proposal_acceptance',
      notification: {
        message: 'Sender has been notified that you accepted their transfer proposal.',
        senderNotified: true
      }
    })

  } catch (error) {
    console.error('Accept transfer error:', error)

    if (error instanceof Error) {
      // Check if this is a CONTRACT_NOT_FOUND error for stale proposals
      if (error.message.includes('CONTRACT_NOT_FOUND')) {
        return NextResponse.json({
          success: false,
          isStaleProposal: true,
          error: 'This transfer proposal is no longer valid. The underlying tokens may have been transferred or the proposal is from an outdated contract.',
          recommendation: 'Please ask the sender to create a new transfer proposal.'
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