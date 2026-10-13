import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Hash, DollarSign, Layers, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderEntry({ onSendOrder, bestBid, bestAsk, isConnected }) {
  const [side, setSide] = useState('Buy'); // 'Buy' | 'Sell'
  const [orderId, setOrderId] = useState(101);
  const [price, setPrice] = useState(100.0);
  const [quantity, setQuantity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next unique order ID
  const generateNextId = () => {
    setOrderId((prev) => prev + 1);
  };

  const handlePriceStep = (delta) => {
    setPrice((prev) => {
      const updated = Math.max(0.01, Number((prev + delta).toFixed(2)));
      return updated;
    });
  };

  const handleQtyStep = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId || price <= 0 || quantity <= 0) return;

    setIsSubmitting(true);
    const success = onSendOrder({
      order_id: Number(orderId),
      side,
      price: Number(price),
      quantity: Number(quantity),
    });

    if (success) {
      // Automatically increment order ID for convenience
      setOrderId((id) => id + 1);
    }

    setTimeout(() => setIsSubmitting(false), 200);
  };

  const totalValue = (price * quantity).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-4 flex flex-col gap-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e2638]">
        <div className="flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
          <PlusCircle className={`w-4 h-4 ${side === 'Buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`} />
          <span>Limit Order Entry</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132030] text-[#7e8b9f] border border-[#1e2638]">
          GTC • STANDARD
        </span>
      </div>

      {/* Buy / Sell Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#061424] rounded border border-[#1e2638]">
        <button
          type="button"
          onClick={() => setSide('Buy')}
          className={`h-8 flex items-center justify-center gap-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            side === 'Buy'
              ? 'bg-[#0ecb81] text-[#061424] shadow-md shadow-[#0ecb81]/20'
              : 'text-[#7e8b9f] hover:text-[#d6e3fa] hover:bg-[#132030]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>BUY / BID</span>
        </button>

        <button
          type="button"
          onClick={() => setSide('Sell')}
          className={`h-8 flex items-center justify-center gap-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            side === 'Sell'
              ? 'bg-[#f6465d] text-white shadow-md shadow-[#f6465d]/20'
              : 'text-[#7e8b9f] hover:text-[#d6e3fa] hover:bg-[#132030]'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>SELL / ASK</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Order ID */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <label className="text-[#7e8b9f] uppercase flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#4e5d78]" />
              Order ID
            </label>
            <button
              type="button"
              onClick={generateNextId}
              className="text-[#45e89b] hover:text-[#60feae] hover:underline text-[10px]"
            >
              + Next ID
            </button>
          </div>
          <div className="relative flex items-center bg-[#061424] border border-[#1e2638] focus-within:border-[#2a364f] rounded">
            <input
              type="number"
              min="1"
              required
              value={orderId}
              onChange={(e) => setOrderId(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full h-8 bg-transparent px-3 font-mono text-xs text-[#d6e3fa] focus:outline-none tabular-nums"
            />
            <span className="pr-3 text-[10px] font-mono text-[#4e5d78]">INT</span>
          </div>
        </div>

        {/* Limit Price */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <label className="text-[#7e8b9f] uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#4e5d78]" />
              Limit Price ($)
            </label>
            <div className="flex items-center gap-1">
              {bestBid && (
                <button
                  type="button"
                  onClick={() => setPrice(bestBid)}
                  className="px-1.5 py-0.5 rounded bg-[#0b0e14] text-[#0ecb81] hover:bg-[#132030] text-[10px]"
                  title="Set to Best Bid"
                >
                  Bid: ${bestBid.toFixed(2)}
                </button>
              )}
              {bestAsk && (
                <button
                  type="button"
                  onClick={() => setPrice(bestAsk)}
                  className="px-1.5 py-0.5 rounded bg-[#0b0e14] text-[#f6465d] hover:bg-[#132030] text-[10px]"
                  title="Set to Best Ask"
                >
                  Ask: ${bestAsk.toFixed(2)}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center bg-[#061424] border border-[#1e2638] focus-within:border-[#2a364f] rounded overflow-hidden">
            <button
              type="button"
              onClick={() => handlePriceStep(-0.5)}
              className="w-8 h-8 flex items-center justify-center bg-[#132030] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#d6e3fa] font-mono text-xs border-r border-[#1e2638] transition-colors"
            >
              -
            </button>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={price}
              onChange={(e) => setPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className="w-full h-8 bg-transparent text-center font-mono text-xs text-[#d6e3fa] focus:outline-none tabular-nums font-semibold"
            />
            <button
              type="button"
              onClick={() => handlePriceStep(0.5)}
              className="w-8 h-8 flex items-center justify-center bg-[#132030] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#d6e3fa] font-mono text-xs border-l border-[#1e2638] transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <label className="text-[#7e8b9f] uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#4e5d78]" />
              Quantity (Shares)
            </label>
            <span className="text-[10px] text-[#4e5d78]">Lot: 1</span>
          </div>
          <div className="flex items-center bg-[#061424] border border-[#1e2638] focus-within:border-[#2a364f] rounded overflow-hidden">
            <button
              type="button"
              onClick={() => handleQtyStep(-5)}
              className="w-8 h-8 flex items-center justify-center bg-[#132030] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#d6e3fa] font-mono text-xs border-r border-[#1e2638] transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full h-8 bg-transparent text-center font-mono text-xs text-[#d6e3fa] focus:outline-none tabular-nums font-semibold"
            />
            <button
              type="button"
              onClick={() => handleQtyStep(5)}
              className="w-8 h-8 flex items-center justify-center bg-[#132030] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#d6e3fa] font-mono text-xs border-l border-[#1e2638] transition-colors"
            >
              +
            </button>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[10, 25, 50, 100, 250].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setQuantity(qty)}
                className={`py-1 rounded font-mono text-[10px] transition-colors ${
                  quantity === qty
                    ? 'bg-[#1e2638] text-[#45e89b] border border-[#3c4a40]'
                    : 'bg-[#061424] hover:bg-[#132030] text-[#7e8b9f] border border-[#1e2638]'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Order Total & Submit */}
        <div className="pt-2 border-t border-[#1e2638] flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#7e8b9f]">Total Value:</span>
            <span className="text-[#d6e3fa] font-bold tabular-nums">{totalValue}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isConnected || isSubmitting}
            className={`w-full h-9 rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
              side === 'Buy'
                ? 'bg-[#0ecb81] hover:bg-[#45e89b] text-[#061424] shadow-[#0ecb81]/20'
                : 'bg-[#f6465d] hover:bg-[#ff4d67] text-white shadow-[#f6465d]/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Zap className="w-4 h-4" />
            <span>SUBMIT {side.toUpperCase()} ORDER</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
