import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { getMultipleStockQuotes as getPolygonStockQuotes } from '../services/external-apis/polygon.service.js';
import {
  initFinnhubService, 
  getMultipleStockQuotes as getFinnhubStockQuotes,
} from '../services/external-apis/finnhub.service.js';
import { getMultipleCryptoPrices } from '../services/external-apis/cryptocompare.service.js';
import { getExchangeRates } from '../services/external-apis/openexchange.service.js';
import { WS_CONFIG, DEFAULT_STOCKS, DEFAULT_CRYPTOS } from '../config/constants.js';
import { env } from '../config/env.js';
import type { WSMessage, WSSubscription, StockQuote } from '../types/index.js';

interface Client {
  id: string;
  socket: WebSocket;
  subscriptions: {
    stocks: Set<string>;
    crypto: Set<string>;
    currencies: Set<string>;
  };
  lastHeartbeat: number;
}

const clients = new Map<string, Client>();

let stockInterval: ReturnType<typeof setInterval>;
let cryptoInterval: ReturnType<typeof setInterval>;
let currencyInterval: ReturnType<typeof setInterval>;
let heartbeatInterval: ReturnType<typeof setInterval>;

function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function sendMessage(socket: WebSocket, message: WSMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(type: WSMessage['type'], payload: unknown, filter?: (client: Client) => boolean) {
  const message: WSMessage = { type, payload, timestamp: Date.now() };
  clients.forEach((client) => {
    if (!filter || filter(client)) {
      sendMessage(client.socket, message);
    }
  });
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('🔌 WebSocket server initialized');

  wss.on('connection', (socket: WebSocket) => {
    const clientId = generateClientId();
    const client: Client = {
      id: clientId,
      socket,
      subscriptions: {
        stocks: new Set(),
        crypto: new Set(),
        currencies: new Set(),
      },
      lastHeartbeat: Date.now(),
    };

    clients.set(clientId, client);
    console.log(`📱 Client connected: ${clientId} (Total: ${clients.size})`);

    // Send connected message
    sendMessage(socket, {
      type: 'connected',
      payload: { clientId },
      timestamp: Date.now(),
    });

    // Handle messages
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        handleMessage(client, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
        sendMessage(socket, {
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now(),
        });
      }
    });

    // Handle close
    socket.on('close', () => {
      clients.delete(clientId);
      console.log(`📴 Client disconnected: ${clientId} (Total: ${clients.size})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    });
  });

  // Start data polling (includes Finnhub initialization)
  startDataPolling();

  // Start heartbeat
  startHeartbeat();

  return wss;
}

function handleMessage(client: Client, message: WSMessage) {
  switch (message.type) {
    case 'subscribe':
      handleSubscribe(client, message.payload as WSSubscription);
      break;
    case 'unsubscribe':
      handleUnsubscribe(client, message.payload as WSSubscription);
      break;
    case 'heartbeat':
      client.lastHeartbeat = Date.now();
      sendMessage(client.socket, {
        type: 'heartbeat',
        payload: { received: true },
        timestamp: Date.now(),
      });
      break;
    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
}

function handleSubscribe(client: Client, subscription: WSSubscription) {
  const { channel, symbols } = subscription;

  symbols.forEach((symbol) => {
    client.subscriptions[channel].add(symbol.toUpperCase());
  });

  console.log(`📥 Client ${client.id} subscribed to ${channel}: ${symbols.join(', ')}`);
  
  // Finnhub uses REST API polling, no need for WebSocket subscriptions
}

function handleUnsubscribe(client: Client, subscription: WSSubscription) {
  const { channel, symbols } = subscription;

  if (symbols && symbols.length > 0) {
    symbols.forEach((symbol) => {
      client.subscriptions[channel].delete(symbol.toUpperCase());
    });
  } else {
    client.subscriptions[channel].clear();
  }

  console.log(`📤 Client ${client.id} unsubscribed from ${channel}`);
  
  // Finnhub uses REST API polling, no need for WebSocket unsubscriptions
}

// Finnhub uses REST API polling, no WebSocket subscriptions needed

function startDataPolling() {
  // Use Finnhub REST API polling for stocks if available
  if (env.FINNHUB_API_KEY) {
    console.log('📊 Using Finnhub REST API for stock updates (polling every 1 minute)');
    
    // Initialize Finnhub service (REST API mode)
    initFinnhubService();
    
    // Poll stocks via Finnhub REST API
    // Finnhub free tier allows 60 requests/minute, so we can poll every minute
    const pollStocks = async () => {
      if (clients.size === 0) {
        return; // Skip silently if no clients
      }

      try {
        // Get all subscribed stock symbols
        const allSymbols = new Set<string>();
        clients.forEach((client) => {
          client.subscriptions.stocks.forEach((s) => allSymbols.add(s));
        });

        // Add default stocks
        DEFAULT_STOCKS.forEach((s) => allSymbols.add(s));

        if (allSymbols.size === 0) return;

        const quotes = await getFinnhubStockQuotes(Array.from(allSymbols));
        
        quotes.forEach((quote) => {
          broadcast('stock-update', quote);
        });
        
        if (quotes.length > 0) {
          console.log(`✅ Updated ${quotes.length} stocks via Finnhub REST API`);
        }
      } catch (error: any) {
        console.error('❌ Error polling stocks from Finnhub:', error.message || error);
      }
    };

    // Initial poll immediately
    pollStocks();

    // Then poll every 1 minute (Finnhub free tier allows 60 requests/minute)
    stockInterval = setInterval(pollStocks, 60 * 1000);
  } else {
    // Fallback to Polygon polling
    console.log('📊 Using Polygon polling for stock updates (every 2 minutes)');
    stockInterval = setInterval(async () => {
      if (clients.size === 0) {
        console.log('⏸️ No clients connected, skipping stock poll');
        return;
      }

      try {
        // Get all subscribed stock symbols
        const allSymbols = new Set<string>();
        clients.forEach((client) => {
          client.subscriptions.stocks.forEach((s) => allSymbols.add(s));
        });

        // Add default stocks
        DEFAULT_STOCKS.forEach((s) => allSymbols.add(s));

        if (allSymbols.size === 0) return;

        console.log(`📊 Polling ${allSymbols.size} stocks via Polygon...`);
        const quotes = await getPolygonStockQuotes(Array.from(allSymbols));
        
        quotes.forEach((quote) => {
          broadcast('stock-update', quote);
        });
        
        console.log(`✅ Broadcasted ${quotes.length} stock updates`);
      } catch (error) {
        console.error('Error polling stocks:', error);
      }
    }, 120000); // 2 minutes
  }

  // Poll crypto every 30 seconds (CryptoCompare has higher limits)
  cryptoInterval = setInterval(async () => {
    if (clients.size === 0) return;

    try {
      const allSymbols = new Set<string>();
      clients.forEach((client) => {
        client.subscriptions.crypto.forEach((s) => allSymbols.add(s));
      });

      // Add default cryptos
      DEFAULT_CRYPTOS.forEach((s) => allSymbols.add(s));

      if (allSymbols.size === 0) return;

      console.log(`🪙 Polling ${allSymbols.size} cryptos...`);
      const cryptos = await getMultipleCryptoPrices(Array.from(allSymbols));
      
      cryptos.forEach((crypto) => {
        broadcast('crypto-update', crypto);
      });
      
      console.log(`✅ Broadcasted ${cryptos.length} crypto updates`);
    } catch (error) {
      console.error('Error polling crypto:', error);
    }
  }, 30000); // 30 seconds

  // Poll currencies every 10 minutes (rates don't change often)
  currencyInterval = setInterval(async () => {
    if (clients.size === 0) return;

    try {
      console.log('💱 Polling currency rates...');
      const rates = await getExchangeRates();
      broadcast('currency-update', { rates, timestamp: Date.now() });
      console.log('✅ Broadcasted currency rates');
    } catch (error) {
      console.error('Error polling currencies:', error);
    }
  }, 600000); // 10 minutes

  // Initial fetch after 3 seconds (give time for clients to connect)
  setTimeout(async () => {
    console.log('🚀 Sending initial data to clients...');
    
    try {
      // Send initial stock data - prefer Finnhub, fallback to Polygon
      let stocks;
      if (env.FINNHUB_API_KEY) {
        stocks = await getFinnhubStockQuotes(DEFAULT_STOCKS);
      } else {
        stocks = await getPolygonStockQuotes(DEFAULT_STOCKS);
      }
      
      stocks.forEach((quote: StockQuote) => {
        broadcast('stock-update', quote);
      });
      console.log(`✅ Sent ${stocks.length} initial stock updates`);
    } catch (error) {
      console.error('Error sending initial stock data:', error);
    }

    // Wait a bit before crypto to not overwhelm
    setTimeout(async () => {
      try {
        // Send initial crypto data
        const cryptos = await getMultipleCryptoPrices(DEFAULT_CRYPTOS);
        cryptos.forEach((crypto) => {
          broadcast('crypto-update', crypto);
        });
        console.log(`✅ Sent ${cryptos.length} initial crypto updates`);
      } catch (error) {
        console.error('Error sending initial crypto data:', error);
      }
    }, 2000);
  }, 3000);
}

function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    const timeout = WS_CONFIG.heartbeatInterval * 2;

    clients.forEach((client, id) => {
      if (now - client.lastHeartbeat > timeout) {
        console.log(`⏰ Client ${id} timed out, disconnecting...`);
        client.socket.terminate();
        clients.delete(id);
      } else {
        sendMessage(client.socket, {
          type: 'heartbeat',
          payload: { timestamp: now },
          timestamp: now,
        });
      }
    });
  }, WS_CONFIG.heartbeatInterval);
}

export function cleanup() {
  clearInterval(stockInterval);
  clearInterval(cryptoInterval);
  clearInterval(currencyInterval);
  clearInterval(heartbeatInterval);
  clients.clear();
}
