'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  data: DataPoint[];
  color: 'blue' | 'green' | 'purple' | 'orange';
  height?: number;
}

export default function TrendChart({ data, color, height = 120 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  const colors = {
    blue: { line: '#3B82F6', fill: 'rgba(59, 130, 246, 0.1)', dot: '#2563EB' },
    green: { line: '#10B981', fill: 'rgba(16, 185, 129, 0.1)', dot: '#059669' },
    purple: { line: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.1)', dot: '#7C3AED' },
    orange: { line: '#F59E0B', fill: 'rgba(245, 158, 11, 0.1)', dot: '#D97706' },
  };

  const theme = colors[color];

  // Calculate dimensions
  const width = 100; // percentage
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max for scaling
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1; // Prevent division by zero

  // Create path for line
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, value: point.value, date: point.date };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create area path (for fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Area fill */}
        <path
          d={areaPath}
          fill={theme.fill}
          vectorEffect="non-scaling-stroke"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={theme.line}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Dots */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="0.8"
              fill={theme.dot}
              className="hover:r-1.5 transition-all cursor-pointer"
            >
              <title>{`${point.date}: ${point.value}`}</title>
            </circle>
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
