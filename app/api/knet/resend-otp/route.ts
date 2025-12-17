import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Missing transaction ID" }, { status: 400 })
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

    console.log("[v0] Resending OTP for transaction:", transactionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Resend OTP error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
