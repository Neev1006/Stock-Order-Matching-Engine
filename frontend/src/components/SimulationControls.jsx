import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Zap, Sparkles, SlidersHorizontal, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SimulationControls({ onSendOrder, isConnected, bestBid, bestAsk }) {
  const [isAutoSimActive, setIsAutoSimActive] = useState(false);
  const nextSimIdRef = useRef(1000);
  const simIntervalRef = useRef(null);

  // Seed realistic resting order book ladder
  const handleSeedBook = () => {
    if (!isConnected) return;
    const basePrice = 100.0;

    // Seed Bids: 99.80, 99.50, 99.20, 98.90, 98.50
    const bidOffsets = [0.20, 0.50, 0.80, 1.20, 1.60];
    bidOffsets.forEach((offset, idx) => {
      const p = Number((basePrice - offset).toFixed(2));
      const q = Math.floor(Math.random() * 20) + 10;
      onSendOrder({
        order_id: nextSimIdRef.current++,
        side: 'Buy',
        price: p,
        quantity: q,
      });
    });

    // Seed Asks: 100.20, 100.50, 100.80, 101.20, 101.60
    const askOffsets = [0.20, 0.50, 0.80, 1.20, 1.60];
    askOffsets.forEach((offset, idx) => {
      const p = Number((basePrice + offset).toFixed(2));
      const q = Math.floor(Math.random() * 20) + 10;
      onSendOrder({
        order_id: nextSimIdRef.current++,
        side: 'Sell',
        price: p,
        quantity: q,
      });
    });
  };

  // Trigger an aggressive match trade (Buy crosses Ask)
  const handleTriggerBuyMatch = () => {
    if (!isConnected) return;
    const targetPrice = bestAsk !== null ? bestAsk : 100.20;
    const qty = Math.floor(Math.random() * 10) + 5;
    onSendOrder({
      order_id: nextSimIdRef.current++,
      side: 'Buy',
      price: targetPrice,
      quantity: qty,
    });
  };

  // Trigger an aggressive match trade (Sell crosses Bid)
  const handleTriggerSellMatch = () => {
    if (!isConnected) return;
    const targetPrice = bestBid !== null ? bestBid : 99.80;
    const qty = Math.floor(Math.random() * 10) + 5;
    onSendOrder({
      order_id: nextSimIdRef.current++,
      side: 'Sell',
      price: targetPrice,
      quantity: qty,
    });
  };

  // Automated Market Maker simulation loop
  useEffect(() => {
    if (isAutoSimActive && isConnected) {
      simIntervalRef.current = setInterval(() => {
        const isBuy = Math.random() > 0.45;
        const currentMid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 100.0;
        const spreadOffset = (Math.random() * 0.8 - 0.4);
        const targetPrice = Number((currentMid + spreadOffset).toFixed(2));
        const qty = Math.floor(Math.random() * 15) + 5;

        onSendOrder({
          order_id: nextSimIdRef.current++,
          side: isBuy ? 'Buy' : 'Sell',
          price: Math.max(1.0, targetPrice),
          quantity: qty,
        });
      }, 1200);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isAutoSimActive, isConnected, bestBid, bestAsk, onSendOrder]);

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-3 flex flex-col gap-2.5 shadow-lg">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1e2638]">
        <div className="flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
          <SlidersHorizontal className="w-4 h-4 text-[#fec521]" />
          <span>Interactive Simulation Toolkit</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132030] text-[#7e8b9f]">
          DEMO SUITE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Seed Book */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleSeedBook}
          disabled={!isConnected}
          className="h-8 px-2 rounded bg-[#061424] hover:bg-[#132030] border border-[#1e2638] hover:border-[#2a364f] text-[#d6e3fa] font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          title="Populate 10 resting orders in order book"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3be194]" />
          <span>Seed Book</span>
        </motion.button>

        {/* Trigger Buy Match */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleTriggerBuyMatch}
          disabled={!isConnected}
          className="h-8 px-2 rounded bg-[#061424] hover:bg-[#005231]/30 border border-[#1e2638] hover:border-[#0ecb81] text-[#60feae] font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          title="Inject crossing buy order to execute a trade"
        >
          <Zap className="w-3.5 h-3.5 text-[#0ecb81]" />
          <span>Match Buy</span>
        </motion.button>

        {/* Trigger Sell Match */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleTriggerSellMatch}
          disabled={!isConnected}
          className="h-8 px-2 rounded bg-[#061424] hover:bg-[#920026]/30 border border-[#1e2638] hover:border-[#f6465d] text-[#ffb4ab] font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          title="Inject crossing sell order to execute a trade"
        >
          <Zap className="w-3.5 h-3.5 text-[#f6465d]" />
          <span>Match Sell</span>
        </motion.button>

        {/* Auto Market Maker Bot Toggle */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setIsAutoSimActive((prev) => !prev)}
          disabled={!isConnected}
          className={`h-8 px-2 rounded font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all border ${
            isAutoSimActive
              ? 'bg-[#deaa00]/20 border-[#fec521] text-[#fec521] animate-pulse'
              : 'bg-[#061424] hover:bg-[#132030] border-[#1e2638] text-[#7e8b9f] hover:text-[#d6e3fa]'
          } disabled:opacity-40`}
          title="Start / stop automatic live simulation bot"
        >
          {isAutoSimActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isAutoSimActive ? 'Stop Bot' : 'Auto Bot'}</span>
        </motion.button>
      </div>
    </div>
  );
}
