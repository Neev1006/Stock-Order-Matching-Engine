import React, { useState } from 'react';
import { TerminalSquare, Trash2, Copy, Check, Filter } from 'lucide-react';

export default function EventLog({ logs = [], onClearLogs }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'order' | 'trade' | 'error'
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'order') return log.type === 'order' || log.type === 'warning';
    if (filter === 'trade') return log.type === 'trade';
    if (filter === 'error') return log.type === 'error';
    return true;
  });

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'trade':
        return 'text-[#45e89b] bg-[#0ecb81]/15 border-[#0ecb81]/30';
      case 'order':
        return 'text-[#60feae] bg-[#1e2638] border-[#3c4a40]';
      case 'warning':
        return 'text-[#fec521] bg-[#deaa00]/15 border-[#deaa00]/30';
      case 'error':
        return 'text-[#ffb4ab] bg-[#93000a]/30 border-[#ffb4ab]/30';
      case 'success':
        return 'text-[#3be194] bg-[#005231]/40 border-[#0ecb81]/40';
      default:
        return 'text-[#7e8b9f] bg-[#132030] border-[#1e2638]';
    }
  };

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-3 flex flex-col h-full shadow-lg">
      {/* Header with Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-[#1e2638] gap-2">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-[#7e8b9f]" />
          <h2 className="text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
            Engine Audit & Event Log
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#061424] text-[#7e8b9f]">
            {filteredLogs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-[#061424] rounded border border-[#1e2638]">
            {['all', 'order', 'trade', 'error'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  filter === f
                    ? 'bg-[#1e2638] text-[#45e89b] font-bold'
                    : 'text-[#7e8b9f] hover:text-[#d6e3fa]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded bg-[#061424] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#d6e3fa] border border-[#1e2638] text-xs transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#0ecb81]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1 rounded bg-[#061424] hover:bg-[#1e2638] text-[#7e8b9f] hover:text-[#ffb4ab] border border-[#1e2638] text-xs transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="flex-1 overflow-y-auto max-h-[160px] flex flex-col gap-1 font-mono text-[11px] bg-[#061424] p-2 rounded border border-[#1e2638]">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#4e5d78] italic text-xs py-4">
            No events logged yet
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 py-0.5 hover:bg-[#0f1c2c] px-1 rounded transition-colors"
            >
              <span className="text-[#4e5d78] shrink-0 text-[10px] select-none">
                [{log.timestamp}]
              </span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded border font-semibold uppercase tracking-wider shrink-0 select-none ${getBadgeStyle(
                  log.type
                )}`}
              >
                {log.type}
              </span>
              <span className="text-[#d6e3fa] break-all leading-tight flex-1">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
