import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId, otp } = await request.json()

    if (!transactionId || !otp) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
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

    if (new Date(knetPayment.otp_expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "OTP has expired" }, { status: 400 })
    }

    if (knetPayment.otp_attempts >= 3) {
      await supabase.from("knet_payments").update({ status: "failed" }).eq("id", knetPayment.id)
      return NextResponse.json({ success: false, error: "Maximum OTP attempts exceeded" }, { status: 400 })
    }

    const isValidOTP = otp === knetPayment.otp_code

    if (!isValidOTP) {
      await supabase
        .from("knet_payments")
        .update({
          otp_attempts: knetPayment.otp_attempts + 1,
        })
        .eq("id", knetPayment.id)

      return NextResponse.json(
        {
          success: false,
          error: `Invalid OTP. ${2 - knetPayment.otp_attempts} attempts remaining`,
        },
        { status: 400 },
      )
    }

    const { error: knetUpdateError } = await supabase
      .from("knet_payments")
      .update({
        otp_verified: true,
        status: "completed",
        completed_at: new Date().toISOString(),
        payment_reference: `KNET-${Date.now()}`,
      })
      .eq("id", knetPayment.id)

    if (knetUpdateError) {
      console.error(" Failed to update KNET payment:", knetUpdateError)
      return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
    }

    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single()

    if (transaction) {
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          payment_gateway_response: {
            otp_verified: true,
            payment_reference: `KNET-${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        })
        .eq("transaction_id", transactionId)

      const rechargeData = transaction.recharge_data as any
      if (rechargeData && rechargeData.items) {
        for (const item of rechargeData.items) {
          await supabase.from("recharge_transactions").insert({
            user_id: transaction.user_id,
            phone_number: item.phoneNumber,
            amount: item.amount,
            validity_days: Number.parseInt(item.validity) || 30,
            status: "completed",
            transaction_reference: `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          })
        }
      }
    }

    console.log(" OTP verified, payment completed")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" OTP verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
