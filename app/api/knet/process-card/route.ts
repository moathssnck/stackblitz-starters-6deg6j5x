import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId, cardDetails } = await request.json()

    if (!transactionId || !cardDetails) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: transaction, error: txnError } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single()

    if (txnError || !transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ success: false, error: "Transaction is not in pending status" }, { status: 400 })
    }

    // This is for demo purposes - in production, send to KNET API
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        payment_details: {
          bank: cardDetails.bank,
          cardLastFour: cardDetails.cardNumber.slice(-4),
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          submittedAt: new Date().toISOString(),
        },
        status: "otp_required",
      })
      .eq("transaction_id", transactionId)

    if (updateError) {
      console.error("[v0] Failed to update transaction:", updateError)
      return NextResponse.json({ success: false, error: "Failed to process card details" }, { status: 500 })
    }

    console.log("[v0] Card details processed, OTP required")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Card processing error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
