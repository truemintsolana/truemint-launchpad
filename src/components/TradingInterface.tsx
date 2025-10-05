import { useState } from 'react';
import { ArrowDownUp, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { Token, WalletAnalytics } from '../lib/supabase';
import { calculateFees, formatLamports } from '../lib/fee-calculator';
import { calculateWalletTier, getMaxBuyAmount } from '../lib/wallet-tiers';

type TradingInterfaceProps = {
  token: Token;
  walletAnalytics: WalletAnalytics | null;
  onTrade: (type: 'buy' | 'sell', amount: number) => void;
  isLoading?: boolean;
};

export default function TradingInterface({
  token,
  walletAnalytics,
  onTrade,
  isLoading,
}: TradingInterfaceProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  const tier = walletAnalytics
    ? calculateWalletTier(walletAnalytics.age_days, walletAnalytics.transaction_count)
    : null;

  const maxBuyAmount = tier ? getMaxBuyAmount(token.total_supply, tier) : 0;

  const estimatedPrice = Number(amount) * token.current_price;
  const fees = calculateFees(estimatedPrice);
  const netAmount = estimatedPrice - fees.totalFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onTrade(tradeType, Number(amount));
    setAmount('');
  };

  const exceedsMaxBuy = tradeType === 'buy' && Number(amount) > maxBuyAmount;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trade {token.symbol}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tradeType === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tradeType === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {token.is_graduated ? (
        <div className="mb-4 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Listed on DEX - Real Liquidity Pool</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <Info className="w-4 h-4" />
            <span className="font-medium">Virtual Liquidity - Graduates at $50k market cap</span>
          </div>
        </div>
      )}

      {tier && (
        <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Your Wallet Tier</span>
            <span
              className="text-sm font-semibold px-2 py-1 rounded"
              style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
            >
              {tier.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Max buy per transaction</span>
            <span className="font-medium">{tier.maxBuyPercent}% of supply</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <Info className="w-3 h-3" />
            <span>
              Age: {walletAnalytics?.age_days || 0} days • Txs: {walletAnalytics?.transaction_count || 0}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Amount ({token.symbol})
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-slate-900 border ${
                exceedsMaxBuy ? 'border-red-500' : 'border-slate-700'
              } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 ${
                exceedsMaxBuy ? 'focus:ring-red-500' : 'focus:ring-green-500'
              }`}
              placeholder="0.00"
            />
            {tier && tradeType === 'buy' && (
              <button
                type="button"
                onClick={() => setAmount(maxBuyAmount.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-400 hover:text-green-300 font-medium"
              >
                MAX
              </button>
            )}
          </div>
          {exceedsMaxBuy && (
            <div className="flex items-center gap-2 text-xs text-red-400 mt-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Exceeds your wallet tier limit of {maxBuyAmount.toLocaleString()} {token.symbol}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className="bg-slate-700 rounded-full p-2">
            <ArrowDownUp className="w-5 h-5 text-slate-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            You {tradeType === 'buy' ? 'pay' : 'receive'}
          </label>
          <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-white">
                {estimatedPrice.toFixed(4)}
              </span>
              <span className="text-slate-400">SOL</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span>Price per token</span>
            <span className="text-white">${token.current_price.toFixed(6)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Platform fee (1%)</span>
            <span className="text-white">{formatLamports(fees.platformFee * 1e9)} SOL</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Creator fee (0.5%)</span>
            <span className="text-white">{formatLamports(fees.creatorFee * 1e9)} SOL</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Staker rewards (0.5%)</span>
            <span className="text-white">{formatLamports(fees.stakerFee * 1e9)} SOL</span>
          </div>
          <div className="border-t border-slate-700 pt-2 mt-2">
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Total fees (2%)</span>
              <span className="text-red-400">{formatLamports(fees.totalFee * 1e9)} SOL</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount || Number(amount) <= 0 || exceedsMaxBuy}
          className={`w-full font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 ${
            tradeType === 'buy'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white'
          }`}
        >
          {isLoading
            ? 'Processing...'
            : tradeType === 'buy'
            ? `Buy ${token.symbol}`
            : `Sell ${token.symbol}`}
        </button>
      </form>

      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-green-400 mt-0.5" />
          <div className="text-xs text-green-300">
            <p className="font-medium mb-1">2% Fee Benefits Everyone</p>
            <p className="text-green-400/80">
              Platform development (1%) • Token creator (0.5%) • Stakers like you (0.5%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
