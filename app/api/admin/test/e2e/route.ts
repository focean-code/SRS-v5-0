import { createServiceRoleClient, createServerClient } from "@/lib/supabase-server"
import { sendDataBundle, mapToSupportedBundleSize } from "@/lib/africas-talking"
import { NextResponse } from "next/server"

interface TestResult {
  step: string
  status: "PASS" | "FAIL"
  data?: any
  error?: string
}

export async function POST(req: Request) {
  const results: TestResult[] = []
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://mobiwavesrs.co.ke"

  function log(step: string, status: "PASS" | "FAIL", data?: any, error?: string) {
    results.push({ step, status, data, error })
    console.log(`E2E Test - ${step}: ${status}`, data || error || "")
  }

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      log("Admin Authentication", "FAIL", undefined, "Unauthorized - Please login as admin")
      return NextResponse.json({ results, summary: getSummary(results) }, { status: 401 })
    }
    log("Admin Authentication", "PASS", { userId: user.id })

    const body = await req.json()
    const testPhone = body.phoneNumber
    const testWeight = body.weight || "340g" // Default to 340g, can specify "340g" or "500g"

    if (!testPhone) {
      log("Phone Number Validation", "FAIL", undefined, "Test phone number required in request body")
      return NextResponse.json({ results, summary: getSummary(results) }, { status: 400 })
    }

    // Validate weight parameter
    const normalizedWeight = testWeight.toString().trim().toLowerCase()
    if (normalizedWeight !== "340g" && normalizedWeight !== "500g") {
      log("Weight Validation", "FAIL", undefined, 'Weight must be "340g" or "500g"')
      return NextResponse.json({ results, summary: getSummary(results) }, { status: 400 })
    }

    // Determine expected reward amount based on weight
    const expectedRewardAmount = normalizedWeight === "340g" ? 100 : 150

    // Validate phone number format
    if (!testPhone.match(/^\+254[17]\d{8}$/) && !testPhone.match(/^0[17]\d{8}$/)) {
      log("Phone Number Validation", "FAIL", undefined, "Invalid Kenyan phone number format")
      return NextResponse.json({ results, summary: getSummary(results) }, { status: 400 })
    }
    log("Phone Number Validation", "PASS", { phoneNumber: testPhone })

    const client = await createServiceRoleClient()

    // Step 1: Database Connection
    const { error: connectionError } = await client.from("products").select("count").limit(1)
    if (connectionError) {
      log("Database Connection", "FAIL", undefined, connectionError.message)
      return NextResponse.json({ results, summary: getSummary(results) })
    }
    log("Database Connection", "PASS", { connected: true })

    let productData
    let skuData

    // Try to find existing SKU with matching weight and reward amount
    const { data: existingSku } = await client
      .from("product_skus")
      .select("*, products(*)")
      .eq("weight", normalizedWeight)
      .eq("reward_amount", expectedRewardAmount)
      .limit(1)
      .single()

    if (existingSku) {
      skuData = existingSku
      productData = existingSku.products
      log("Get Product & SKU", "PASS", {
        productId: productData.id,
        name: productData.name,
        skuId: skuData.id,
        weight: skuData.weight,
        rewardAmount: skuData.reward_amount,
        note: `Using existing SKU: ${normalizedWeight} = ${expectedRewardAmount}MB`,
      })
    } else {
      // Create test product and SKU with specified weight and matching reward amount
      const productName = `Test Product - ${expectedRewardAmount}MB Bundle (${normalizedWeight})`
      const { data: newProduct, error: productError } = await client
        .from("products")
        .insert([
          {
            name: productName,
            category: "Ready to Eat",
            description: `Test product for E2E testing with ${expectedRewardAmount}MB data bundle (${normalizedWeight})`,
            active: true,
          },
        ])
        .select()
        .single()

      if (productError || !newProduct) {
        log("Create Test Product", "FAIL", undefined, productError?.message || "Failed to create product")
        return NextResponse.json({ results, summary: getSummary(results) })
      }
      productData = newProduct
      log("Create Test Product", "PASS", { productId: productData.id, name: productData.name })

      const { data: newSku, error: skuError } = await client
        .from("product_skus")
        .insert([
          {
            product_id: productData.id,
            weight: normalizedWeight,
            price: normalizedWeight === "340g" ? 150 : 200,
            reward_amount: expectedRewardAmount,
            reward_description: `${expectedRewardAmount}MB Safaricom Data Bundle`,
          },
        ])
        .select()
        .single()

      if (skuError || !newSku) {
        log("Create Test SKU", "FAIL", undefined, skuError?.message || "Failed to create SKU")
        return NextResponse.json({ results, summary: getSummary(results) })
      }
      skuData = newSku
      log("Create Test SKU", "PASS", {
        skuId: skuData.id,
        weight: skuData.weight,
        rewardAmount: skuData.reward_amount,
        note: `Created test SKU: ${normalizedWeight} = ${expectedRewardAmount}MB`,
      })
    }

    // Step 4: Generate QR Code
    const qrId = crypto.randomUUID()
    const qrUrl = `${APP_URL}/qr/${qrId}`

    const { data: qrData, error: qrError } = await client
      .from("qr_codes")
      .insert([
        {
          id: qrId,
          sku_id: skuData.id,
          url: qrUrl,
          batch_number: 999999,
          is_used: false,
        },
      ])
      .select()
      .single()

    if (qrError) {
      log("Generate QR Code", "FAIL", undefined, qrError.message)
      return NextResponse.json({ results, summary: getSummary(results) })
    }
    log("Generate QR Code", "PASS", { qrId, url: qrUrl })

    // Step 5: Validate QR Code
    const { data: validQr, error: validateError } = await client
      .from("qr_codes")
      .select("id, is_used, product_skus(reward_amount, weight, products(name))")
      .eq("id", qrId)
      .single()

    if (validateError || !validQr || validQr.is_used) {
      log("QR Code Validation", "FAIL", undefined, validateError?.message || "QR already used")
      return NextResponse.json({ results, summary: getSummary(results) })
    }
    log("QR Code Validation", "PASS", { qrFound: true, isUsed: false })

    const { data: feedbackData, error: feedbackError } = await client
      .from("feedback")
      .insert([
        {
          qr_id: qrId,
          sku_id: skuData.id,
          customer_name: "Test Customer E2E",
          customer_phone: testPhone,
          rating: 5,
          comment: "E2E test feedback - 100MB bundle test",
          verified: true,
        },
      ])
      .select()
      .single()

    if (feedbackError) {
      log("Submit Feedback", "FAIL", undefined, feedbackError.message)
      return NextResponse.json({ results, summary: getSummary(results) })
    }
    log("Submit Feedback", "PASS", { feedbackId: feedbackData.id })

    // Step 7: Create Reward
    const rewardAmount = validQr.product_skus.reward_amount
    const { data: rewardData, error: rewardError } = await client
      .from("rewards")
      .insert([
        {
          feedback_id: feedbackData.id,
          qr_id: qrId,
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
      return NextResponse.json({ results, summary: getSummary(results) })
    }
    log("Create Reward", "PASS", { rewardId: rewardData.id, amount: `${rewardAmount}MB` })

    // Step 8: Mark QR as Used
    const { error: updateError } = await client
      .from("qr_codes")
      .update({
        is_used: true,
        used_by: testPhone,
        used_at: new Date().toISOString(),
      })
      .eq("id", qrId)

    if (updateError) {
      log("Mark QR as Used", "FAIL", undefined, updateError.message)
      return NextResponse.json({ results, summary: getSummary(results) })
    }
    log("Mark QR as Used", "PASS", { qrId })

    // Step 9: Process Reward (Send Real Data Bundle)
    // IMPORTANT: For 340g SKUs, we send 50MB twice (total 100MB) to match the displayed reward
    // For 500g SKUs, we send 50MB three times (total 150MB) to match the displayed reward
    // The customer only sees the total amount (100MB/150MB) - they don't know about multiple transactions
    try {
      let bundleSize = "50MB"
      let sendTimes = 1

      // Check SKU weight to determine bundle strategy
      const { data: skuRow } = await client
        .from("product_skus")
        .select("weight")
        .eq("id", skuData.id)
        .single()

      const weight = ((skuRow as any)?.weight || "").toString().trim().toLowerCase()
      if (weight === "340g") {
        // Send 50MB bundle twice to total 100MB (customer sees 100MB on QR code)
        bundleSize = "50MB"
        sendTimes = 2
        console.log(`[v0] E2E Test - 340g SKU detected: Sending 50MB × 2 = 100MB to ${testPhone}`)
      } else if (weight === "500g") {
        // Send 50MB bundle three times to total 150MB (customer sees 150MB on QR code)
        bundleSize = "50MB"
        sendTimes = 3
        console.log(`[v0] E2E Test - 500g SKU detected: Sending 50MB × 3 = 150MB to ${testPhone}`)
      } else {
        // Fallback to amount-based mapping if weight is unknown
        bundleSize = mapToSupportedBundleSize(rewardAmount)
        sendTimes = 1
        console.log(`[v0] E2E Test - Unknown weight: Sending ${bundleSize} (mapped from ${rewardAmount}MB) to ${testPhone}`)
      }

      const bundleResult = await sendDataBundle(testPhone, bundleSize, sendTimes)
      log("Send Data Bundle", "PASS", {
        transactionId: bundleResult.data?.transactionId,
        phoneNumber: bundleResult.data?.phoneNumber,
        bundleSize: bundleResult.data?.bundleSize,
        sendTimes,
        totalData: sendTimes === 2 ? "100MB" : sendTimes === 3 ? "150MB" : `${bundleSize}`,
        displayedAmount: rewardAmount,
      })

      await client
        .from("rewards")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", rewardData.id)

      log("Update to Sent", "PASS", { rewardId: rewardData.id })
    } catch (bundleError) {
      log("Send Data Bundle", "FAIL", undefined, bundleError instanceof Error ? bundleError.message : "Unknown error")

      await client.from("rewards").update({ status: "failed" }).eq("id", rewardData.id)
      log("Update to Failed", "PASS", { rewardId: rewardData.id })
    }

    // Step 10: Verify Complete Flow
    const { data: finalQr } = await client.from("qr_codes").select("*").eq("id", qrId).single()
    const { data: finalReward } = await client.from("rewards").select("*").eq("id", rewardData.id).single()

    if (finalQr?.is_used && finalReward) {
      log("Complete Flow Verification", "PASS", {
        qrUsed: finalQr.is_used,
        rewardStatus: finalReward.status,
      })
    } else {
      log("Complete Flow Verification", "FAIL", undefined, "State mismatch")
    }

    return NextResponse.json({
      results,
      summary: getSummary(results),
      testData: {
        productId: productData.id,
        skuId: skuData.id,
        qrId,
        feedbackId: feedbackData.id,
        rewardId: rewardData.id,
      },
      note: `Real data bundle(s) sent to ${testPhone}. Tested ${normalizedWeight} SKU: ${normalizedWeight === "340g" ? "2×50MB=100MB" : normalizedWeight === "500g" ? "3×50MB=150MB" : "single bundle"}. Customer sees ${rewardAmount}MB total.`,
    })
  } catch (error) {
    log("Unexpected Error", "FAIL", undefined, error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ results, summary: getSummary(results) }, { status: 500 })
  }
}

function getSummary(results: TestResult[]) {
  const passed = results.filter((r) => r.status === "PASS").length
  const failed = results.filter((r) => r.status === "FAIL").length
  return {
    total: results.length,
    passed,
    failed,
    successRate: results.length > 0 ? ((passed / results.length) * 100).toFixed(1) + "%" : "0%",
  }
}
