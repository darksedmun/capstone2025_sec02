"use client"

import dynamic from "next/dynamic"
import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Importa el mapa de forma dinámica SIN SSR
const RecyclingMap = dynamic(() => import("@/components/recycling-map"), { ssr: false })

interface RecyclingMapPageProps {
  onBack?: () => void
}

const BUTTON_COLOR = "#0cb7f2"

const RecyclingMapPage: React.FC<RecyclingMapPageProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background p-4">
      {onBack && (
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            style={{ backgroundColor: BUTTON_COLOR, color: "white" }}
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      )}
      <div className="flex-1 w-full">
        <RecyclingMap onBack={onBack} />
      </div>
    </div>
  )
}

export default RecyclingMapPage
