"use client"

import { useState, useEffect } from "react"

export function LiveClock() {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return <div className="w-32 h-6 animate-pulse bg-muted rounded"></div>

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 opacity-80">
      <div className="text-right hidden sm:block">
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{date}</p>
      </div>
      <div className="font-mono text-lg font-bold tracking-widest text-muted-foreground tabular-nums">
        {time}
      </div>
    </div>
  )
}
