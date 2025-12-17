"use client"

import { trackVisitorActivity } from "@/lib/actions/visitor-tracking"
import { useEffect } from "react"

export function VisitorTracker() {
  useEffect(() => {
    // Generate or get session ID
    let sessionId = localStorage.getItem("visitor_session_id")
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem("visitor_session_id", sessionId)
    }

    // Track initial page load
    trackVisitorActivity(sessionId, window.location.pathname)

    // Track every 30 seconds to keep visitor "online"
    const interval = setInterval(() => {
      trackVisitorActivity(sessionId!, window.location.pathname)
    }, 30000)

    // Track on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        trackVisitorActivity(sessionId!, window.location.pathname)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return null
}
