"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Get user's payment methods
 */
export async function getPaymentMethods() {
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

  const { data, error } = await supabase.from("payment_methods").select("*").order("is_default", { ascending: false })

  if (error) {
    console.error("[v0] Payment methods fetch error:", error)
    return {
      error: "Failed to fetch payment methods",
      data: null,
    }
  }

  return {
    error: null,
    data,
  }
}

/**
 * Add a new payment method
 */
export async function addPaymentMethod(method: {
  method_type: "eeZee" | "credit_card" | "debit_card"
  last_four?: string
  is_default?: boolean
}) {
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

  // If setting as default, unset other defaults first
  if (method.is_default) {
    await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id)
  }

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      user_id: user.id,
      method_type: method.method_type,
      last_four: method.last_four || null,
      is_default: method.is_default || false,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Payment method add error:", error)
    return {
      error: "Failed to add payment method",
      data: null,
    }
  }

  revalidatePath("/dashboard")

  return {
    error: null,
    data,
  }
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(methodId: string) {
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

  const { error } = await supabase.from("payment_methods").delete().eq("id", methodId)

  if (error) {
    console.error("[v0] Payment method delete error:", error)
    return {
      error: "Failed to delete payment method",
      data: null,
    }
  }

  revalidatePath("/dashboard")

  return {
    error: null,
    data: null,
  }
}
