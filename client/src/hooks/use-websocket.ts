import { useEffect, useCallback } from "react"
import { useWebSocketStore } from "../stores/websocket-store"
import { useDashboardStore } from "../stores/dashboard-store"
import type { WSSubscription } from "../types"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws"

export function useWebSocket() {
  const {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected,
    isConnecting,
    lastMessage,
    error,
  } = useWebSocketStore()

  const {
    updateStock,
    updateCrypto,
    updateCurrency,
    setConnectionStatus,
  } = useDashboardStore()

  // Connect on mount
  useEffect(() => {
    connect(WS_URL)

    return () => {
      // Don't disconnect on unmount to keep connection alive
    }
  }, [connect])

  // Update dashboard connection status
  useEffect(() => {
    setConnectionStatus(isConnected)
  }, [isConnected, setConnectionStatus])

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return

    const { type, payload } = lastMessage

    switch (type) {
      case "stock-update":
        if (payload && typeof payload === "object" && "symbol" in payload) {
          updateStock(
            (payload as { symbol: string }).symbol,
            payload as Record<string, unknown>
          )
        }
        break
      case "crypto-update":
        if (payload && typeof payload === "object" && "symbol" in payload) {
          updateCrypto(
            (payload as { symbol: string }).symbol,
            payload as Record<string, unknown>
          )
        }
        break
      case "currency-update":
        if (payload && typeof payload === "object" && "pair" in payload) {
          updateCurrency(
            (payload as { pair: string }).pair,
            payload as Record<string, unknown>
          )
        }
        break
    }
  }, [lastMessage, updateStock, updateCrypto, updateCurrency])

  const subscribeToStocks = useCallback(
    (symbols: string[]) => {
      subscribe({ channel: "stocks", symbols })
    },
    [subscribe]
  )

  const subscribeToCrypto = useCallback(
    (symbols: string[]) => {
      subscribe({ channel: "crypto", symbols })
    },
    [subscribe]
  )

  const subscribeToCurrencies = useCallback(
    (symbols: string[]) => {
      subscribe({ channel: "currencies", symbols })
    },
    [subscribe]
  )

  const unsubscribeFromStocks = useCallback(
    (symbols?: string[]) => {
      unsubscribe("stocks", symbols)
    },
    [unsubscribe]
  )

  const unsubscribeFromCrypto = useCallback(
    (symbols?: string[]) => {
      unsubscribe("crypto", symbols)
    },
    [unsubscribe]
  )

  const unsubscribeFromCurrencies = useCallback(
    (symbols?: string[]) => {
      unsubscribe("currencies", symbols)
    },
    [unsubscribe]
  )

  return {
    isConnected,
    isConnecting,
    error,
    connect: () => connect(WS_URL),
    disconnect,
    subscribeToStocks,
    subscribeToCrypto,
    subscribeToCurrencies,
    unsubscribeFromStocks,
    unsubscribeFromCrypto,
    unsubscribeFromCurrencies,
  }
}

// Hook to subscribe to specific symbols
export function useSubscription(subscription: WSSubscription) {
  const { subscribe, unsubscribe, isConnected } = useWebSocketStore()

  useEffect(() => {
    if (isConnected) {
      subscribe(subscription)
    }

    return () => {
      if (isConnected) {
        unsubscribe(subscription.channel, subscription.symbols)
      }
    }
  }, [isConnected, subscribe, unsubscribe, subscription.channel, JSON.stringify(subscription.symbols)])
}

