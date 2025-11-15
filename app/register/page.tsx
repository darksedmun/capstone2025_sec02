"use client"

import { useState } from "react"
import RegisterForm from "@/components/register"
import LoginForm from "@/components/login"

export default function RegisterPage() {
  const [registered, setRegistered] = useState(false)

  if (registered) {
   
    return <LoginForm onLoginSuccess={() => console.log("logueado")} />
  }

  return <RegisterForm onRegisterSuccess={() => setRegistered(true)} />
}
