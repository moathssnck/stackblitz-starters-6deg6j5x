import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tranid = searchParams.get("tranid")
    const result = searchParams.get("result") // SUCCESS or FAILURE
    const paymentId = searchParams.get("paymentid")
    const trackId = searchParams.get("trackid")

    if (!tranid) {
      return NextResponse.redirect(new URL("/payment/error", request.url))
    }

    const supabase = await createServerClient()

    // Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: result === "CAPTURED" ? "completed" : "failed",
        payment_gateway_response: {
          result,
          paymentId,
          trackId,
          timestamp: new Date().toISOString(),
        },
        completed_at: result === "CAPTURED" ? new Date().toISOString() : null,
      })
      .eq("transaction_id", tranid)

    if (updateError) {
      console.error(" Failed to update transaction:", updateError)
    }

    // If payment is successful, process the recharge
    if (result === "CAPTURED") {
      // Here you would integrate with Zain API to actually process the recharge
      // For now, we'll just redirect to success page

      return NextResponse.redirect(new URL(`/payment/success?txn=${tranid}`, request.url))
    } else {
      return NextResponse.redirect(new URL(`/payment/failed?txn=${tranid}`, request.url))
    }
  } catch (error) {
    console.error(" KNET callback error:", error)
    return NextResponse.redirect(new URL("/payment/error", request.url))
  }
}

export async function POST(request: NextRequest) {
  // Some payment gateways send POST requests for callbacks
  return GET(request)
}
