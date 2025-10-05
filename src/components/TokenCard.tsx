import { TrendingUp, Users, Clock, Shield, ExternalLink } from 'lucide-react';
import { Token } from '../lib/supabase';
import { calculateWalletTier, WALLET_TIERS } from '../lib/wallet-tiers';

type TokenCardProps = {
  token: Token;
  onClick: () => void;
};

export default function TokenCard({ token, onClick }: TokenCardProps) {
  const progress = token.bonding_curve_progress;
  const isLaunched = token.is_tradeable;
  const timeUntilLaunch = token.scheduled_launch_at
    ? new Date(token.scheduled_launch_at).getTime() - Date.now()
    : 0;

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-green-500 transition-all cursor-pointer hover:transform hover:scale-[1.02]"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
          {token.image_url ? (
            <img src={token.image_url} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xl">
              {token.symbol.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-white text-lg truncate">{token.name}</h3>
              <p className="text-slate-400 text-sm">{token.symbol}</p>
            </div>
            {token.sealed_lp && (
              <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Sealed
              </div>
            )}
          </div>
        </div>
      </div>

      {token.description && (
        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{token.description}</p>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Market Cap</span>
          <span className="text-white font-semibold">${token.market_cap.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Price</span>
          <span className="text-white font-semibold">${token.current_price.toFixed(6)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">24h Volume</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            ${token.volume_24h.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Bonding Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {!isLaunched && timeUntilLaunch > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Launches in {formatTimeRemaining(timeUntilLaunch)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="w-4 h-4" />
          <span>Dev: {token.dev_allocation_percent}%</span>
        </div>

        {token.is_graduated ? (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <ExternalLink className="w-3 h-3" />
            <span>On DEX</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <span>Virtual LP</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {WALLET_TIERS.map((tier) => (
          <div
            key={tier.tier}
            className="flex-1 h-1 rounded-full"
            style={{
              backgroundColor: tier.tier <= progress / 25 ? tier.color : '#334155',
            }}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1 text-center">
        Per-wallet caps enforced on-chain
      </p>
    </div>
  );
}
