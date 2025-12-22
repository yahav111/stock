import { create } from "zustand"
import type { WSSubscription, WSMessageType } from "../types"

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  subscriptions: WSSubscription[]
  lastMessage: { type: WSMessageType; payload: unknown } | null
  error: string | null

  // Actions
  connect: (url: string) => void
  disconnect: () => void
  subscribe: (subscription: WSSubscription) => void
  unsubscribe: (channel: WSSubscription["channel"], symbols?: string[]) => void
  send: (type: WSMessageType, payload: unknown) => void
  setError: (error: string | null) => void
}

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 3000

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  reconnectAttempts: 0,
  subscriptions: [],
  lastMessage: null,
  error: null,

  connect: (url: string) => {
    const { socket, isConnecting } = get()

    if (socket?.readyState === WebSocket.OPEN || isConnecting) {
      return
    }

    set({ isConnecting: true, error: null })

    const ws = new WebSocket(url)

    ws.onopen = () => {
      console.log("WebSocket connected")
      set({
        socket: ws,
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        error: null,
      })

      // Re-subscribe to all previous subscriptions
      const { subscriptions } = get()
      subscriptions.forEach((sub) => {
        ws.send(
          JSON.stringify({
            type: "subscribe",
            payload: sub,
          })
        )
      })
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        // Handle heartbeat - respond immediately to keep connection alive
        if (message.type === "heartbeat") {
          ws.send(JSON.stringify({
            type: "heartbeat",
            payload: { received: true },
            timestamp: Date.now(),
          }))
          return // Don't set this as lastMessage
        }

        set({ lastMessage: message })

        // Handle different message types
        if (message.type === "error") {
          set({ error: message.payload?.message || "WebSocket error" })
        }
      } catch {
        console.error("Failed to parse WebSocket message:", event.data)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
      set({ isConnected: false, isConnecting: false, socket: null })

      // Attempt to reconnect
      const { reconnectAttempts } = get()
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        console.log(`Reconnecting... attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`)
        setTimeout(() => {
          set({ reconnectAttempts: reconnectAttempts + 1 })
          get().connect(url)
        }, RECONNECT_DELAY)
      } else {
        set({ error: "Connection lost. Please refresh the page." })
      }
    }

    ws.onerror = () => {
      set({ error: "WebSocket connection error" })
    }

    set({ socket: ws })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({
        socket: null,
        isConnected: false,
        subscriptions: [],
        reconnectAttempts: MAX_RECONNECT_ATTEMPTS, // Prevent auto-reconnect
      })
    }
  },

  subscribe: (subscription: WSSubscription) => {
    const { socket, subscriptions } = get()

    // Add to subscriptions list
    const existingIndex = subscriptions.findIndex((s) => s.channel === subscription.channel)
    const newSubscriptions =
      existingIndex >= 0
        ? subscriptions.map((s, i) =>
            i === existingIndex
              ? { ...s, symbols: [...new Set([...s.symbols, ...subscription.symbols])] }
              : s
          )
        : [...subscriptions, subscription]

    set({ subscriptions: newSubscriptions })

    // Send subscription message if connected
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          payload: subscription,
        })
      )
    }
  },

  unsubscribe: (channel, symbols) => {
    const { socket, subscriptions } = get()

    let newSubscriptions: WSSubscription[]
    if (symbols) {
      newSubscriptions = subscriptions.map((s) =>
        s.channel === channel ? { ...s, symbols: s.symbols.filter((sym) => !symbols.includes(sym)) } : s
      )
    } else {
      newSubscriptions = subscriptions.filter((s) => s.channel !== channel)
    }

    set({ subscriptions: newSubscriptions })

    // Send unsubscribe message if connected
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "unsubscribe",
          payload: { channel, symbols },
        })
      )
    }
  },

  send: (type, payload) => {
    const { socket } = get()
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload, timestamp: Date.now() }))
    }
  },

  setError: (error) => set({ error }),
}))
