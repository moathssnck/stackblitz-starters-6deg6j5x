import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * API endpoint for creating recharge transactions
 * This provides an alternative to server actions for external integrations
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { phone_number, amount, validity_days } = body

    // Input validation
    if (!phone_number || !/^\d{8}$/.test(phone_number)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    if (!amount || amount <= 0 || amount > 50) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!validity_days || validity_days <= 0) {
      return NextResponse.json({ error: "Invalid validity period" }, { status: 400 })
    }

    // Generate transaction reference
    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create transaction
    const { data, error } = await supabase
      .from("recharge_transactions")
      .insert({
        user_id: user.id,
        phone_number,
        amount,
        validity_days,
        status: "pending",
        transaction_reference: transactionRef,
      })
      .select()
      .single()

    if (error) {
      console.error(" API recharge error:", error)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error(" API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Get user's transaction history
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("recharge_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error(" API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
