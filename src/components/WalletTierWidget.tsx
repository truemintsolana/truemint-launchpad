import { Shield, Clock, Activity } from 'lucide-react';
import { WalletAnalytics } from '../lib/supabase';
import { calculateWalletTier } from '../lib/wallet-tiers';

type WalletTierWidgetProps = {
  walletAnalytics: WalletAnalytics;
  totalSupply?: number;
};

export default function WalletTierWidget({ walletAnalytics, totalSupply }: WalletTierWidgetProps) {
  const tier = calculateWalletTier(walletAnalytics.age_days, walletAnalytics.transaction_count);
  const maxSupplyAmount = totalSupply ? (totalSupply * tier.maxBuyPercent) / 100 : 0;

  console.log('WalletTierWidget rendering:', {
    wallet: walletAnalytics.wallet_address,
    age: walletAnalytics.age_days,
    txCount: walletAnalytics.transaction_count,
    tier: tier.name,
    maxBuy: tier.maxBuyPercent,
  });

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Wallet Status</h3>
        <div
          className="px-3 py-1 rounded-lg text-sm font-bold"
          style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
        >
          {tier.name}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Wallet Age</span>
          </div>
          <span className="text-white font-semibold">{walletAnalytics.age_days} days</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Total Transactions</span>
          </div>
          <span className="text-white font-semibold">{walletAnalytics.transaction_count.toLocaleString()}</span>
        </div>

        <div className="border-t border-slate-700 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Max Buy Per Trade</span>
            </div>
            <span className="text-white font-bold">{tier.maxBuyPercent}%</span>
          </div>
          {totalSupply && (
            <div className="text-right mt-1">
              <span className="text-xs text-slate-500">
                {maxSupplyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-slate-900/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Shield className="w-3 h-3" />
          <span>Tier Requirements</span>
        </div>
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Active (1.0%):</span>
            <span>30+ days, 30+ txs</span>
          </div>
          <div className="flex justify-between">
            <span>Veteran (2.0%):</span>
            <span>100+ days, 100+ txs</span>
          </div>
          <div className="flex justify-between">
            <span>Elite (3.0%):</span>
            <span>300+ days, 300+ txs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
