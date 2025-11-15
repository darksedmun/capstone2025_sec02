"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Gift, CheckCircle } from "lucide-react"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

interface RedeemedReward {
  id: number
  name: string
  store: string
  points: number
  image?: string
  redeemedAt: string
}

export default function RedeemedCoupons({ onBack }: { onBack: () => void }) {
  const [redeemed, setRedeemed] = useState<RedeemedReward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const fetchRedeemed = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("/api/redeem", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) throw new Error("Error al obtener los cupones canjeados")

        const data = await res.json()
        setRedeemed(data.redeemed ?? [])

        if (data.redeemed?.length === 0) {
          setMessage({ text: "Aún no has canjeado ningún cupón.", type: "error" })
          setTimeout(() => setMessage(null), 3000)
        }
      } catch {
        setError("No se pudieron cargar los cupones canjeados.")
      } finally {
        setLoading(false)
      }
    }

    fetchRedeemed()
  }, [])

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Cargando cupones...</p>

  if (error)
    return (
      <div className="text-center mt-10 text-red-600">
        {error}
        <div className="mt-4">
          <Button
            onClick={() => location.reload()}
            style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    )

  return (
    <div className="relative min-h-screen bg-background p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          Cupones Canjeados
        </h1>
      </div>

      {redeemed.length === 0 ? (
        <p className="text-gray-600 text-center mt-10">
          No tienes cupones canjeados todavía.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {redeemed.map((reward) => (
            <Card
              key={reward.id}
              className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all"
              style={{ borderColor: BUTTON_COLOR }}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                {reward.image ? (
                  <img src={reward.image} alt={reward.name} className="h-12 w-12 object-contain" />
                ) : (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: BUTTON_COLOR, color: "white" }}
                  >
                    <Gift className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle>{reward.name}</CardTitle>
                  <CardDescription>{reward.store}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col justify-between h-full">
                <p className="text-gray-700 mb-2">
                  Canjeado el{" "}
                  <span className="font-semibold">
                    {new Date(reward.redeemedAt).toLocaleDateString("es-CL")}
                  </span>
                </p>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">
                    {reward.points} pts
                  </span>

                  <CheckCircle className="text-green-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
