import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type ChartMode = 'price' | 'marketcap';

type CandlestickChartProps = {
  tokenId: string;
  currentPrice: number;
  marketCap: number;
  totalSupply: number;
};

export default function CandlestickChart({ tokenId, currentPrice, marketCap, totalSupply }: CandlestickChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('15m');
  const [chartMode, setChartMode] = useState<ChartMode>('price');
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    generateMockCandles();
  }, [timeFrame, currentPrice]);

  const generateMockCandles = () => {
    const now = Date.now();
    const intervals: Record<TimeFrame, number> = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
    };

    const interval = intervals[timeFrame];
    const numCandles = 50;
    const mockCandles: Candle[] = [];

    let price = currentPrice * 0.8;

    for (let i = numCandles; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const volatility = 0.03;

      const open = price;
      const change = (Math.random() - 0.48) * volatility;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
      const volume = Math.random() * 1000 + 500;

      mockCandles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });

      price = close;
    }

    setCandles(mockCandles);
  };

  const getValue = (candle: Candle, field: 'open' | 'high' | 'low' | 'close') => {
    if (chartMode === 'marketcap') {
      return candle[field] * totalSupply;
    }
    return candle[field];
  };

  const formatValue = (value: number) => {
    if (chartMode === 'marketcap') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
      return `$${value.toFixed(2)}`;
    }
    return `$${value.toFixed(6)}`;
  };

  const maxValue = Math.max(...candles.map(c => getValue(c, 'high')));
  const minValue = Math.min(...candles.map(c => getValue(c, 'low')));
  const valueRange = maxValue - minValue;

  const getY = (value: number) => {
    return ((maxValue - value) / valueRange) * 100;
  };

  const timeFrames: { value: TimeFrame; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  const currentCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];
  const priceChange = currentCandle && previousCandle
    ? ((getValue(currentCandle, 'close') - getValue(previousCandle, 'close')) / getValue(previousCandle, 'close')) * 100
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Price Chart</h3>
          {currentCandle && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">
                {formatValue(getValue(currentCandle, 'close'))}
              </span>
              <div className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(priceChange).toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setChartMode('price')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                chartMode === 'price'
                  ? 'bg-green-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setChartMode('marketcap')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                chartMode === 'marketcap'
                  ? 'bg-green-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Market Cap
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {timeFrames.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeFrame(tf.value)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              timeFrame === tf.value
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="relative h-80 bg-slate-900/50 rounded-lg p-4">
        <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}

          {candles.map((candle, index) => {
            const x = (index / (candles.length - 1)) * 1000;
            const width = 1000 / candles.length * 0.6;

            const openY = getY(getValue(candle, 'open'));
            const closeY = getY(getValue(candle, 'close'));
            const highY = getY(getValue(candle, 'high'));
            const lowY = getY(getValue(candle, 'low'));

            const isGreen = getValue(candle, 'close') >= getValue(candle, 'open');
            const color = isGreen ? '#10b981' : '#ef4444';
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;

            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={`${highY}%`}
                  x2={x}
                  y2={`${lowY}%`}
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.8"
                />
                <rect
                  x={x - width / 2}
                  y={`${bodyTop}%`}
                  width={width}
                  height={`${bodyHeight}%`}
                  fill={color}
                  opacity="0.9"
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute top-2 right-2 text-xs text-slate-400">
          {formatValue(maxValue)}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          {formatValue(minValue)}
        </div>
      </div>

      {currentCandle && (
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400 mb-1">Open</p>
            <p className="text-sm font-medium text-white">{formatValue(getValue(currentCandle, 'open'))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">High</p>
            <p className="text-sm font-medium text-green-400">{formatValue(getValue(currentCandle, 'high'))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Low</p>
            <p className="text-sm font-medium text-red-400">{formatValue(getValue(currentCandle, 'low'))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Close</p>
            <p className="text-sm font-medium text-white">{formatValue(getValue(currentCandle, 'close'))}</p>
          </div>
        </div>
      )}
    </div>
  );
}
