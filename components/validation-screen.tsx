"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Timer } from "lucide-react"

interface ValidationScreenProps {
  onBack: () => void
}

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

const generateRandomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const ValidationScreen: React.FC<ValidationScreenProps> = ({ onBack }) => {
  const [generatedCode, setGeneratedCode] = useState(generateRandomCode())
  const [validationCode, setValidationCode] = useState("")
  const [timeLeft, setTimeLeft] = useState(300)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"code" | "success">("code")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGeneratedCode(generateRandomCode())
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (validationCode.toUpperCase() === generatedCode) {
      setStep("success")
    } else {
      setError("Código incorrecto. Intenta nuevamente.")
    }
  }

  const handleRequestNewCode = () => {
    setGeneratedCode(generateRandomCode())
    setTimeLeft(300)
    setValidationCode("")
    setError("")
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full w-fit" style={{ backgroundColor: BUTTON_COLOR }}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl" style={{ color: BUTTON_COLOR }}>
              ¡Código Validado!
            </CardTitle>
            <CardDescription>Tu código de validación ha sido aceptado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div
                className="text-5xl font-mono font-extrabold tracking-widest mb-2"
                style={{ color: "#555555" }}
              >
                {generatedCode}
              </div>
              <Badge
                variant="outline"
                className="text-sm flex items-center justify-center gap-1 mx-auto"
              >
                <Timer className="h-4 w-4" />
                Código válido por 5 minutos
              </Badge>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full"
                style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
                onClick={onBack}
              >
                Volver al Menú Principal
              </Button>
              <Button
                variant="outline"
                className="w-full"
                style={{ borderColor: BUTTON_COLOR, color: BUTTON_COLOR }}
              >
                Compartir Código
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header fijo arriba */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BUTTON_COLOR }}>
            Código de Validación
          </h1>
          <p className="text-muted-foreground">
            Ingresa el código que se ha generado automáticamente
          </p>
        </div>
      </div>

      {/* Formulario centrado con Card tipo token */}
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center shadow-lg rounded-lg">
          <div
            className="text-5xl font-mono font-extrabold tracking-widest mb-4"
            style={{ color: "#555555" }}
          >
            {generatedCode}
          </div>
          <Badge
            variant="outline"
            className="text-sm flex items-center justify-center gap-1 mx-auto mb-6"
          >
            <Timer className="h-4 w-4" />
            Tiempo restante: {formatTime(timeLeft)}
          </Badge>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="text-left">
              <Label htmlFor="code" className="mb-2 block">
                Ingresa el código
              </Label>
              <Input
                id="code"
                type="text"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
              >
                Validar Código
              </Button>
              <Button
                variant="outline"
                className="w-full"
                style={{ borderColor: BUTTON_COLOR, color: BUTTON_COLOR }}
                onClick={handleRequestNewCode}
              >
                Generar Nuevo Código
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
