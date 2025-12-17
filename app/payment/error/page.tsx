"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentErrorPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="h-24 w-24 text-[#FF9500] mx-auto" />
        </div>

        <h1 className="text-3xl font-bold text-[#1C1C1E] mb-4">حدث خطأ</h1>

        <p className="text-[#86868B] mb-8">حدث خطأ غير متوقع أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.</p>

        <Link href="/" className="block">
          <Button className="w-full bg-gradient-to-r from-[#E20074] to-[#C4006E] hover:from-[#C4006E] hover:to-[#E20074] text-white py-6 rounded-lg text-lg font-bold">
            العودة للصفحة الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  )
}
