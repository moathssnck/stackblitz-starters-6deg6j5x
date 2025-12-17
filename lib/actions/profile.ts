"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Get current user profile
 */
export async function getProfile() {
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

  // RLS ensures user can only access their own profile
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("[v0] Profile fetch error:", error)
    return {
      error: "Failed to fetch profile",
      data: null,
    }
  }

  return {
    error: null,
    data,
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  phone_number?: string
  full_name?: string
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

  // Validate phone number if provided
  if (updates.phone_number && !/^\d{8}$/.test(updates.phone_number)) {
    return {
      error: "Invalid phone number format",
      data: null,
    }
  }

  // RLS ensures user can only update their own profile
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

  if (error) {
    console.error("[v0] Profile update error:", error)
    return {
      error: "Failed to update profile",
      data: null,
    }
  }

  revalidatePath("/dashboard")

  return {
    error: null,
    data,
  }
}
