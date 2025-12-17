"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function initiateKnetPayment(rechargeData: {
  items: Array<{ phoneNumber: string; amount: number; validity: string }>
  total: number
  type: string
}) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user (optional for guest checkout)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Generate a unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id || null,
        transaction_id: transactionId,
        amount: rechargeData.total,
        currency: "KWD",
        status: "pending",
        payment_method: "knet",
        recharge_data: rechargeData,
      })
      .select()
      .single()

    if (dbError) {
      console.error(" Database error:", dbError)
      return { success: false, error: "Failed to create transaction" }
    }

    const paymentUrl = `/payment/knet?amount=${rechargeData.total}&txn=${transactionId}`

    return {
      success: true,
      redirectUrl: paymentUrl,
      transactionId,
    }
  } catch (error) {
    console.error(" Payment initiation error:", error)
    return { success: false, error: "Internal server error" }
  }
}
