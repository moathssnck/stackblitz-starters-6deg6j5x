"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { RechargeRequest } from "@/lib/types"

/**
 * Create a new recharge transaction with security validations
 */
export async function createRecharge(request: RechargeRequest) {
  const supabase = await createClient()

  // Verify user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: "Unauthorized. Please sign in to continue.",
      data: null,
    }
  }

  // Input validation
  if (!request.phone_number || !/^\d{8}$/.test(request.phone_number)) {
    return {
      error: "Invalid phone number. Must be 8 digits.",
      data: null,
    }
  }

  if (request.amount <= 0 || request.amount > 50) {
    return {
      error: "Invalid amount. Must be between 0.001 and 50 KD.",
      data: null,
    }
  }

  if (request.validity_days <= 0 || request.validity_days > 365) {
    return {
      error: "Invalid validity period.",
      data: null,
    }
  }

  // Generate unique transaction reference
  const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

  // Insert transaction (RLS ensures user can only insert their own records)
  const { data, error } = await supabase
    .from("recharge_transactions")
    .insert({
      user_id: user.id,
      phone_number: request.phone_number,
      amount: request.amount,
      validity_days: request.validity_days,
      status: "pending",
      transaction_reference: transactionRef,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Recharge creation error:", error)
    return {
      error: "Failed to create recharge transaction. Please try again.",
      data: null,
    }
  }

  // In production, integrate with payment gateway here
  // For now, auto-complete the transaction
  const { data: completedData, error: updateError } = await supabase
    .from("recharge_transactions")
    .update({ status: "completed" })
    .eq("id", data.id)
    .select()
    .single()

  if (updateError) {
    console.error("[v0] Transaction update error:", updateError)
  }

  revalidatePath("/dashboard")
  revalidatePath("/recharge")

  return {
    error: null,
    data: completedData || data,
  }
}

/**
 * Get user's recharge transaction history
 */
export async function getRechargeHistory() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: "Unauthorized",
      data: null,
    }
  }

  // RLS automatically filters to user's own transactions
  const { data, error } = await supabase
    .from("recharge_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[v0] Fetch history error:", error)
    return {
      error: "Failed to fetch transaction history",
      data: null,
    }
  }

  return {
    error: null,
    data,
  }
}

/**
 * Get a specific transaction by ID
 */
export async function getTransaction(transactionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: "Unauthorized",
      data: null,
    }
  }

  // RLS ensures user can only access their own transactions
  const { data, error } = await supabase.from("recharge_transactions").select("*").eq("id", transactionId).single()

  if (error) {
    return {
      error: "Transaction not found",
      data: null,
    }
  }

  return {
    error: null,
    data,
  }
}

/**
 * Cancel a pending transaction
 */
export async function cancelTransaction(transactionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: "Unauthorized",
      data: null,
    }
  }

  // RLS ensures user can only update their own transactions
  const { data, error } = await supabase
    .from("recharge_transactions")
    .update({ status: "cancelled" })
    .eq("id", transactionId)
    .eq("status", "pending")
    .select()
    .single()

  if (error) {
    return {
      error: "Failed to cancel transaction",
      data: null,
    }
  }

  revalidatePath("/dashboard")

  return {
    error: null,
    data,
  }
}
