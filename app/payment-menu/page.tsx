"use client"

import { PaymentMenu } from "@/components/payment-menu"

export default function PaymentMenuPage() {
  return (
    <PaymentMenu
      onLogout={() => {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }}
    />
  )
}
