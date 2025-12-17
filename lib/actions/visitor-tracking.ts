"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

/**
 * Track visitor activity
 */
export async function trackVisitorActivity(sessionId: string, pagePath?: string) {
  const supabase = await createClient()
  const headersList = await headers()

  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"
  const referrer = headersList.get("referer") || null

  try {
    await supabase.rpc("update_visitor_activity", {
      p_session_id: sessionId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_page_path: pagePath || "/",
      p_referrer: referrer,
    })

    return { success: true }
  } catch (error) {
    console.error(" Visitor tracking error:", error)
    return { success: false }
  }
}
