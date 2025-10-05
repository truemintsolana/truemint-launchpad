export type WalletTier = {
  tier: number;
  name: string;
  minAge: number;
  minTxCount: number;
  maxBuyPercent: number;
  color: string;
};

export const WALLET_TIERS: WalletTier[] = [
  {
    tier: 0,
    name: 'New',
    minAge: 0,
    minTxCount: 0,
    maxBuyPercent: 0.5,
    color: '#ef4444',
  },
  {
    tier: 1,
    name: 'Active',
    minAge: 30,
    minTxCount: 30,
    maxBuyPercent: 1.0,
    color: '#f97316',
  },
  {
    tier: 2,
    name: 'Veteran',
    minAge: 100,
    minTxCount: 100,
    maxBuyPercent: 2.0,
    color: '#eab308',
  },
  {
    tier: 3,
    name: 'Elite',
    minAge: 300,
    minTxCount: 300,
    maxBuyPercent: 3.0,
    color: '#22c55e',
  },
];

export function calculateWalletTier(ageDays: number, txCount: number): WalletTier {
  for (let i = WALLET_TIERS.length - 1; i >= 0; i--) {
    const tier = WALLET_TIERS[i];
    if (ageDays >= tier.minAge && txCount >= tier.minTxCount) {
      return tier;
    }
  }
  return WALLET_TIERS[0];
}

export function getMaxBuyAmount(totalSupply: number, walletTier: WalletTier): number {
  return (totalSupply * walletTier.maxBuyPercent) / 100;
}
