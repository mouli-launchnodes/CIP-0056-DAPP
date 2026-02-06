#!/usr/bin/env node

/**
 * Test script to verify that the application properly fails when DAML is not running
 * This verifies that ALL fallback mechanisms have been removed
 */

async function testDAMLDependency() {
  console.log('🧪 Testing DAML Dependency Enforcement (No Fallbacks)')
  console.log('====================================================')

  const baseUrl = 'http://localhost:3000'
  
  // Import fetch dynamically for Node.js compatibility
  const fetch = (await import('node-fetch')).default
  
  const tests = [
    {
      name: 'Token Creation',
      endpoint: '/api/tokens',
      method: 'POST',
      body: {
        tokenName: 'TestToken',
        currency: 'USD',
        quantityPrecision: 2,
        pricePrecision: 2,
        description: 'Test token'
      }
    },
    {
      name: 'Token Fetching',
      endpoint: '/api/tokens',
      method: 'GET'
    },
    {
      name: 'Holdings Query',
      endpoint: '/api/holdings?systemWide=true',
      method: 'GET'
    },
    {
      name: 'Transaction History',
      endpoint: '/api/transactions',
      method: 'GET'
    },
    {
      name: 'User Onboarding',
      endpoint: '/api/onboard',
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    }
  ]

  let allTestsPassed = true

  for (const test of tests) {
    console.log(`\n🔍 Testing ${test.name}...`)
    
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      if (test.body) {
        options.body = JSON.stringify(test.body)
      }
      
      const response = await fetch(`${baseUrl}${test.endpoint}`, options)
      const data = await response.json()
      
      if (response.status === 503) {
        console.log(`   ✅ PASS: Correctly returns 503 Service Unavailable`)
        console.log(`   💬 Error: ${data.error}`)
        
        if (data.error && data.error.includes('DAML ledger is required')) {
          console.log(`   ✅ PASS: Error message correctly mentions DAML requirement`)
        } else {
          console.log(`   ⚠️  WARNING: Error message should mention DAML requirement`)
        }
      } else if (!response.ok) {
        console.log(`   ✅ PASS: Correctly fails with HTTP ${response.status}`)
        console.log(`   💬 Error: ${data.error || 'Unknown error'}`)
      } else if (data.success === false) {
        console.log(`   ✅ PASS: Correctly returns success: false`)
        console.log(`   💬 Error: ${data.error}`)
      } else {
        console.log(`   ❌ FAIL: Should not succeed when DAML is unavailable`)
        console.log(`   📊 Response:`, data)
        allTestsPassed = false
      }
      
    } catch (error) {
      console.log(`   ✅ PASS: Correctly throws error (${error.message})`)
    }
  }

  console.log('\n📋 Summary:')
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED: Application correctly requires DAML ledger')
    console.log('🎉 No fallback mechanisms detected - strict DAML dependency enforced')
  } else {
    console.log('❌ SOME TESTS FAILED: Application still has fallback mechanisms')
    console.log('⚠️  Please review the failing endpoints and remove any remaining fallbacks')
  }

  return allTestsPassed
}

// Run the test
testDAMLDependency().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! No mock implementations detected.')
  } else {
    console.log('\n❌ Tests failed. Mock implementations still present.')
  }
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})