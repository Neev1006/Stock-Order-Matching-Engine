import React, { useMemo, useState } from 'react';
import { BarChart3, LineChart, TrendingUp, Eye } from 'lucide-react';

export default function DepthChart({ bids = [], asks = [], trades = [] }) {
  const [chartView, setChartView] = useState('depth'); // 'depth' | 'price'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process cumulative depth points
  const depthData = useMemo(() => {
    // Sort bids descending by price
    const sortedBids = [...bids].sort((a, b) => b.price - a.price);
    let bidCum = 0;
    const bidPoints = sortedBids.map((b) => {
      bidCum += b.quantity;
      return { price: b.price, cumulative: bidCum, type: 'bid' };
    }).reverse(); // for left-to-right drawing (lower price to higher price)

    // Sort asks ascending by price
    const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
    let askCum = 0;
    const askPoints = sortedAsks.map((a) => {
      askCum += a.quantity;
      return { price: a.price, cumulative: askCum, type: 'ask' };
    });

    return { bidPoints, askPoints, maxCum: Math.max(bidCum, askCum, 10) };
  }, [bids, asks]);

  // Width & height of SVG canvas
  const svgWidth = 500;
  const svgHeight = 160;
  const padding = { top: 15, bottom: 25, left: 10, right: 10 };

  // Calculate SVG path for depth chart
  const renderDepthPaths = () => {
    const { bidPoints, askPoints, maxCum } = depthData;
    if (bidPoints.length === 0 && askPoints.length === 0) {
      return (
        <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="#4e5d78" className="font-mono text-xs italic">
          Awaiting order book data...
        </text>
      );
    }

    // Min and max price across all points
    const allPrices = [...bidPoints, ...askPoints].map((p) => p.price);
    const minPrice = Math.min(...allPrices) * 0.99;
    const maxPrice = Math.max(...allPrices) * 1.01;
    const priceRange = maxPrice - minPrice || 1;

    const scaleX = (p) => padding.left + ((p - minPrice) / priceRange) * (svgWidth - padding.left - padding.right);
    const scaleY = (c) => svgHeight - padding.bottom - (c / maxCum) * (svgHeight - padding.top - padding.bottom);

    // Build Bid Step Path
    let bidPath = '';
    if (bidPoints.length > 0) {
      const startX = scaleX(bidPoints[0].price);
      const startY = svgHeight - padding.bottom;
      bidPath = `M ${startX} ${startY}`;

      bidPoints.forEach((pt, idx) => {
        const x = scaleX(pt.price);
        const y = scaleY(pt.cumulative);
        if (idx === 0) {
          bidPath += ` L ${x} ${y}`;
        } else {
          const prevY = scaleY(bidPoints[idx - 1].cumulative);
          bidPath += ` L ${x} ${prevY} L ${x} ${y}`;
        }
      });
      const endX = scaleX(bidPoints[bidPoints.length - 1].price);
      bidPath += ` L ${endX} ${svgHeight - padding.bottom} Z`;
    }

    // Build Ask Step Path
    let askPath = '';
    if (askPoints.length > 0) {
      const startX = scaleX(askPoints[0].price);
      const startY = svgHeight - padding.bottom;
      askPath = `M ${startX} ${startY}`;

      askPoints.forEach((pt, idx) => {
        const x = scaleX(pt.price);
        const y = scaleY(pt.cumulative);
        if (idx === 0) {
          askPath += ` L ${x} ${y}`;
        } else {
          const prevY = scaleY(askPoints[idx - 1].cumulative);
          askPath += ` L ${x} ${prevY} L ${x} ${y}`;
        }
      });
      const endX = scaleX(askPoints[askPoints.length - 1].price);
      askPath += ` L ${endX} ${svgHeight - padding.bottom} Z`;
    }

    return (
      <>
        {/* Bid Area & Stroke */}
        {bidPath && (
          <>
            <path d={bidPath} fill="url(#bid-gradient)" opacity="0.8" />
            <path
              d={bidPath.replace(/ Z$/, '')}
              fill="none"
              stroke="#0ecb81"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Ask Area & Stroke */}
        {askPath && (
          <>
            <path d={askPath} fill="url(#ask-gradient)" opacity="0.8" />
            <path
              d={askPath.replace(/ Z$/, '')}
              fill="none"
              stroke="#f6465d"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Price ticks */}
        <text x={padding.left + 5} y={svgHeight - 8} fill="#7e8b9f" fontSize="10" className="font-mono">
          ${minPrice.toFixed(2)}
        </text>
        <text x={svgWidth - padding.right - 5} y={svgHeight - 8} textAnchor="end" fill="#7e8b9f" fontSize="10" className="font-mono">
          ${maxPrice.toFixed(2)}
        </text>
        <text x={svgWidth / 2} y={svgHeight - 8} textAnchor="middle" fill="#3be194" fontSize="10" className="font-mono">
          MID: ${((minPrice + maxPrice) / 2).toFixed(2)}
        </text>
      </>
    );
  };

  // Render Price History Chart (recent executed trades)
  const renderPriceLine = () => {
    if (trades.length < 2) {
      return (
        <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="#4e5d78" className="font-mono text-xs italic">
          Execute trades to generate price action curve...
        </text>
      );
    }

    const priceList = [...trades].reverse().map((t) => t.price);
    const minP = Math.min(...priceList) * 0.995;
    const maxP = Math.max(...priceList) * 1.005;
    const range = maxP - minP || 1;

    const scaleX = (i) => padding.left + (i / (priceList.length - 1)) * (svgWidth - padding.left - padding.right);
    const scaleY = (p) => svgHeight - padding.bottom - ((p - minP) / range) * (svgHeight - padding.top - padding.bottom);

    const points = priceList.map((p, i) => `${scaleX(i)},${scaleY(p)}`).join(' ');
    const firstX = scaleX(0);
    const lastX = scaleX(priceList.length - 1);
    const areaPath = `M ${firstX} ${svgHeight - padding.bottom} L ${points.replace(/,/g, ' ')} L ${lastX} ${svgHeight - padding.bottom} Z`;

    const latestPrice = priceList[priceList.length - 1];

    return (
      <>
        {/* Area fill */}
        <polygon points={`${firstX},${svgHeight - padding.bottom} ${points} ${lastX},${svgHeight - padding.bottom}`} fill="url(#price-gradient)" />
        {/* Line */}
        <polyline points={points} fill="none" stroke="#45e89b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Latest trade point */}
        <circle
          cx={scaleX(priceList.length - 1)}
          cy={scaleY(latestPrice)}
          r="4"
          fill="#60feae"
          stroke="#061424"
          strokeWidth="2"
        />
        {/* Price labels */}
        <text x={padding.left + 5} y={svgHeight - 8} fill="#7e8b9f" fontSize="10" className="font-mono">
          Earliest: ${priceList[0].toFixed(2)}
        </text>
        <text x={svgWidth - padding.right - 5} y={svgHeight - 8} textAnchor="end" fill="#60feae" fontSize="10" className="font-mono font-bold">
          Last: ${latestPrice.toFixed(2)}
        </text>
      </>
    );
  };

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-3 flex flex-col shadow-lg">
      {/* Header with Switcher */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2638]">
        <div className="flex items-center gap-2">
          {chartView === 'depth' ? (
            <BarChart3 className="w-4 h-4 text-[#0ecb81]" />
          ) : (
            <LineChart className="w-4 h-4 text-[#45e89b]" />
          )}
          <h2 className="text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
            {chartView === 'depth' ? 'Market Depth Curve' : 'Execution Price Action'}
          </h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-[#061424] rounded border border-[#1e2638]">
          <button
            type="button"
            onClick={() => setChartView('depth')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              chartView === 'depth'
                ? 'bg-[#1e2638] text-[#45e89b] font-semibold'
                : 'text-[#7e8b9f] hover:text-[#d6e3fa]'
            }`}
          >
            Depth
          </button>
          <button
            type="button"
            onClick={() => setChartView('price')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              chartView === 'price'
                ? 'bg-[#1e2638] text-[#45e89b] font-semibold'
                : 'text-[#7e8b9f] hover:text-[#d6e3fa]'
            }`}
          >
            Price Line ({trades.length})
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[160px] bg-[#061424] rounded border border-[#1e2638] overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="bid-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ecb81" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0ecb81" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="ask-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6465d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f6465d" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="price-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#45e89b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#45e89b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1={svgHeight / 4} x2={svgWidth} y2={svgHeight / 4} stroke="#132030" strokeDasharray="3 3" />
          <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="#132030" strokeDasharray="3 3" />
          <line x1="0" y1={(svgHeight * 3) / 4} x2={svgWidth} y2={(svgHeight * 3) / 4} stroke="#132030" strokeDasharray="3 3" />

          {chartView === 'depth' ? renderDepthPaths() : renderPriceLine()}
        </svg>
      </div>
    </div>
  );
}
