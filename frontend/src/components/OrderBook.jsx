import React, { useMemo } from 'react';
import { BookOpen, Layers, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderBook({ bids = [], asks = [], onSelectPrice }) {
  // Process Asks: sorted ascending by price (lowest ask closest to spread)
  // To show lowest ask near the center spread, we reverse the list when displaying top-down
  const processedAsks = useMemo(() => {
    const sorted = [...asks].sort((a, b) => a.price - b.price);
    let cumulative = 0;
    const withCum = sorted.map((item) => {
      cumulative += item.quantity;
      return { ...item, cumulative };
    });
    // For rendering top-to-bottom so lowest ask is at the bottom of the ask block:
    return withCum.reverse();
  }, [asks]);

  // Process Bids: sorted descending by price (highest bid closest to spread)
  const processedBids = useMemo(() => {
    const sorted = [...bids].sort((a, b) => b.price - a.price);
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.quantity;
      return { ...item, cumulative };
    });
  }, [bids]);

  // Find max cumulative quantity for relative depth bars
  const maxVolume = useMemo(() => {
    const maxAsk = processedAsks.length > 0 ? Math.max(...processedAsks.map((a) => a.cumulative)) : 0;
    const maxBid = processedBids.length > 0 ? Math.max(...processedBids.map((b) => b.cumulative)) : 0;
    return Math.max(maxAsk, maxBid, 1);
  }, [processedAsks, processedBids]);

  // Calculate Spread
  const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : null;
  const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : null;
  
  const spread = bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null;
  const midPrice = bestAsk !== null && bestBid !== null ? (bestAsk + bestBid) / 2 : null;
  const spreadBps = spread !== null && midPrice ? ((spread / midPrice) * 10000).toFixed(1) : null;

  // Total liquidity calculations
  const totalAskQty = asks.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalBidQty = bids.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalLiquidity = totalAskQty + totalBidQty;
  const bidRatio = totalLiquidity > 0 ? (totalBidQty / totalLiquidity) * 100 : 50;

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-3 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2638]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#45e89b]" />
          <h2 className="text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
            Live Order Book (L2 Ladder)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-[#7e8b9f]">
            Bids: <span className="text-[#0ecb81] font-semibold">{bids.length}</span>
          </span>
          <span className="text-[#7e8b9f]">
            Asks: <span className="text-[#f6465d] font-semibold">{asks.length}</span>
          </span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 text-[10px] font-mono uppercase text-[#7e8b9f] px-2 py-1 bg-[#061424] rounded mb-1">
        <div className="text-left">Price ($)</div>
        <div className="text-right">Size (Qty)</div>
        <div className="text-right">Total (Cum)</div>
      </div>

      {/* Asks List (Red) */}
      <div className="flex-1 flex flex-col justify-end overflow-hidden min-h-[140px]">
        {processedAsks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#4e5d78] italic">
            No resting ask orders
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {processedAsks.map((ask) => {
              const depthPct = Math.min(100, (ask.cumulative / maxVolume) * 100);
              return (
                <div
                  key={`ask-${ask.price}-${ask.quantity}`}
                  onClick={() => onSelectPrice && onSelectPrice(ask.price)}
                  className="group relative grid grid-cols-3 text-xs font-mono py-0.5 px-2 cursor-pointer hover:bg-[#1e2638]/50 transition-colors rounded-sm"
                >
                  {/* Depth Background Bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/15 pointer-events-none transition-all duration-300 rounded-sm"
                    style={{ width: `${depthPct}%` }}
                  />
                  <div className="relative text-left font-bold text-[#f6465d] tabular-nums">
                    ${Number(ask.price).toFixed(2)}
                  </div>
                  <div className="relative text-right text-[#d6e3fa] tabular-nums">
                    {ask.quantity.toLocaleString()}
                  </div>
                  <div className="relative text-right text-[#7e8b9f] tabular-nums text-[11px]">
                    {ask.cumulative.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spread Indicator Ribbon */}
      <div className="my-2 py-1.5 px-3 bg-[#061424] border-y border-[#1e2638] flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#7e8b9f] text-[11px]">SPREAD:</span>
          <span className={`font-bold tabular-nums ${spread !== null && spread <= 0 ? 'text-[#fec521]' : 'text-[#d6e3fa]'}`}>
            {spread !== null ? `$${spread.toFixed(2)}` : '—'}
          </span>
          {spreadBps !== null && (
            <span className="text-[10px] px-1 py-0.2 rounded bg-[#132030] text-[#7e8b9f]">
              {spreadBps} bps
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#7e8b9f] text-[11px]">MID:</span>
          <span className="font-bold text-[#60feae] tabular-nums">
            {midPrice !== null ? `$${midPrice.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>

      {/* Bids List (Green) */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[140px]">
        {processedBids.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#4e5d78] italic">
            No resting bid orders
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {processedBids.map((bid) => {
              const depthPct = Math.min(100, (bid.cumulative / maxVolume) * 100);
              return (
                <div
                  key={`bid-${bid.price}-${bid.quantity}`}
                  onClick={() => onSelectPrice && onSelectPrice(bid.price)}
                  className="group relative grid grid-cols-3 text-xs font-mono py-0.5 px-2 cursor-pointer hover:bg-[#1e2638]/50 transition-colors rounded-sm"
                >
                  {/* Depth Background Bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/15 pointer-events-none transition-all duration-300 rounded-sm"
                    style={{ width: `${depthPct}%` }}
                  />
                  <div className="relative text-left font-bold text-[#0ecb81] tabular-nums">
                    ${Number(bid.price).toFixed(2)}
                  </div>
                  <div className="relative text-right text-[#d6e3fa] tabular-nums">
                    {bid.quantity.toLocaleString()}
                  </div>
                  <div className="relative text-right text-[#7e8b9f] tabular-nums text-[11px]">
                    {bid.cumulative.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Depth Pressure Gauge */}
      <div className="pt-2 mt-2 border-t border-[#1e2638] flex flex-col gap-1 text-[10px] font-mono">
        <div className="flex justify-between items-center text-[#7e8b9f]">
          <span className="text-[#0ecb81]">Bids {bidRatio.toFixed(0)}%</span>
          <span className="text-[#4e5d78]">ORDER DEPTH PRESSURE</span>
          <span className="text-[#f6465d]">Asks {(100 - bidRatio).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full bg-[#1e2638] rounded-full overflow-hidden flex">
          <div
            className="bg-[#0ecb81] transition-all duration-300"
            style={{ width: `${bidRatio}%` }}
          />
          <div
            className="bg-[#f6465d] transition-all duration-300"
            style={{ width: `${100 - bidRatio}%` }}
          />
        </div>
      </div>
    </div>
  );
}
