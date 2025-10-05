import { useState } from 'react';
import { Upload, Info, Shield, Clock, Lock } from 'lucide-react';

type LaunchFormData = {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: string;
  twitterUrl: string;
  telegramUrl: string;
  launchDelayMinutes: number;
};

type LaunchTokenFormProps = {
  onSubmit: (data: LaunchFormData) => void;
  isLoading?: boolean;
};

export default function LaunchTokenForm({ onSubmit, isLoading }: LaunchTokenFormProps) {
  const [formData, setFormData] = useState<LaunchFormData>({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    totalSupply: '1000000000',
    twitterUrl: '',
    telegramUrl: '',
    launchDelayMinutes: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const supply = Number(formData.totalSupply);
    if (supply < 1000) {
      alert('Minimum token supply is 1,000 tokens');
      return;
    }
    if (supply > 1000000000) {
      alert('Maximum token supply is 1,000,000,000 (1 billion) tokens');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          Token Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="My Amazing Token"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="MAT"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
              placeholder="Describe your token..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://..."
              />
              <button
                type="button"
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Total Supply
              <span className="text-xs text-slate-500 ml-2">(Min: 1,000 | Max: 1,000,000,000)</span>
            </label>
            <input
              type="number"
              min="1000"
              max="1000000000"
              step="1"
              value={formData.totalSupply}
              onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Twitter/X URL</label>
            <input
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://twitter.com/yourproject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Telegram URL</label>
            <input
              type="url"
              value={formData.telegramUrl}
              onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://t.me/yourproject"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-green-400" />
          Anti-Scam Features
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-green-500/30">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">100% Token Lock (Enforced)</p>
                <p className="text-xs text-slate-400 mb-2">All developer tokens are locked with a linear vesting schedule</p>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <Info className="w-3 h-3" />
                  <span>1% unlocks daily over 100 days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-green-500/30">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Virtual Liquidity → Real DEX Pool (Enforced)</p>
                <p className="text-xs text-slate-400 mb-2">Token uses virtual liquidity (bonding curve) until $50k market cap</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Info className="w-3 h-3" />
                    <span>At $50k: Auto-bundle to DEX with real LP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Info className="w-3 h-3" />
                    <span>$100 platform fee on bundle (from pooled SOL)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Info className="w-3 h-3" />
                    <span>LP tokens automatically burned on-chain</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl p-6 border border-blue-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Launch Timing
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Delayed Launch (5 minutes to 24 hours)
          </label>
          <select
            value={formData.launchDelayMinutes}
            onChange={(e) => setFormData({ ...formData, launchDelayMinutes: Number(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">Immediate</option>
            <option value="5">5 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours</option>
          </select>
          <p className="text-xs text-slate-400 mt-2">
            Gives everyone time to review the rules before trading starts
          </p>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-300">Token Creation Fee</p>
            <p className="text-xs text-yellow-400/80 mt-1">One-time fee to prevent spam tokens</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-400">$1.00</p>
            <p className="text-xs text-yellow-300">~0.006 SOL</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100"
      >
        {isLoading ? 'Launching Token...' : 'Launch Token ($1 Fee)'}
      </button>
    </form>
  );
}
