import { useState } from 'react';
import { Coins, TrendingUp, Gift } from 'lucide-react';
import { StakingPool, StakerPosition } from '../lib/supabase';
import { formatTokenAmount, formatLamports } from '../lib/fee-calculator';

type StakingPanelProps = {
  pool: StakingPool;
  position: StakerPosition | null;
  tokenSymbol: string;
  onStake: (amount: number) => void;
  onUnstake: (amount: number) => void;
  onClaim: () => void;
  isLoading?: boolean;
};

export default function StakingPanel({
  pool,
  position,
  tokenSymbol,
  onStake,
  onUnstake,
  onClaim,
  isLoading,
}: StakingPanelProps) {
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'stake' | 'unstake'>('stake');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    if (action === 'stake') {
      onStake(Number(amount));
    } else {
      onUnstake(Number(amount));
    }

    setAmount('');
  };

  const stakedAmount = position?.staked_amount || 0;
  const rewardsEarned = position?.rewards_earned || 0;
  const apr = pool.total_staked > 0 ? (pool.total_rewards_accumulated / pool.total_staked) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Single-Sided Staking
          </h3>
          <p className="text-sm text-slate-400 mt-1">Earn 0.5% of all trading fees</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Staked</p>
          <p className="text-lg font-bold text-white">
            {formatTokenAmount(pool.total_staked)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{tokenSymbol}</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Rewards</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatLamports(pool.total_rewards_accumulated)}
          </p>
          <p className="text-xs text-slate-500 mt-1">SOL</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Est. APR</p>
          <p className="text-lg font-bold text-yellow-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {apr.toFixed(2)}%
          </p>
        </div>
      </div>

      {position && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">Your Position</span>
            <span className="text-sm text-green-400 font-semibold">
              {formatTokenAmount(stakedAmount)} {tokenSymbol}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-400" />
              Unclaimed Rewards
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-yellow-400 font-semibold">
                {formatLamports(rewardsEarned)} SOL
              </span>
              <button
                onClick={onClaim}
                disabled={isLoading || rewardsEarned === 0}
                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
              >
                Claim
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAction('stake')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action === 'stake'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Stake
        </button>
        <button
          onClick={() => setAction('unstake')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action === 'unstake'
              ? 'bg-orange-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Unstake
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Amount ({tokenSymbol})
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
            {action === 'unstake' && position && (
              <button
                type="button"
                onClick={() => setAmount(stakedAmount.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                MAX
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isLoading ||
            !amount ||
            Number(amount) <= 0 ||
            (action === 'unstake' && Number(amount) > stakedAmount)
          }
          className={`w-full font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 ${
            action === 'stake'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
              : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
          } text-white`}
        >
          {isLoading
            ? 'Processing...'
            : action === 'stake'
            ? `Stake ${tokenSymbol}`
            : `Unstake ${tokenSymbol}`}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-300">
          <span className="font-medium">Gas-efficient rewards:</span> All stakers share a single pool,
          minimizing transaction costs and avoiding dust transactions.
        </p>
      </div>
    </div>
  );
}
