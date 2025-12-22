import { useEffect, useRef } from "react"
import { createChart, ColorType } from "lightweight-charts"
import type { IChartApi, Time } from "lightweight-charts"
import { cn } from "../../lib/utils"

interface MiniChartProps {
  data?: { time: number; value: number }[]
  color?: string
  positive?: boolean
  width?: number
  height?: number
  className?: string
}

// Generate mock sparkline data with UTCTimestamp format
function generateSparklineData(points: number, positive: boolean) {
  const data = []
  let value = 100
  const trend = positive ? 0.5 : -0.5
  const baseTime = Math.floor(Date.now() / 1000) - points * 24 * 60 * 60

  for (let i = 0; i <= points; i++) {
    const time = (baseTime + i * 24 * 60 * 60) as Time
    value += (Math.random() - 0.5 + trend) * 2
    data.push({ time, value: Math.max(0, value) })
  }

  return data
}

export function MiniChart({
  data,
  color,
  positive = true,
  width = 100,
  height = 40,
  className,
}: MiniChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const chartColor = color || (positive ? "#26a69a" : "#ef5350")

  useEffect(() => {
    if (!chartContainerRef.current) return

    try {
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "transparent",
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        crosshair: {
          vertLine: { visible: false },
          horzLine: { visible: false },
        },
        handleScale: false,
        handleScroll: false,
      })

      chartRef.current = chart

      const series = chart.addAreaSeries({
        lineColor: chartColor,
        topColor: `${chartColor}40`,
        bottomColor: `${chartColor}00`,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })

      const chartData = data
        ? data.map((d, i) => ({
            time: (Math.floor(Date.now() / 1000) - (data.length - i) * 24 * 60 * 60) as Time,
            value: d.value,
          }))
        : generateSparklineData(30, positive)

      series.setData(chartData)
      chart.timeScale().fitContent()

      return () => {
        chart.remove()
      }
    } catch (error) {
      console.error("Error creating mini chart:", error)
    }
  }, [data, chartColor, positive, width, height])

  return (
    <div
      ref={chartContainerRef}
      className={cn("", className)}
      style={{ width, height }}
    />
  )
}
