"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, CreditCard, DollarSign, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type DashboardContentProps = {
  onlineVisitors: any[]
  visitorStats: any
  transactions: any[]
  knetPayments: any[]
  dashboardStats: any
}

export function DashboardContent({
  onlineVisitors: initialVisitors,
  visitorStats: initialStats,
  transactions,
  knetPayments,
  dashboardStats,
}: DashboardContentProps) {
  const [onlineVisitors, setOnlineVisitors] = useState(initialVisitors)
  const [visitorStats, setVisitorStats] = useState(initialStats)

  // Real-time updates for online visitors
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("visitors-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitors",
        },
        (payload) => {
          console.log(" Visitor change:", payload)
          // Refresh visitor data
          setOnlineVisitors((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new]
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((v) => (v.id === payload.new.id ? payload.new : v)).filter((v) => v.is_online)
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((v) => v.id !== payload.old.id)
            }
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your platform activity in real-time</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Online Visitors</CardTitle>
            <Activity className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{visitorStats?.online || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total: {visitorStats?.total || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-[#E20074]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#E20074]">{dashboardStats?.revenue?.toFixed(3) || 0} KWD</div>
            <p className="text-xs text-gray-500 mt-1">From completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dashboardStats?.transactions?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardStats?.transactions?.completed || 0} completed, {dashboardStats?.transactions?.pending || 0}{" "}
              pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">KNET Payments</CardTitle>
            <CreditCard className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{dashboardStats?.knet?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardStats?.knet?.completed || 0} completed, {dashboardStats?.knet?.failed || 0} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="visitors" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="visitors">
            <Users className="h-4 w-4 mr-2" />
            Visitors
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="knet">
            <CreditCard className="h-4 w-4 mr-2" />
            KNET Payments
          </TabsTrigger>
        </TabsList>

        {/* Online Visitors Tab */}
        <TabsContent value="visitors">
          <Card>
            <CardHeader>
              <CardTitle>Online Visitors</CardTitle>
              <CardDescription>Real-time visitor activity on your platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onlineVisitors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No visitors online currently</p>
                ) : (
                  onlineVisitors.map((visitor) => (
                    <div key={visitor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <p className="font-medium">{visitor.session_id.substring(0, 12)}...</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{visitor.page_path || "/"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {visitor.ip_address} | Visits: {visitor.visit_count}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Last seen: {new Date(visitor.last_seen).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          First visit: {new Date(visitor.first_visit).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recharge Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recharge Transactions</CardTitle>
              <CardDescription>All mobile recharge submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{transaction.phone_number}</p>
                          <div className={getStatusColor(transaction.status)}>{transaction.status}</div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Amount: {Number(transaction.amount).toFixed(3)} KWD | Validity: {transaction.validity_days}{" "}
                          days
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Ref: {transaction.transaction_reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#E20074]">
                          {Number(transaction.amount).toFixed(3)} KWD
                        </p>
                        <p className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KNET Payments Tab */}
        <TabsContent value="knet">
          <Card>
            <CardHeader>
              <CardTitle>KNET Payment Details</CardTitle>
              <CardDescription>Complete KNET transaction records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knetPayments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No KNET payments yet</p>
                ) : (
                  knetPayments.map((payment) => (
                    <div key={payment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">TXN: {payment.transaction_id}</p>
                          <div className={getStatusColor(payment.status)}>{payment.status}</div>
                        </div>
                        <p className="text-lg font-bold text-[#E20074]">
                          {Number(payment.amount).toFixed(3)} {payment.currency}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Card Holder</p>
                          <p className="font-medium">{payment.card_holder_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Card Number</p>
                          <p className="font-medium">**** **** **** {payment.card_number_last4 || "****"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expiry</p>
                          <p className="font-medium">{payment.card_expiry || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">OTP Verified</p>
                          <p className="font-medium">{payment.otp_verified ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">IP Address</p>
                          <p className="font-medium">{payment.ip_address || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">{new Date(payment.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {payment.recharge_data && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-gray-500 text-sm mb-2">Recharge Details:</p>
                          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(payment.recharge_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
