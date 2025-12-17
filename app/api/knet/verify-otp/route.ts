import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId, otp } = await request.json()

    if (!transactionId || !otp) {
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

    if (transaction.status !== "otp_required") {
      return NextResponse.json({ success: false, error: "Transaction is not awaiting OTP" }, { status: 400 })
    }

    // For demo, we'll simulate OTP verification (accept any 6-digit OTP)
    const isValidOTP = otp.length === 6

    if (!isValidOTP) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        payment_gateway_response: {
          otp_verified: true,
          timestamp: new Date().toISOString(),
        },
      })
      .eq("transaction_id", transactionId)

    if (updateError) {
      console.error("[v0] Failed to update transaction:", updateError)
      return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
    }

    const rechargeData = transaction.recharge_data as any
    if (rechargeData && rechargeData.items) {
      for (const item of rechargeData.items) {
        await supabase.from("recharges").insert({
          user_id: transaction.user_id,
          transaction_id: transaction.id,
          phone_number: item.phoneNumber,
          amount: item.amount,
          validity_days: Number.parseInt(item.validity),
          status: "completed",
        })
      }
    }

    console.log("[v0] OTP verified, payment completed")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] OTP verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
