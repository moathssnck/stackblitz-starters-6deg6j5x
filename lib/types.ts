export interface Profile {
  id: string
  phone_number: string | null
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface RechargeTransaction {
  id: string
  user_id: string
  phone_number: string
  amount: number
  validity_days: number
  status: "pending" | "completed" | "failed" | "cancelled"
  transaction_reference: string | null
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  method_type: "eeZee" | "credit_card" | "debit_card"
  last_four: string | null
  is_default: boolean
  created_at: string
}

export interface RechargeRequest {
  phone_number: string
  amount: number
  validity_days: number
  payment_method_id?: string
}
