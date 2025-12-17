import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/admin/dashboard-content"
import {
  getOnlineVisitors,
  getVisitorStats,
  getAllRechargeTransactions,
  getAllKnetPayments,
  getDashboardStats,
} from "@/lib/actions/admin"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login?redirect=/admin/dashboard")
  }

  // Check if user is admin
  if (user.user_metadata?.role !== "admin") {
    redirect("/?error=unauthorized")
  }

  // Fetch all dashboard data in parallel
  const [onlineVisitorsResult, visitorStatsResult, transactionsResult, knetPaymentsResult, dashboardStatsResult] =
    await Promise.all([
      getOnlineVisitors(),
      getVisitorStats(),
      getAllRechargeTransactions(),
      getAllKnetPayments(),
      getDashboardStats(),
    ])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent
        onlineVisitors={onlineVisitorsResult.data || []}
        visitorStats={visitorStatsResult.data}
        transactions={transactionsResult.data || []}
        knetPayments={knetPaymentsResult.data || []}
        dashboardStats={dashboardStatsResult.data}
      />
    </div>
  )
}
