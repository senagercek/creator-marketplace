"use client";

import React, { useState } from "react";

interface DailyViewsChartProps {
  data: Array<{ date: string; views: number }>;
}

export function DailyViewsChart({ data }: DailyViewsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
        No metric history available for this period.
      </div>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views), 100);
  const width = 700;
  const height = 220;
  const paddingX = 45;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index / (data.length - 1)) * chartWidth;
    const y = height - paddingY - (d.views / maxViews) * chartHeight;
    return { x, y, ...d };
  });

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce(
          (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
          ""
        );

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : "";

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[500px]"
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - paddingY - ratio * chartHeight;
          const val = Math.round(ratio * maxViews);
          return (
            <g key={ratio}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Gradient Fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#areaGradient)" />}

        {/* Main Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & Interaction */}
        {points.map((p, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5 : 3.5}
                className={`transition-all ${
                  isHovered
                    ? "fill-sky-600 stroke-white stroke-2"
                    : "fill-white stroke-sky-600 stroke-2"
                }`}
              />
              {/* Visible date on bottom for periodic items */}
              {(data.length <= 10 ||
                i === 0 ||
                i === data.length - 1 ||
                i % Math.ceil(data.length / 6) === 0) && (
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-mono"
                >
                  {p.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="pointer-events-none absolute -top-2 rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-md transform -translate-x-1/2 transition-all"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
          }}
        >
          <div className="font-semibold">
            {points[hoveredIndex].views.toLocaleString()} views
          </div>
          <div className="text-[10px] text-slate-300">
            {points[hoveredIndex].date}
          </div>
        </div>
      )}
    </div>
  );
}
