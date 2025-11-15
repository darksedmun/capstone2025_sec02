"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import QrScanner from "qr-scanner"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

export default function QrScannerScreen({
  onBack,
  addPoints,
}: {
  onBack: () => void
  addPoints?: (points: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          scannerRef.current?.stop()

          const token = localStorage.getItem("token")
          if (!token) {
            setMessage({ text: "Debes iniciar sesión para escanear.", type: "error" })
            setTimeout(() => setMessage(null), 2500)
            return
          }

          try {
            const res = await fetch("/api/scanner", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ qrCode: result.data }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
              setMessage({
                text: "¡Reciclaje registrado correctamente!",
                type: "success",
              })
              if (addPoints) addPoints(data.pointsAdded || 50)
            } else {
              setMessage({
                text: data.error || "Error al registrar reciclaje.",
                type: "error",
              })
            }
          } catch (err) {
            console.error(err)
            setMessage({
              text: "Error de conexión con el servidor.",
              type: "error",
            })
          }

          setTimeout(() => setMessage(null), 2500)
        },
        { highlightScanRegion: true, highlightCodeOutline: true }
      )

      scannerRef.current.start()
    }

    return () => {
      scannerRef.current?.stop()
    }
  }, [addPoints])

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black/80">
      <div className="absolute top-6 left-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <video
        ref={videoRef}
        style={{ width: "90%", maxWidth: "400px", borderRadius: "8px" }}
      />

      <Button
        onClick={onBack}
        className="mt-6 w-[200px]"
        style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
      >
        Cancelar
      </Button>

      {message && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md z-[2000]">
          <p
            className="text-center font-medium"
            style={{
              color: message.type === "success" ? "#0cb7f2" : "#ef4444",
            }}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  )
}
