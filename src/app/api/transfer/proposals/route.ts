import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'

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
    
    console.log(`Getting pending transfer proposals for party: ${partyId}`)
    
    // Get pending transfer proposals from DAML ledger
    const proposals = await damlClient.getPendingTransferProposals(partyId)
    
    console.log(`Found ${proposals.length} pending proposals`)
    
    // Transform proposals to match frontend expectations
    const transformedProposals = proposals.map(p => ({
      id: p.contractId,
      proposalId: p.contractId,
      fromPartyId: p.proposal.currentOwner,
      toPartyId: p.proposal.newOwner,
      tokenName: p.proposal.tokenName,
      amount: p.proposal.transferAmount,
      issuer: p.proposal.issuer,
      status: 'pending',
      createdAt: new Date().toISOString(), // DAML doesn't provide timestamps by default
      contractAddress: p.contractId
    }))
    
    return NextResponse.json({
      success: true,
      proposals: transformedProposals,
      partyId
    })
    
  } catch (error) {
    console.error('Get proposals error:', error)
    
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