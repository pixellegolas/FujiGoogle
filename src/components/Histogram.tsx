import React, { useMemo } from 'react';
import { HistogramData } from '../types';

interface HistogramProps {
  data: HistogramData | null;
  width?: number;
  height?: number;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  width = 110,
  height = 42,
}) => {
  const points = useMemo(() => {
    if (!data || !data.lum || data.lum.length === 0 || data.max <= 0) {
      // Default flat line if no data yet
      return `0,${height - 1} ${width},${height - 1}`;
    }

    const bins = data.lum;
    const binCount = bins.length;
    const dx = width / (binCount - 1);
    const max = Math.max(1, data.max);

    return bins
      .map((val, idx) => {
        const x = idx * dx;
        // Invert Y for SVG coordinates, pad 2px from bottom
        const normalized = val / max;
        // Non-linear scaling (sqrt) so low-level detail is easily visible
        const scaled = Math.sqrt(normalized);
        const y = Math.max(2, height - scaled * (height - 4) - 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  return (
    <div
      id="camera-histogram-container"
      className="relative flex flex-col items-start bg-black/60 backdrop-blur-xs border border-white/20 px-1.5 py-1 rounded select-none pointer-events-none"
      style={{ width: width + 12 }}
    >
      <div className="flex items-center justify-between w-full mb-0.5 text-[9px] font-mono tracking-wider text-white/70">
        <span>HIST</span>
        <span className="text-[8px] text-white/50">EV 0.0</span>
      </div>
      <svg
        width={width}
        height={height}
        className="overflow-visible block"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Subtle grid lines */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={width / 4} y1={0} x2={width / 4} y2={height} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={(width * 3) / 4} y1={0} x2={(width * 3) / 4} y2={height} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="2,2" />

        {/* White line histogram (as explicitly requested: "bara är vita linjer") */}
        <polyline
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};
