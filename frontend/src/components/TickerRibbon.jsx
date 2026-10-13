import React from 'react';
import { Activity, TrendingUp, TrendingDown, Gauge } from 'lucide-react';

export default function TickerRibbon({ latestTrade, trades = [], bids = [], asks = [] }) {
  const lastPrice = latestTrade ? latestTrade.price : 100.0;
  const firstPrice = trades.length > 0 ? trades[trades.length - 1].price : 100.0;
  const priceChange = lastPrice - firstPrice;
  const pctChange = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(2) : '0.00';
  const isPositive = priceChange >= 0;

  const totalVolume = trades.reduce((acc, t) => acc + t.quantity, 0);

  return (
    <div className="w-full bg-[#0f1c2c] border border-[#1e2638] px-4 py-2 flex flex-wrap items-center justify-between gap-4 rounded-md shadow-md">
      {/* Instrument Badge & Price */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ecb81] ring-2 ring-[#0ecb81]/30" />
          <span className="font-headline font-bold text-base text-[#d6e3fa] tracking-tight">
            AAPL
          </span>
          <span className="font-mono text-[10px] text-[#7e8b9f] bg-[#061424] px-1.5 py-0.5 rounded border border-[#1e2638]">
            SIMULATED EQUITY
          </span>
        </div>

        {/* Last Price */}
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-xs text-[#7e8b9f]">LAST:</span>
          <span className="text-base font-bold text-[#d6e3fa] tabular-nums">
            ${Number(lastPrice).toFixed(2)}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-bold tabular-nums ${
              isPositive
                ? 'text-[#0ecb81] bg-[#0ecb81]/15'
                : 'text-[#f6465d] bg-[#f6465d]/15'
            }`}
          >
            {isPositive ? `+${pctChange}%` : `${pctChange}%`}
          </span>
        </div>

        {/* Micro Telemetry Metrics */}
        <div className="hidden sm:flex items-center gap-4 font-mono text-xs text-[#7e8b9f]">
          <div>
            <span className="text-[#4e5d78]">SESSION VOL: </span>
            <span className="text-[#d6e3fa] font-semibold">{totalVolume.toLocaleString()} shares</span>
          </div>
          <div className="h-3 w-px bg-[#1e2638]" />
          <div>
            <span className="text-[#4e5d78]">TICK SIZE: </span>
            <span className="text-[#d6e3fa] font-semibold">$0.01</span>
          </div>
          <div className="h-3 w-px bg-[#1e2638]" />
          <div>
            <span className="text-[#4e5d78]">MATCH PRIORITY: </span>
            <span className="text-[#45e89b] font-semibold">FIFO / Price-Time</span>
          </div>
        </div>
      </div>

      {/* Engine Status Tag */}
      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#061424] border border-[#1e2638] text-[#3be194]">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-semibold text-[11px] uppercase">MATCHING ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
