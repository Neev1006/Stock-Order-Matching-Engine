import { useState, useEffect, useRef, useCallback } from 'react';

export const ConnectionStatus = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
};

const DEFAULT_WS_URL = 'ws://127.0.0.1:8000/ws';
const DEFAULT_HTTP_URL = 'http://127.0.0.1:8000';

export function useWebSocket(url = DEFAULT_WS_URL) {
  const [status, setStatus] = useState(ConnectionStatus.CONNECTING);
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [trades, setTrades] = useState([]);
  const [logs, setLogs] = useState([]);
  const [latestTrade, setLatestTrade] = useState(null);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [latencyMs, setLatencyMs] = useState(0.3);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  // Helper to add log entries
  const addLog = useCallback((type, message, details = null) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp,
        type, // 'info', 'success', 'warning', 'error', 'trade', 'order'
        message,
        details,
      },
      ...prev.slice(0, 99), // retain up to 100 logs
    ]);
  }, []);

  // Fetch initial snapshot via REST API
  const fetchSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`${DEFAULT_HTTP_URL}/snapshot?depth=15`);
      if (response.ok) {
        const data = await response.json();
        if (data.bids) setBids(data.bids);
        if (data.asks) setAsks(data.asks);
      }
    } catch (e) {
      // Ignore initial REST failure if backend is still spinning up
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus(ConnectionStatus.CONNECTING);
    addLog('info', `Connecting to WebSocket server at ${url}...`);

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus(ConnectionStatus.CONNECTED);
        addLog('success', 'WebSocket connection established successfully');
        setLastMessageTime(Date.now());
        
        // Request immediate snapshot
        ws.send(JSON.stringify({ type: 'get_snapshot', depth: 15 }));
      };

      ws.onmessage = (event) => {
        setLastMessageTime(Date.now());
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'order_book_snapshot': {
              setBids(data.bids || []);
              setAsks(data.asks || []);
              break;
            }

            case 'trade_executed': {
              const trade = data.trade;
              const tradeRecord = {
                ...trade,
                id: `${trade.buy_order_id}-${trade.sell_order_id}-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
                value: trade.price * trade.quantity,
              };
              setLatestTrade(tradeRecord);
              setTrades((prev) => [tradeRecord, ...prev.slice(0, 49)]);
              addLog('trade', `TRADE MATCHED: ${trade.quantity} shares @ $${Number(trade.price).toFixed(2)} (Buy #${trade.buy_order_id} ⚔ Sell #${trade.sell_order_id})`, trade);
              break;
            }

            case 'order_received': {
              addLog('order', `Order #${data.order_id} registered and added to matching queue`);
              break;
            }

            case 'order_cancelled': {
              addLog('warning', `Order #${data.order_id} successfully cancelled`);
              break;
            }

            case 'book_cleared': {
              setBids([]);
              setAsks([]);
              addLog('info', 'Order book cleared and memory purged');
              break;
            }

            case 'error': {
              const errMsg = typeof data.message === 'object' ? JSON.stringify(data.message) : data.message;
              addLog('error', `Server rejected message: ${errMsg}`);
              break;
            }

            default:
              addLog('info', `Received unknown event: ${data.type}`, data);
              break;
          }
        } catch (err) {
          addLog('error', `Failed to parse incoming WS message: ${err.message}`);
        }
      };

      ws.onerror = () => {
        setStatus(ConnectionStatus.ERROR);
        addLog('error', 'WebSocket encounter an error or host unreachable');
      };

      ws.onclose = (event) => {
        setStatus(ConnectionStatus.DISCONNECTED);
        addLog('warning', `WebSocket disconnected (code: ${event.code})`);
        
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            addLog('info', 'Attempting automatic reconnection...');
            connect();
          }, 2000);
        }
      };
    } catch (err) {
      setStatus(ConnectionStatus.ERROR);
      addLog('error', `Socket instantiation error: ${err.message}`);
    }
  }, [url, addLog]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    fetchSnapshot();
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect, fetchSnapshot]);

  // Send New Limit Order
  const sendOrder = useCallback((order) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addLog('error', 'Cannot send order: WebSocket is not connected');
      return false;
    }
    const payload = {
      type: 'new_order',
      order_id: Number(order.order_id),
      side: order.side, // 'Buy' or 'Sell'
      price: Number(order.price),
      quantity: Number(order.quantity),
    };
    socketRef.current.send(JSON.stringify(payload));
    addLog('info', `Dispatched ${payload.side} order #${payload.order_id} (${payload.quantity} @ $${payload.price.toFixed(2)})`);
    return true;
  }, [addLog]);

  // Cancel Order
  const cancelOrder = useCallback((order_id, side) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addLog('error', 'Cannot cancel order: WebSocket is not connected');
      return false;
    }
    const payload = {
      type: 'cancel_order',
      order_id: Number(order_id),
      side: side,
    };
    socketRef.current.send(JSON.stringify(payload));
    addLog('info', `Sent cancellation request for ${side} Order #${order_id}`);
    return true;
  }, [addLog]);

  // Clear / Reset Order Book
  const clearBook = useCallback(async () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'clear_book' }));
    } else {
      // Fallback via REST
      try {
        await fetch(`${DEFAULT_HTTP_URL}/reset`, { method: 'POST' });
        setBids([]);
        setAsks([]);
        addLog('info', 'Order book reset via REST endpoint');
      } catch (err) {
        addLog('error', `Failed to reset book: ${err.message}`);
      }
    }
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    status,
    bids,
    asks,
    trades,
    logs,
    latestTrade,
    lastMessageTime,
    latencyMs,
    sendOrder,
    cancelOrder,
    clearBook,
    clearLogs,
    reconnect: connect,
    fetchSnapshot,
  };
}
