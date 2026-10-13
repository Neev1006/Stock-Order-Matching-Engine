import React, { useState } from 'react';
import { XCircle, Trash2, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CancelOrder({ onCancelOrder, isConnected }) {
  const [orderId, setOrderId] = useState('');
  const [side, setSide] = useState('Buy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = (e) => {
    e.preventDefault();
    if (!orderId) return;

    setIsSubmitting(true);
    onCancelOrder(Number(orderId), side);
    setTimeout(() => setIsSubmitting(false), 200);
  };

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e2638]">
        <div className="flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
          <XCircle className="w-4 h-4 text-[#f6465d]" />
          <span>Cancel Resting Order</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132030] text-[#7e8b9f] border border-[#1e2638]">
          UNFILL ONLY
        </span>
      </div>

      <form onSubmit={handleCancel} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Order ID */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-[#7e8b9f] uppercase flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#4e5d78]" />
              Order ID
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 101"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full h-8 bg-[#061424] border border-[#1e2638] focus:border-[#2a364f] rounded px-3 font-mono text-xs text-[#d6e3fa] focus:outline-none tabular-nums"
            />
          </div>

          {/* Side Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-[#7e8b9f] uppercase">
              Order Side
            </label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value)}
              className="w-full h-8 bg-[#061424] border border-[#1e2638] focus:border-[#2a364f] rounded px-2 font-mono text-xs text-[#d6e3fa] focus:outline-none"
            >
              <option value="Buy">Buy (Bid)</option>
              <option value="Sell">Sell (Ask)</option>
            </select>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isConnected || isSubmitting || !orderId}
          className="w-full h-8 rounded bg-[#1e2638] hover:bg-[#ac012f]/40 hover:border-[#f6465d] border border-[#2a364f] text-[#ffb4ab] hover:text-white font-mono text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>CANCEL ORDER #{orderId || '...'}</span>
        </motion.button>
      </form>
    </div>
  );
}
