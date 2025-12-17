"use client"

import { useState } from "react"
import { Menu, Heart, ShoppingCart, ChevronDown, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initiateKnetPayment } from "@/lib/actions/payment"

type RechargeItem = {
  id: string
  phoneNumber: string
  amount: number
  validity: string
  bonus?: { amount: number; validity: string }
  error?: string
}

export default function RechargePage() {
  const [activeTab, setActiveTab] = useState<"eezee" | "bill">("eezee")
  const [rechargeFor, setRechargeFor] = useState("other")
  const [items, setItems] = useState<RechargeItem[]>([
    {
      id: "1",
      phoneNumber: "",
      amount: 6,
      validity: "30 يوم",
      bonus: { amount: 1.5, validity: "3 أيام فقط" },
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const amounts = [
    { value: 2, label: "2.000 د.ك", validity: "7 يوم" },
    { value: 4, label: "4.000 د.ك", validity: "30 يوم", bonus: { amount: 1, validity: "3 أيام فقط" } },
    { value: 6, label: "6.000 د.ك", validity: "30 يوم", bonus: { amount: 1.5, validity: "3 أيام فقط" } },
    { value: 8, label: "8.000 د.ك", validity: "30 يوم", bonus: { amount: 2, validity: "3 أيام فقط" } },
    { value: 10, label: "10.000 د.ك", validity: "30 يوم", bonus: { amount: 2.5, validity: "3 أيام فقط" } },
    { value: 15, label: "15.000 د.ك", validity: "90 يوم", bonus: { amount: 4.5, validity: "3 أيام فقط" } },
    { value: 20, label: "20.000 د.ك", validity: "90 يوم", bonus: { amount: 6, validity: "3 أيام فقط" } },
  ]

  const addNewNumber = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        phoneNumber: "",
        amount: 6,
        validity: "30 يوم",
        bonus: { amount: 1.5, validity: "3 أيام فقط" },
      },
    ])
  }

  const removeNumber = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof RechargeItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          if (field === "amount") {
            const selectedAmount = amounts.find((a) => a.value === value)
            return {
              ...item,
              [field]: value,
              validity: selectedAmount?.validity || "",
              bonus: selectedAmount?.bonus,
              error: undefined,
            }
          }
          return { ...item, [field]: value, error: undefined }
        }
        return item
      }),
    )
  }

  const validateItems = () => {
    let isValid = true
    const newItems = items.map((item) => {
      if (!item.phoneNumber || item.phoneNumber.length < 8) {
        isValid = false
        return { ...item, error: "هذه الخانة مطلوبة" }
      }
      return { ...item, error: undefined }
    })
    setItems(newItems)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateItems()) return

    setIsSubmitting(true)
    try {
      const total = items.reduce((sum, item) => sum + item.amount, 0)
      const rechargeData = {
        items: items.map((item) => ({
          phoneNumber: item.phoneNumber,
          amount: item.amount,
          validity: item.validity,
        })),
        total,
        type: activeTab,
      }

      // Call the server action to initiate KNET payment
      const result = await initiateKnetPayment(rechargeData)

      if (result.success && result.redirectUrl) {
        // Redirect to KNET payment gateway
        window.location.href = result.redirectUrl
      } else {
        alert("حدث خطأ في معالجة الطلب. يرجى المحاولة مرة أخرى.")
      }
    } catch (error) {
      console.error(" Payment initiation error:", error)
      alert("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div dir="rtl" className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="bg-[#2B1B3D] px-4 py-4 flex items-center justify-between" dir="ltr" >
        <div className="flex items-center gap-4">
          <button className="text-white">
            <Menu className="h-6 w-6" />
          </button>
          <button className="text-white">
            <Heart className="h-6 w-6" />
          </button>
          <div className="h-px w-[1px] bg-white/30 mx-2" />
          <button className="bg-white rounded-full p-3">
            <ShoppingCart className="h-6 w-6 text-pink-500" />
          </button>
        </div>
        <img
          src="/lojgo.png"
          alt="Zain Logo"
          className="h-10 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </header>

      {/* Title */}
      <div className="bg-[#F5F5F7] px-6 py-6">
        <h1 className="text-3xl font-bold text-right text-[#1C1C1E]">الدفع السريع</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white mx-4 rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-2 border-b-2 border-[#F5F5F7]">
          <button
            onClick={() => setActiveTab("bill")}
            className={`py-4 text-center font-semibold transition-colors ${
              activeTab === "bill" ? "text-[#E20074] border-b-2 border-[#E20074]" : "text-[#86868B]"
            }`}
          >
            دفع الفاتورة
          </button>
          <button
            onClick={() => setActiveTab("eezee")}
            className={`py-4 text-center font-semibold transition-colors ${
              activeTab === "eezee" ? "text-[#E20074] border-b-2 border-[#E20074]" : "text-[#86868B]"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              إعادة تعبئة <span className="font-bold">eeZee</span>
            </span>
          </button>
        </div>

        {/* Recharge For Dropdown */}
        <div className="p-6 border-b border-[#F5F5F7]">
          <label className="block text-right text-[#1C1C1E] mb-3 text-sm">أود أن أعيد التعبئة لـ</label>
          <div className="relative">
            <select
              value={rechargeFor}
              onChange={(e) => setRechargeFor(e.target.value)}
              className="w-full bg-[#F5F5F7] border-0 rounded-lg px-4 py-3 text-right appearance-none text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E20074]"
            >
              <option value="other">رقم آخر</option>
              <option value="self">رقمي</option>
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#E20074] pointer-events-none" />
          </div>
        </div>

        {/* Recharge Items */}
        {items.map((item, index) => (
          <div key={item.id} className="p-6 border-b border-[#F5F5F7] relative">
            {items.length > 1 && (
              <button
                onClick={() => removeNumber(item.id)}
                className="absolute top-4 left-4 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {/* Phone Number */}
            <div className="mb-6">
              <label className="block text-right text-[#1C1C1E] mb-2 text-sm">
                رقم الهاتف <span className="text-[#FF3B30]">*</span>
              </label>
              <Input
                type="tel"
                maxLength={8}
                placeholder="أدخل الرقم: 99XXXXXXX"
                value={item.phoneNumber}
                onChange={(e) => updateItem(item.id, "phoneNumber", e.target.value)}
                className={`text-right bg-[#F5F5F7] border-0 rounded-lg px-4 py-6 text-2xl ${
                  item.error ? "ring-2 ring-[#FF3B30]" : ""
                }`}
                dir="ltr"
              />
              {item.error && <p className="text-[#FF3B30] text-sm mt-2 text-right">{item.error}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-right text-[#1C1C1E] mb-3 text-sm">مبلغ التعبئة</label>
              <div className="relative">
                <select
                  value={item.amount}
                  onChange={(e) => updateItem(item.id, "amount", Number(e.target.value))}
                  className="w-full bg-[#F5F5F7] border-0 rounded-lg px-4 py-4 text-right appearance-none focus:outline-none focus:ring-2 focus:ring-[#E20074]"
                >
                  {amounts.map((amt) => (
                    <option key={amt.value} value={amt.value}>
                      {amt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#E20074] pointer-events-none" />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <p className="text-[#86868B]">الصلاحية {item.validity}</p>
                {item.bonus && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868B] text-xs">
                      د.ك {item.bonus.amount} مجاني صالح لمدة {item.bonus.validity}
                    </span>
                    <span className="bg-[#E20074] text-white text-xs px-2 py-1 rounded">عرض</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Number Button */}
      <button
        onClick={addNewNumber}
        className="mx-4 mb-4 w-[calc(100%-2rem)] bg-white hover:bg-[#F5F5F7] border-2 border-dashed border-[#E20074] rounded-lg py-4 flex items-center justify-center gap-2 text-[#E20074] font-semibold transition-colors"
      >
        <Plus className="h-5 w-5" />
        أضف رقم آخر
      </button>

      {/* Total Section */}
      <div className="bg-white mx-4 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#34C759] text-4xl font-bold">{totalAmount.toFixed(3)} د.ك</p>
          <p className="text-[#1C1C1E] text-2xl font-semibold">إجمالي</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#E20074] to-[#C4006E] hover:from-[#C4006E] hover:to-[#E20074] text-white py-6 rounded-lg text-xl font-bold shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? "جاري المعالجة..." : "أعد التعبئة الآن"}
        </Button>
      </div>
    </div>
  )
}
