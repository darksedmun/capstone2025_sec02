"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

interface Movement {
  type: "earned" | "spent"
  points: number
  description: string
  createdAt: string
}

export default function PointsHistory({ onBack }: { onBack: () => void }) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/points-history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMovements(data.movements ?? [])
      setLoading(false)
    }

    fetchHistory()
  }, [])

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600">Cargando historial...</p>
    )

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          Historial de Puntos
        </h1>
      </div>

      {/* Movements */}
      {movements.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">
          Aún no tienes movimientos registrados.
        </p>
      ) : (
        <div className="space-y-3">
          {movements.map((m, i) => (
            <Card
              key={i}
              className="border rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-base font-medium">
                    {m.description}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString("es-CL")}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {m.type === "earned" ? (
                    <TrendingUp
                      className="h-5 w-5"
                      style={{ color: BUTTON_COLOR }}
                    />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className="font-semibold"
                    style={{
                      color: m.type === "earned" ? BUTTON_COLOR : "#dc2626", // rojo tailwind-600
                    }}
                  >
                    {m.type === "earned" ? "+" : "-"}
                    {m.points} pts
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
