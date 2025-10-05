import { Shield, Clock, Lock, Users, TrendingUp, Flame, Eye } from 'lucide-react';

export default function FairLaunchRules() {
  const rules = [
    {
      icon: Users,
      title: 'Per-Wallet Caps (Anti-Bundle)',
      description: 'Max buy based on wallet age and transaction count',
      tiers: [
        'New wallets (< 30 days or < 30 tx) = 0.5% max per trade',
        'Active (≥ 30 days & ≥ 30 tx) = 1.0% max per trade',
        'Veteran (≥ 100 days & ≥ 100 tx) = 2.0% max per trade',
        'Elite (≥ 300 days & ≥ 300 tx) = 3.0% max per trade',
      ],
      color: 'red',
    },
    {
      icon: Eye,
      title: 'Cluster Detection (Anti-Sybil)',
      description: 'Automated detection of coordinated wallet groups',
      tiers: [
        'Analyzes transaction timing patterns in real-time',
        'Groups wallets buying within 5-minute windows',
        'Identifies new wallets with similar behavior patterns',
        'Visual bubble map shows risk clusters and total holdings',
      ],
      color: 'pink',
    },
    {
      icon: Lock,
      title: 'Dev Buy & Vesting',
      description: 'Dev can buy up to 10% with strict vesting rules',
      tiers: [
        'Creator can allocate up to 10% of total supply',
        'Dev tokens are locked and vest linearly',
        'Unlocks at 1% of allocation per day (100 days to fully unlock)',
        'Fair launch attestation signed on-chain',
      ],
      color: 'orange',
    },
    {
      icon: Flame,
      title: 'Bonding Curve & Sealed LP',
      description: 'Virtual bonding curve with automatic liquidity burn',
      tiers: [
        'Tokens start on a virtual bonding curve (no initial liquidity needed)',
        'Price increases as tokens are bought, decreases when sold',
        'At market cap threshold (e.g. $50K), auto-migrates to DEX',
        'LP tokens are automatically burned on migration (cannot be rugged)',
      ],
      color: 'yellow',
    },
    {
      icon: Clock,
      title: 'Delayed Launch Timer',
      description: 'Optional launch delay for maximum transparency',
      tiers: [
        'Token is visible on platform but NOT tradeable initially',
        'Creator sets delay timer: 5 minutes to 24 hours',
        'Everyone can see rules, supply, and dev allocation before trading',
        'No sniping or unfair advantage at launch',
      ],
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Platform Fees & Staking',
      description: '2% total trading fee split three ways',
      tiers: [
        '1.0% → Platform operations and development',
        '0.5% → Token creator (passive income)',
        '0.5% → Single-sided stakers (stake to earn from all trades)',
        'Simple wallet-to-wallet transfers have NO platform fees',
      ],
      color: 'green',
    },
    {
      icon: Shield,
      title: 'No Presales or Allowlists',
      description: 'Completely fair access for everyone',
      tiers: [
        'Zero presales or private rounds',
        'No influencer allowlists or special access',
        'No team or insider allocations beyond dev vesting',
        'Everyone trades under identical rules from launch',
      ],
      color: 'purple',
    },
  ];

  const colorMap: Record<string, string> = {
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
  };

  const iconColorMap: Record<string, string> = {
    red: 'text-red-400',
    pink: 'text-pink-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-slate-400',
  };

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Transparent Fair Rules</h2>
          <p className="text-lg text-slate-400">
            Short answers in plain English. Same rules for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {rules.map((rule, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${colorMap[rule.color]} border rounded-xl p-6`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <rule.icon className={`w-8 h-8 ${iconColorMap[rule.color]}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{rule.title}</h3>
                  <p className="text-slate-300 text-sm">{rule.description}</p>
                </div>
              </div>

              <ul className="space-y-2">
                {rule.tiers.map((tier, tierIndex) => (
                  <li key={tierIndex} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-slate-500 mt-1">•</span>
                    <span>{tier}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">How It Works</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">1. Token Creation (0.006 SOL fee)</h4>
                <p>Creator launches token with custom name, symbol, supply, and optional delayed launch timer.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">2. Trading on Bonding Curve</h4>
                <p>Tokens start on virtual bonding curve. Price rises with buys, falls with sells. Wallet tier caps prevent bundling.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">3. Cluster Detection Active</h4>
                <p>System monitors transactions in real-time, grouping suspicious wallets by timing and behavior patterns.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">4. Auto-Migration to DEX</h4>
                <p>At market cap threshold, token migrates to DEX automatically. LP tokens are burned (cannot be removed).</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Transparency & Verification</h3>
            <p className="text-slate-300 text-center max-w-3xl mx-auto mb-4">
              All rules are enforced at the smart contract level and verifiable on-chain. Token parameters,
              dev allocations, vesting schedules, and LP burn transactions are permanently recorded on Solana.
            </p>
            <p className="text-slate-400 text-center text-sm max-w-2xl mx-auto">
              Always do your own research. This platform provides tools to reduce common scam vectors,
              but cannot guarantee the success or legitimacy of any token.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
