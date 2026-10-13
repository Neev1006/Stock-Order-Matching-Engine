import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Wifi, WifiOff, RefreshCw, Trash2, Clock, Cpu, ShieldCheck } from 'lucide-react';
import { ConnectionStatus } from '../hooks/useWebSocket';

export default function Header({ status, onClearBook, onReconnect, totalTrades, depthCount }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 23) + ' UTC');
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f1c2c] border border-[#3c4a40] text-[#60feae]">
            <span className="w-2 h-2 rounded-full bg-[#0ecb81] ring-2 ring-[#0ecb81]/30 animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">WS ONLINE</span>
          </div>
        );
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f1c2c] border border-[#5a4300] text-[#fec521]">
            <span className="w-2 h-2 rounded-full bg-[#fec521] ring-2 ring-[#fec521]/30 animate-ping" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">CONNECTING</span>
          </div>
        );
      default:
        return (
          <button
            onClick={onReconnect}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e2b3b] hover:bg-[#293647] border border-[#93000a] text-[#ffb4ab] transition-colors"
            title="Click to reconnect"
          >
            <WifiOff className="w-3.5 h-3.5 text-[#f6465d]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">RECONNECT</span>
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#020f1e]/90 backdrop-blur-md border-b border-[#1e2638] px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#0f1c2c] border border-[#2a364f] flex items-center justify-center text-[#45e89b]">
            <Terminal className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-sm tracking-tight text-[#d6e3fa] uppercase">
                Stock Order Matching Engine
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0ecb81]/15 text-[#60feae] border border-[#0ecb81]/30 font-semibold">
                CLOB v1.0
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#7e8b9f]">
              <span>Price-Time Priority (FIFO)</span>
              <span>•</span>
              <span className="text-[#3be194]">FastAPI + React</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry metadata */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded bg-[#0b0e14] border border-[#1e2638] font-mono text-[11px] text-[#7e8b9f]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#4e5d78]">SERVER:</span>
          <span className="text-[#d6e3fa]">127.0.0.1:8000</span>
        </div>
        <div className="h-3 w-px bg-[#1e2638]" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#4e5d78]">LATENCY:</span>
          <span className="text-[#45e89b] font-semibold">&lt;0.2ms</span>
        </div>
        <div className="h-3 w-px bg-[#1e2638]" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#4e5d78]">DEPTH:</span>
          <span className="text-[#d6e3fa]">{depthCount} Levels</span>
        </div>
        <div className="h-3 w-px bg-[#1e2638]" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#4e5d78]">TOTAL FILLS:</span>
          <span className="text-[#fec521] font-semibold">{totalTrades}</span>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {getStatusBadge()}

        {/* Clear Book Button */}
        <button
          onClick={onClearBook}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#111622] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#ffb4ab] border border-[#1e2638] hover:border-[#ac012f] text-xs font-mono transition-all"
          title="Clear all resting bids and asks"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Purge Book</span>
        </button>

        {/* Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b0e14] border border-[#1e2638] font-mono text-xs text-[#7e8b9f]">
          <Clock className="w-3.5 h-3.5 text-[#4e5d78]" />
          <span className="tabular-nums text-[#d6e3fa]">{time || '00:00:00.000'}</span>
        </div>
      </div>
    </header>
  );
}
