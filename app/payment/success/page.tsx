"use client"

import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const txn = searchParams.get("txn")

  return (
    <div dir="rtl" className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="h-24 w-24 text-[#34C759] mx-auto" />
        </div>

        <h1 className="text-3xl font-bold text-[#1C1C1E] mb-4">تمت العملية بنجاح!</h1>

        <p className="text-[#86868B] mb-2">تم شحن رصيدك بنجاح</p>

        {txn && <p className="text-sm text-[#86868B] mb-8">رقم المعاملة: {txn}</p>}

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full bg-gradient-to-r from-[#E20074] to-[#C4006E] hover:from-[#C4006E] hover:to-[#E20074] text-white py-6 rounded-lg text-lg font-bold">
              العودة للصفحة الرئيسية
            </Button>
          </Link>

          <Link href="/history" className="block">
            <Button
              variant="outline"
              className="w-full border-[#E20074] text-[#E20074] py-6 rounded-lg text-lg font-semibold bg-transparent"
            >
              عرض سجل المعاملات
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
