export type FeeDistribution = {
  totalFee: number;
  platformFee: number;
  creatorFee: number;
  stakerFee: number;
};

export const FEE_CONFIG = {
  TOTAL_FEE_PERCENT: 2.0,
  PLATFORM_PERCENT: 1.0,
  CREATOR_PERCENT: 0.5,
  STAKER_PERCENT: 0.5,
};

export function calculateFees(amount: number): FeeDistribution {
  const totalFee = (amount * FEE_CONFIG.TOTAL_FEE_PERCENT) / 100;
  const platformFee = (amount * FEE_CONFIG.PLATFORM_PERCENT) / 100;
  const creatorFee = (amount * FEE_CONFIG.CREATOR_PERCENT) / 100;
  const stakerFee = (amount * FEE_CONFIG.STAKER_PERCENT) / 100;

  return {
    totalFee,
    platformFee,
    creatorFee,
    stakerFee,
  };
}

export function calculateNetAmount(grossAmount: number): number {
  const fees = calculateFees(grossAmount);
  return grossAmount - fees.totalFee;
}

export function formatLamports(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4);
}

export function formatTokenAmount(amount: number, decimals: number = 9): string {
  return (amount / Math.pow(10, decimals)).toLocaleString();
}
