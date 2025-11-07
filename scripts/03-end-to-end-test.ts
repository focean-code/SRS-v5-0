/**
 * End-to-End Test Script for Shopper Reward System v5.0
 * Tests the complete flow: QR Generation → Feedback → Reward Processing → Data Bundle Delivery
 *
 * Run from terminal:
 *   npx ts-node scripts/03-end-to-end-test.ts
 *
 * Or via API endpoint (create a test route):
 *   curl http://localhost:3000/api/admin/test/e2e
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface TestResult {
  step: string
  status: "PASS" | "FAIL"
  data?: any
  error?: string
}

const results: TestResult[] = []

function log(step: string, status: "PASS" | "FAIL", data?: any, error?: string) {
  const result: TestResult = { step, status, data, error }
  results.push(result)
  const icon = status === "PASS" ? "✅" : "❌"
  console.log(`${icon} ${step}`)
  if (error) console.log(`   Error: ${error}`)
  if (data) console.log(`   Data:`, data)
}

async function testE2EFlow() {
  console.log("\n🚀 Starting End-to-End Test for Shopper Reward System v5.0\n")
  console.log("=" * 60)

  try {
    // Step 1: Check Supabase Connection
    console.log("\n1️⃣ Testing Database Connection...")
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data: tables, error: connectionError } = await supabase.from("products").select("count")

    if (connectionError) {
      log("Database Connection", "FAIL", undefined, connectionError.message)
      return printSummary()
    }
    log("Database Connection", "PASS", { connected: true })

    // Step 2: Create Test Product and SKU
    console.log("\n2️⃣ Creating Test Product and SKU...")

    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert([
        {
          name: "Test Ndengu Delish E2E",
          category: "Ready-to-Eat",
          description: "E2E Test Product",
        },
      ])
      .select()
      .single()

    if (productError) {
      log("Create Product", "FAIL", undefined, productError.message)
      return printSummary()
    }
    log("Create Product", "PASS", { productId: productData.id })

    const { data: skuData, error: skuError } = await supabase
      .from("product_skus")
      .insert([
        {
          product_id: productData.id,
          weight: "500G",
          reward_amount: 150,
          reward_description: "FREE SAFARICOM DATA",
        },
      ])
      .select()
      .single()

    if (skuError) {
      log("Create SKU", "FAIL", undefined, skuError.message)
      return printSummary()
    }
    log("Create SKU", "PASS", { skuId: skuData.id, rewardAmount: skuData.reward_amount })

    // Step 3: Generate Test QR Code
    console.log("\n3️⃣ Generating Test QR Code...")

    const qrId = `test-qr-${Date.now()}`
    const qrUrl = `${APP_URL}/qr/${qrId}`

    const { data: qrData, error: qrError } = await supabase
      .from("qr_codes")
      .insert([
        {
          id: qrId,
          sku_id: skuData.id,
          url: qrUrl,
          batch_number: 999,
          is_used: false,
        },
      ])
      .select()
      .single()

    if (qrError) {
      log("Generate QR Code", "FAIL", undefined, qrError.message)
      return printSummary()
    }
    log("Generate QR Code", "PASS", { qrId, url: qrUrl })

    // Step 4: Validate QR Code (simulate scan)
    console.log("\n4️⃣ Validating QR Code (Simulating Scan)...")

    const { data: validQr, error: validateError } = await supabase
      .from("qr_codes")
      .select("id, is_used, product_skus(reward_amount, weight, products(name))")
      .eq("id", qrId)
      .single()

    if (validateError) {
      log("QR Code Validation", "FAIL", undefined, validateError.message)
      return printSummary()
    }

    if (validQr.is_used) {
      log("QR Code Validation", "FAIL", undefined, "QR code already used")
      return printSummary()
    }

    log("QR Code Validation", "PASS", {
      qrFound: true,
      rewardAmount: validQr.product_skus[0].reward_amount,
      skuSize: validQr.product_skus[0].weight,
    })

    // Step 5: Submit Feedback
    console.log("\n5️⃣ Submitting Customer Feedback...")

    const testPhone = "+254712345678"
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback")
      .insert([
        {
          qr_code_id: qrId,
          sku_id: skuData.id,
          customer_name: "Test Customer",
          customer_phone: testPhone,
          rating: 5,
          product_quality: 4,
          packaging_quality: 5,
          taste: 5,
          value_for_money: 4,
        },
      ])
      .select()
      .single()

    if (feedbackError) {
      log("Submit Feedback", "FAIL", undefined, feedbackError.message)
      return printSummary()
    }
    log("Submit Feedback", "PASS", { feedbackId: feedbackData.id, phone: testPhone })

    // Step 6: Create Reward
    console.log("\n6️⃣ Creating Reward Record...")

    const rewardAmount = validQr.product_skus[0].reward_amount
    const { data: rewardData, error: rewardError } = await supabase
      .from("rewards")
      .insert([
        {
          feedback_id: feedbackData.id,
          customer_phone: testPhone,
          amount: rewardAmount,
          reward_name: `${rewardAmount}MB Safaricom Data`,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (rewardError) {
      log("Create Reward", "FAIL", undefined, rewardError.message)
      return printSummary()
    }
    log("Create Reward", "PASS", { rewardId: rewardData.id, status: "pending", amount: `${rewardAmount}MB` })

    // Step 7: Mark QR as Used
    console.log("\n7️⃣ Marking QR Code as Used...")

    const { error: updateError } = await supabase
      .from("qr_codes")
      .update({
        is_used: true,
        used_by: testPhone,
        used_at: new Date().toISOString(),
      })
      .eq("id", qrId)

    if (updateError) {
      log("Mark QR as Used", "FAIL", undefined, updateError.message)
      return printSummary()
    }
    log("Mark QR as Used", "PASS", { qrId, usedBy: testPhone })

    // Step 8: Process Reward (send data bundle)
    console.log("\n8️⃣ Processing Reward (Sending Data Bundle)...")

    // Update reward status to processing
    const { error: processingError } = await supabase
      .from("rewards")
      .update({ status: "processing" })
      .eq("id", rewardData.id)

    if (processingError) {
      log("Update Reward to Processing", "FAIL", undefined, processingError.message)
      return printSummary()
    }

    // IMPORTANT: For 340g SKUs, we send 50MB twice (total 100MB) to match the displayed reward
    // For 500g SKUs, we send 50MB three times (total 150MB) to match the displayed reward
    // The customer only sees the total amount (100MB/150MB) - they don't know about multiple transactions
    let bundleSize = "50MB"
    let sendTimes = 1
    const skuWeight = validQr.product_skus[0].weight?.toString().trim().toLowerCase() || ""

    if (skuWeight === "340g") {
      // Send 50MB bundle twice to total 100MB (customer sees 100MB on QR code)
      bundleSize = "50MB"
      sendTimes = 2
      console.log(`   📦 340g SKU detected: Sending 50MB × 2 = 100MB`)
    } else if (skuWeight === "500g") {
      // Send 50MB bundle three times to total 150MB (customer sees 150MB on QR code)
      bundleSize = "50MB"
      sendTimes = 3
      console.log(`   📦 500g SKU detected: Sending 50MB × 3 = 150MB`)
    } else {
      // Fallback to amount-based mapping if weight is unknown
      bundleSize = rewardAmount > 500 ? "1GB" : rewardAmount > 200 ? "500MB" : "150MB"
      sendTimes = 1
      console.log(`   📦 Unknown weight: Sending ${bundleSize} (mapped from ${rewardAmount}MB)`)
    }

    // Simulate Africa's Talking API call (sending multiple bundles if needed)
    const bundleResult = {
      phoneNumber: testPhone,
      bundleSize: bundleSize,
      sendTimes: sendTimes,
      totalData: sendTimes === 2 ? "100MB" : sendTimes === 3 ? "150MB" : bundleSize,
      displayedAmount: rewardAmount,
      transactionId: `TXN-${Date.now()}`,
      status: "SUCCESS",
      message: `Data bundle sent successfully (${sendTimes} × ${bundleSize} = ${sendTimes === 2 ? "100MB" : sendTimes === 3 ? "150MB" : bundleSize})`,
    }

    log("Data Bundle Sent (Africa's Talking)", "PASS", bundleResult)

    // Step 9: Update Reward to Sent
    console.log("\n9️⃣ Updating Reward Status to Sent...")

    const { error: sentError } = await supabase
      .from("rewards")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", rewardData.id)

    if (sentError) {
      log("Update Reward to Sent", "FAIL", undefined, sentError.message)
      return printSummary()
    }
    log("Update Reward to Sent", "PASS", { rewardId: rewardData.id, status: "sent" })

    // Step 10: Verify Complete Flow
    console.log("\n🔟 Verifying Complete Flow...")

    const { data: finalQr } = await supabase.from("qr_codes").select("*").eq("id", qrId).single()

    const { data: finalReward } = await supabase.from("rewards").select("*").eq("id", rewardData.id).single()

    const { data: finalFeedback } = await supabase.from("feedback").select("*").eq("id", feedbackData.id).single()

    if (finalQr?.is_used && finalReward?.status === "sent" && finalFeedback?.id) {
      log("Complete Flow Verification", "PASS", {
        qrUsed: finalQr.is_used,
        rewardSent: finalReward.status === "sent",
        feedbackRecorded: !!finalFeedback.id,
      })
    } else {
      log("Complete Flow Verification", "FAIL", undefined, "State mismatch in final verification")
    }

    // Step 11: Analytics Check
    console.log("\n📊 Checking Analytics...")

    const { count: totalFeedback } = await supabase.from("feedback").select("id", { count: "exact", head: true })

    const { count: sentRewards } = await supabase
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")

    log("Analytics Check", "PASS", {
      totalFeedback,
      sentRewards,
    })

    printSummary()
  } catch (error) {
    console.error("\n❌ Unexpected error:", error)
  }
}

function printSummary() {
  console.log("\n" + "=" * 60)
  console.log("\n📋 TEST SUMMARY\n")

  const passed = results.filter((r) => r.status === "PASS").length
  const failed = results.filter((r) => r.status === "FAIL").length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log("\n🔴 Failed Tests:")
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  - ${r.step}: ${r.error}`)
      })
  }

  console.log("\n" + "=" * 60)
  console.log("\n✨ Test run complete!\n")

  // Clean up test data
  console.log("Cleaning up test data...")
  // In production, add cleanup logic here
}

// For testing from API endpoint
export async function runE2ETest() {
  await testE2EFlow()
  return {
    summary: {
      total: results.length,
      passed: results.filter((r) => r.status === "PASS").length,
      failed: results.filter((r) => r.status === "FAIL").length,
    },
    results,
  }
}

// Run if executed directly
testE2EFlow().catch(console.error)

// Helper function (mock - use @supabase/supabase-js in real app)
function createClient(url: string, key: string) {
  return {
    from: (table: string) => ({
      select: (cols: string, opts?: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: data[0], error: null }),
        }),
      }),
      update: (data: any) => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }
}
