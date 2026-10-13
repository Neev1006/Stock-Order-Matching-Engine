import React, { useState } from 'react';
import Header from './components/Header';
import TickerRibbon from './components/TickerRibbon';
import OrderEntry from './components/OrderEntry';
import CancelOrder from './components/CancelOrder';
import OrderBook from './components/OrderBook';
import DepthChart from './components/DepthChart';
import EngineVisualizer3D from './components/EngineVisualizer3D';
import RecentTrades from './components/RecentTrades';
import EventLog from './components/EventLog';
import SimulationControls from './components/SimulationControls';
import { useWebSocket, ConnectionStatus } from './hooks/useWebSocket';

export default function App() {
  const {
    status,
    bids,
    asks,
    trades,
    logs,
    latestTrade,
    sendOrder,
    cancelOrder,
    clearBook,
    clearLogs,
    reconnect,
  } = useWebSocket();

  const [rightPanelTab, setRightPanelTab] = useState('both'); // 'both' | 'depth' | '3d'

  // Calculate best bid and ask
  const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : null;
  const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : null;

  const isConnected = status === ConnectionStatus.CONNECTED;

  return (
    <div className="min-h-screen bg-[#061424] text-[#d6e3fa] flex flex-col selection:bg-[#0ecb81]/30 selection:text-[#60feae] terminal-grid-bg">
      {/* Top Navigation Bar */}
      <Header
        status={status}
        onClearBook={clearBook}
        onReconnect={reconnect}
        totalTrades={trades.length}
        depthCount={bids.length + asks.length}
      />

      {/* Main Terminal Workspace */}
      <main className="flex-1 p-3 md:p-4 max-w-[1920px] w-full mx-auto flex flex-col gap-3">
        {/* Ticker & Telemetry Ribbon */}
        <TickerRibbon
          latestTrade={latestTrade}
          trades={trades}
          bids={bids}
          asks={asks}
        />

        {/* Primary Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          {/* LEFT DOCK: Order Entry, Cancel, Simulation (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <OrderEntry
              onSendOrder={sendOrder}
              bestBid={bestBid}
              bestAsk={bestAsk}
              isConnected={isConnected}
            />

            <CancelOrder
              onCancelOrder={cancelOrder}
              isConnected={isConnected}
            />

            <SimulationControls
              onSendOrder={sendOrder}
              isConnected={isConnected}
              bestBid={bestBid}
              bestAsk={bestAsk}
            />
          </div>

          {/* RIGHT DOCK: Order Book, Visualizers, Trades & Logs (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Top Row: Order Book Ladder (col 1) & Charts/3D (col 2) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Order Book Ladder */}
              <div className="md:col-span-6 flex flex-col">
                <OrderBook
                  bids={bids}
                  asks={asks}
                  onSelectPrice={(p) => {
                    // Optional callback to quickly fill price into order form if desired
                  }}
                />
              </div>

              {/* Depth Chart & 3D Matching Engine Core */}
              <div className="md:col-span-6 flex flex-col gap-3">
                <DepthChart bids={bids} asks={asks} trades={trades} />
                <EngineVisualizer3D bids={bids} asks={asks} latestTrade={latestTrade} />
              </div>
            </div>

            {/* Bottom Row: Recent Executed Trades & Audit Event Log */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Recent Trades Blotter */}
              <div className="md:col-span-6 flex flex-col">
                <RecentTrades trades={trades} />
              </div>

              {/* Event Audit Log Console */}
              <div className="md:col-span-6 flex flex-col">
                <EventLog logs={logs} onClearLogs={clearLogs} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-[#020f1e] border-t border-[#1e2638] px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#7e8b9f]">
        <div className="flex items-center gap-3">
          <span>Engine Architecture: In-Memory Limit Order Book</span>
          <span>•</span>
          <span className="text-[#3be194]">SortedContainers + FastAPI ASGI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#4e5d78]">Built with React, Vite, Framer Motion & Three.js</span>
        </div>
      </footer>
    </div>
  );
}
