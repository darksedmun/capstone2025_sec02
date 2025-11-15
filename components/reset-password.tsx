"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

export default function ResetPasswordForm() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isActive) router.push("/login")
    }, 8000)

    return () => clearTimeout(timer)
  }, [isActive, router])

  const handleSubmit = async () => {
    setError("")
    setSuccess("")

    if (!username || !oldPassword || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, oldPassword, password, confirmPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess("Contraseña cambiada con éxito")
        setUsername("")
        setOldPassword("")
        setPassword("")
        setConfirmPassword("")

        setTimeout(() => router.push("/login"), 1500)
      } else {
        setError(data.error || "Error al cambiar la contraseña")
      }
    } catch {
      setError("Error de conexión con el servidor")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm p-4 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setIsActive(true)
            }}
            className="w-full p-2 border rounded-md"
          />

          <input
            type="password"
            placeholder="Contraseña actual"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value)
              setIsActive(true)
            }}
            className="w-full p-2 border rounded-md"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setIsActive(true)
            }}
            className="w-full p-2 border rounded-md"
          />

          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setIsActive(true)
            }}
            className="w-full p-2 border rounded-md"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && (
            <p className="text-sm font-medium text-center" style={{ color: BUTTON_COLOR }}>
              {success}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full mt-2"
            style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          >
            Cambiar contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
