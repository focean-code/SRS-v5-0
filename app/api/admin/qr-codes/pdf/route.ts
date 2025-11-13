import { createServiceRoleClient, createClient } from "@/lib/supabase-server"
import type { NextRequest } from "next/server"
import QRCode from "qrcode"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const authSupabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser()

    if (authError || !user) {
      logger.error("Unauthorized PDF generation attempt")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const skuId = searchParams.get("skuId")
    const batchNumber = searchParams.get("batchNumber")

    if (!skuId || !batchNumber) {
      return Response.json({ error: "Missing required parameters: skuId, batchNumber" }, { status: 400 })
    }

    const client = await createServiceRoleClient()

    const { data: qrCodes, error } = await client
      .from("qr_codes")
      .select(
        `
        id, 
        url, 
        batch_number, 
        created_at,
        sku_id,
        product_skus!inner(
          weight,
          reward_amount,
          reward_description,
          products!inner(name)
        )
      `,
      )
      .eq("sku_id", skuId)
      .eq("batch_number", Number.parseInt(batchNumber))
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching QR codes:", error)
      return Response.json({ error: "Failed to fetch QR codes" }, { status: 500 })
    }

    if (!qrCodes || qrCodes.length === 0) {
      return Response.json({ error: "No QR codes found" }, { status: 404 })
    }

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>QR Codes Batch ${batchNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
          }
          body {
            padding: 0;
            margin: 0;
          }
          
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(6, 1fr);
            gap: 0;
            width: 100%;
            height: 100vh;
            page-break-after: always;
          }
          
          .qr-card {
            background: linear-gradient(135deg, #00A651 0%, #008C3F 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 12px 8px;
            page-break-inside: avoid;
            position: relative;
            break-inside: avoid;
            color: white;
            font-weight: 500;
            text-align: center;
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .card-instruction {
            font-size: 8px;
            font-weight: 700;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.1;
            max-width: 95%;
          }
          
          .reward-amount {
            font-size: 24px;
            font-weight: 800;
            margin: 4px 0;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          .data-label {
            background: #FFD60A;
            color: #00A651;
            padding: 3px 6px;
            border-radius: 2px;
            font-size: 7px;
            font-weight: 700;
            margin: 4px 0;
            display: inline-block;
          }
          
          .qr-code-container {
            background: white;
            padding: 12px;
            border-radius: 6px;
            margin: 8px 0;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
          }
          
          .qr-code-container img {
            width: 140px;
            height: 140px;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            display: block;
          }
          
          .sku-size {
            font-size: 12px;
            font-weight: 800;
            margin-top: 4px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .qr-card {
              margin: 0;
              page-break-inside: avoid;
            }
            .qr-grid {
              height: auto;
              page-break-inside: avoid;
            }
            @page {
              size: A4;
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="qr-grid">
    `

    for (let i = 0; i < qrCodes.length; i++) {
      const qr = qrCodes[i] as any
      const sku = qr.product_skus || {}
      const product = sku.products || {}
      const rewardDescription = "FREE SAFARICOM DATA"
      const weight = sku.weight || "undefined"
      const productName = product.name || "Product"

      // Calculate displayed reward amount based on SKU weight
      // IMPORTANT: For 340g SKUs, customer sees 100MB (2×50MB bundles)
      // For 500g SKUs, customer sees 150MB (3×50MB bundles)
      // The displayed amount should match what customer receives in total
      let displayedRewardAmount = sku.reward_amount || 0
      const weightLower = String(weight).trim().toLowerCase()
      if (weightLower === "340g") {
        displayedRewardAmount = 100 // Customer receives 2×50MB = 100MB total
      } else if (weightLower === "500g") {
        displayedRewardAmount = 150 // Customer receives 3×50MB = 150MB total
      }

      console.log("QR Card Data:", {
        displayedRewardAmount,
        weight,
        productName,
        rewardDescription,
        url: qr.url,
        dbRewardAmount: sku.reward_amount,
        note: "Displayed amount matches total bundles customer receives",
      })

      try {
        // Use LOW error correction for simpler QR codes that scan better at small sizes
        // Large margin (6) ensures proper quiet zone for camera detection
        const qrDataUrl = await QRCode.toDataURL(qr.url, {
          width: 1024,
          margin: 6,
          errorCorrectionLevel: "L",
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })

        htmlContent += `
          <div class="qr-card">
            <div class="card-instruction">
              OPEN THE PACK, ENJOY YOUR READY TO EAT MEAL, GIVE US YOUR FEEDBACK AND GET
            </div>
            
            <div class="reward-amount">${displayedRewardAmount}MB</div>
            
            <div class="data-label">${rewardDescription}</div>
            
            <div class="qr-code-container">
              <img src="${qrDataUrl}" alt="QR Code">
            </div>
            
            <div class="sku-size">${weight}</div>
          </div>
        `
      } catch (qrError) {
        console.error(`Error generating QR code for ${qr.id}:`, qrError)
        continue
      }
    }

    htmlContent += `
        </div>
      </body>
      </html>
    `

    const filename = `qr-codes-batch-${batchNumber}-${new Date().toISOString().split("T")[0]}.html`

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating QR document:", error)
    return Response.json(
      {
        error: "Failed to generate QR document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
