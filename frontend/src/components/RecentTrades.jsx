import React, { useMemo } from 'react';
import { Receipt, ArrowUpRight, ArrowDownRight, Layers, DollarSign, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecentTrades({ trades = [] }) {
  const metrics = useMemo(() => {
    if (trades.length === 0) return { totalVol: 0, totalVal: 0, avgPrice: 0 };
    const totalVol = trades.reduce((acc, t) => acc + t.quantity, 0);
    const totalVal = trades.reduce((acc, t) => acc + (t.value || t.price * t.quantity), 0);
    const avgPrice = totalVol > 0 ? totalVal / totalVol : 0;
    return { totalVol, totalVal, avgPrice };
  }, [trades]);

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-3 flex flex-col h-full shadow-lg">
      {/* Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-[#1e2638] gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#0ecb81]" />
          <h2 className="text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
            Recent Executed Trades (Time & Sales)
          </h2>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#7e8b9f]">
          <div>
            <span>VOL: </span>
            <span className="text-[#d6e3fa] font-bold">{metrics.totalVol.toLocaleString()}</span>
          </div>
          <div>
            <span>VALUE: </span>
            <span className="text-[#45e89b] font-bold">${metrics.totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span>AVG: </span>
            <span className="text-[#fec521] font-bold">${metrics.avgPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-5 text-[10px] font-mono uppercase text-[#7e8b9f] px-2 py-1 bg-[#061424] rounded mb-1">
        <div className="text-left">Timestamp</div>
        <div className="text-right">Price ($)</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total ($)</div>
        <div className="text-right">Match (B ⚔ S)</div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-0.5">
        {trades.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-xs font-mono text-[#4e5d78] italic gap-1">
            <span>No trades executed yet</span>
            <span className="text-[10px]">Submit crossing orders to trigger matching</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {trades.map((trade, idx) => {
              const tradeVal = trade.value || trade.price * trade.quantity;
              const isFirst = idx === 0;

              return (
                <motion.div
                  key={trade.id || `${trade.buy_order_id}-${trade.sell_order_id}-${idx}`}
                  initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(14, 203, 129, 0.25)' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0, 0, 0, 0)' }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-5 text-xs font-mono py-1 px-2 border-b border-[#1e2638]/40 hover:bg-[#132030] transition-colors rounded-sm"
                >
                  <div className="text-left text-[#7e8b9f] tabular-nums text-[11px]">
                    {trade.timestamp || 'Just now'}
                  </div>
                  <div className="text-right font-bold text-[#0ecb81] tabular-nums">
                    ${Number(trade.price).toFixed(2)}
                  </div>
                  <div className="text-right text-[#d6e3fa] tabular-nums font-semibold">
                    {trade.quantity.toLocaleString()}
                  </div>
                  <div className="text-right text-[#7e8b9f] tabular-nums text-[11px]">
                    ${tradeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-right text-[11px] font-mono tabular-nums text-[#d6e3fa]">
                    <span className="text-[#0ecb81]">#{trade.buy_order_id}</span>
                    <span className="text-[#4e5d78] mx-0.5">/</span>
                    <span className="text-[#f6465d]">#{trade.sell_order_id}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
