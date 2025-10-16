"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

export default function ContactScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })

      if (!res.ok) throw new Error("Error al enviar el mensaje")

      setStatus("success")
      setName("")
      setEmail("")
      setMessage("")
    } catch (err) {
      console.error(err)
      setStatus("error")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm p-4 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Queremos escucharte
          </CardTitle>
          <CardDescription className="text-center">
            Envía tu mensaje y nos pondremos en contacto contigo
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="name" className="mb-2 block">
                Tu nombre
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Correo */}
            <div>
              <Label htmlFor="email" className="mb-2 block">
                Tu correo
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Mensaje */}
            <div>
              <Label htmlFor="message" className="mb-2 block">
                Mensaje
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-32"
                required
              />
            </div>

            {/* Estado del envío */}
            {status === "success" && (
              <p className="text-center text-sm font-medium" style={{ color: BUTTON_COLOR }}>
                ¡Mensaje enviado con éxito! Te contactaremos pronto.
              </p>
            )}
            {status === "error" && (
              <p className="text-center text-sm text-red-500">
                Ocurrió un error al enviar tu mensaje. Intenta nuevamente.
              </p>
            )}

            {/* Botón */}
            <Button
              type="submit"
              className="w-full"
              disabled={status === "sending"}
              style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
            >
              {status === "sending" ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
