import { useState, useEffect } from 'react';
import { Settings, Wallet, DollarSign, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PlatformConfig = {
  feeWallet: string;
  totalFee: number;
  platformFee: number;
  creatorFee: number;
  stakerFee: number;
  bondingCurveType: 'linear' | 'exponential';
  graduationThreshold: number;
  creationFeeWallet: string;
  creationFeeAmount: number;
};

type AdminPanelProps = {
  isAdmin: boolean;
  walletAddress: string | null;
};

export default function AdminPanel({ isAdmin, walletAddress }: AdminPanelProps) {
  const [config, setConfig] = useState<PlatformConfig>({
    feeWallet: '',
    totalFee: 2.0,
    platformFee: 1.0,
    creatorFee: 0.5,
    stakerFee: 0.5,
    bondingCurveType: 'linear',
    graduationThreshold: 50000,
    creationFeeWallet: '',
    creationFeeAmount: 1.00,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: feeWalletData } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', 'fee_wallet')
        .maybeSingle();

      const { data: feeStructureData } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', 'fee_structure')
        .maybeSingle();

      const { data: ammSettingsData } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', 'amm_settings')
        .maybeSingle();

      if (feeWalletData) {
        setConfig((prev) => ({
          ...prev,
          feeWallet: feeWalletData.config_value.address || '',
        }));
      }

      if (feeStructureData) {
        setConfig((prev) => ({
          ...prev,
          totalFee: feeStructureData.config_value.total,
          platformFee: feeStructureData.config_value.platform,
          creatorFee: feeStructureData.config_value.creator,
          stakerFee: feeStructureData.config_value.stakers,
        }));
      }

      if (ammSettingsData) {
        setConfig((prev) => ({
          ...prev,
          bondingCurveType: ammSettingsData.config_value.bonding_curve_type,
          graduationThreshold: ammSettingsData.config_value.graduation_threshold,
        }));
      }

      const { data: creationFeeData } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', 'creation_fee_settings')
        .maybeSingle();

      if (creationFeeData) {
        setConfig((prev) => ({
          ...prev,
          creationFeeWallet: creationFeeData.config_value.fee_wallet || '',
          creationFeeAmount: creationFeeData.config_value.fee_amount_usd || 1.00,
        }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { error: walletError } = await supabase
        .from('platform_config')
        .update({
          config_value: { address: config.feeWallet },
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', 'fee_wallet');

      if (walletError) throw walletError;

      const { error: feeError } = await supabase
        .from('platform_config')
        .update({
          config_value: {
            total: config.totalFee,
            platform: config.platformFee,
            creator: config.creatorFee,
            stakers: config.stakerFee,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', 'fee_structure');

      if (feeError) throw feeError;

      const { error: ammError } = await supabase
        .from('platform_config')
        .update({
          config_value: {
            bonding_curve_type: config.bondingCurveType,
            graduation_threshold: config.graduationThreshold,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', 'amm_settings');

      if (ammError) throw ammError;

      const { error: creationFeeError } = await supabase
        .from('platform_config')
        .update({
          config_value: {
            fee_amount_usd: config.creationFeeAmount,
            fee_wallet: config.creationFeeWallet,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', 'creation_fee_settings');

      if (creationFeeError) throw creationFeeError;

      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
        <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-slate-400">Please connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-slate-900 border border-red-900/30 rounded-xl p-8 text-center">
        <Settings className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Unauthorized Access</h3>
        <p className="text-slate-400 mb-2">Your wallet is not authorized to access this panel.</p>
        <p className="text-xs text-slate-500 font-mono mt-4">
          {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
        </p>
        <p className="text-xs text-red-400 mt-4">
          Only authorized admin wallets can modify platform configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Platform Configuration</h2>
          <p className="text-sm text-slate-400">Manage platform-wide settings</p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            Fee Wallet Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Platform Fee Wallet Address
              </label>
              <input
                type="text"
                value={config.feeWallet}
                onChange={(e) => setConfig({ ...config, feeWallet: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter Solana wallet address"
              />
              <p className="text-xs text-slate-400 mt-2">
                All platform fees (1% of each transaction) will be sent to this address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token Creation Fee Wallet Address
              </label>
              <input
                type="text"
                value={config.creationFeeWallet}
                onChange={(e) => setConfig({ ...config, creationFeeWallet: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter Solana wallet address"
              />
              <p className="text-xs text-slate-400 mt-2">
                All $1 token creation fees will be sent to this address
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Fee Structure
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total Transaction Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.totalFee}
                onChange={(e) => setConfig({ ...config, totalFee: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Platform (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.platformFee}
                  onChange={(e) => setConfig({ ...config, platformFee: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Creator (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.creatorFee}
                  onChange={(e) => setConfig({ ...config, creatorFee: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stakers (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.stakerFee}
                  onChange={(e) => setConfig({ ...config, stakerFee: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-300">
                <span className="font-medium">Note:</span> Fee changes will apply to new
                transactions only. Ensure the sum matches the total fee percentage.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">AMM Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bonding Curve Type
              </label>
              <select
                value={config.bondingCurveType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bondingCurveType: e.target.value as 'linear' | 'exponential',
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Graduation Threshold (USD)
              </label>
              <input
                type="number"
                value={config.graduationThreshold}
                onChange={(e) =>
                  setConfig({ ...config, graduationThreshold: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-400 mt-2">
                Market cap threshold for auto-listing and LP burn
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Token Creation Fee</h3>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Creation Fee Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={config.creationFeeAmount}
              onChange={(e) =>
                setConfig({ ...config, creationFeeAmount: Number(e.target.value) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <p className="text-xs text-slate-400 mt-2">
              One-time fee charged when creating a token to prevent spam
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
