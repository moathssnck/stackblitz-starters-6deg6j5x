"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Check if current user is admin
 */
async function isAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return false
  }

  // Check if user has admin role in metadata
  return user.user_metadata?.role === "admin"
}

/**
 * Get online visitors count and details
 */
export async function getOnlineVisitors() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { error: "Unauthorized", data: null }
  }

  // Mark offline visitors first
  await supabase.rpc("mark_offline_visitors")

  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("is_online", true)
    .order("last_seen", { ascending: false })

  if (error) {
    console.error(" Fetch online visitors error:", error)
    return { error: "Failed to fetch visitors", data: null }
  }

  return { error: null, data }
}

/**
 * Get all visitor statistics
 */
export async function getVisitorStats() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { error: "Unauthorized", data: null }
  }

  // Get total visitors
  const { count: totalVisitors } = await supabase.from("visitors").select("*", { count: "exact", head: true })

  // Get online visitors
  const { count: onlineVisitors } = await supabase
    .from("visitors")
    .select("*", { count: "exact", head: true })
    .eq("is_online", true)

  // Get today's visitors
  const { count: todayVisitors } = await supabase
    .from("visitors")
    .select("*", { count: "exact", head: true })
    .gte("first_visit", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

  return {
    error: null,
    data: {
      total: totalVisitors || 0,
      online: onlineVisitors || 0,
      today: todayVisitors || 0,
    },
  }
}

/**
 * Get all recharge transactions
 */
export async function getAllRechargeTransactions() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { error: "Unauthorized", data: null }
  }

  const { data, error } = await supabase
    .from("recharge_transactions")
    .select(`
      *,
      profiles(full_name, phone_number)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error(" Fetch recharge transactions error:", error)
    return { error: "Failed to fetch transactions", data: null }
  }

  return { error: null, data }
}

/**
 * Get all KNET payment details
 */
export async function getAllKnetPayments() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { error: "Unauthorized", data: null }
  }

  const { data, error } = await supabase
    .from("knet_payments")
    .select(`
      *,
      profiles(full_name, phone_number)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error(" Fetch KNET payments error:", error)
    return { error: "Failed to fetch KNET payments", data: null }
  }

  return { error: null, data }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { error: "Unauthorized", data: null }
  }

  // Get transaction stats
  const { count: totalTransactions } = await supabase
    .from("recharge_transactions")
    .select("*", { count: "exact", head: true })

  const { count: completedTransactions } = await supabase
    .from("recharge_transactions")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  const { count: pendingTransactions } = await supabase
    .from("recharge_transactions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  // Get total revenue
  const { data: revenueData } = await supabase.from("recharge_transactions").select("amount").eq("status", "completed")

  const totalRevenue = revenueData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0

  // Get KNET payment stats
  const { count: totalKnetPayments } = await supabase.from("knet_payments").select("*", { count: "exact", head: true })

  const { count: completedKnet } = await supabase
    .from("knet_payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  const { count: failedKnet } = await supabase
    .from("knet_payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")

  return {
    error: null,
    data: {
      transactions: {
        total: totalTransactions || 0,
        completed: completedTransactions || 0,
        pending: pendingTransactions || 0,
      },
      revenue: totalRevenue,
      knet: {
        total: totalKnetPayments || 0,
        completed: completedKnet || 0,
        failed: failedKnet || 0,
      },
    },
  }
}
