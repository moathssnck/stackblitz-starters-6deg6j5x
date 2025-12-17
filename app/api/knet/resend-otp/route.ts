import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Missing transaction ID" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: knetPayment, error: knetError } = await supabase
      .from("knet_payments")
      .select("*")
      .eq("transaction_id", transactionId)
      .single()

    if (knetError || !knetPayment) {
      return NextResponse.json({ success: false, error: "Payment record not found" }, { status: 404 })
    }

    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const newOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const { error: updateError } = await supabase
      .from("knet_payments")
      .update({
        otp_code: newOtpCode,
        otp_expires_at: newOtpExpiresAt.toISOString(),
        otp_attempts: 0,
      })
      .eq("id", knetPayment.id)

    if (updateError) {
      console.error(" Failed to update OTP:", updateError)
      return NextResponse.json({ success: false, error: "Failed to resend OTP" }, { status: 500 })
    }

    console.log(" Resending OTP for transaction:", transactionId, "New OTP:", newOtpCode)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" Resend OTP error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
