export type BondingCurveConfig = {
  initialPrice: number;
  graduationThreshold: number;
  curveType: 'linear' | 'exponential';
};

export const DEFAULT_BONDING_CURVE: BondingCurveConfig = {
  initialPrice: 0.00001,
  graduationThreshold: 50000,
  curveType: 'linear',
};

export function calculatePrice(
  currentSupply: number,
  totalSupply: number,
  config: BondingCurveConfig = DEFAULT_BONDING_CURVE
): number {
  const progress = currentSupply / totalSupply;

  if (config.curveType === 'linear') {
    return config.initialPrice * (1 + progress * 10);
  } else {
    return config.initialPrice * Math.pow(1.5, progress * 10);
  }
}

export function calculateBuyPrice(
  currentSupply: number,
  amount: number,
  totalSupply: number,
  config: BondingCurveConfig = DEFAULT_BONDING_CURVE
): number {
  let totalCost = 0;

  for (let i = 0; i < amount; i++) {
    const price = calculatePrice(currentSupply + i, totalSupply, config);
    totalCost += price;
  }

  return totalCost;
}

export function calculateSellPrice(
  currentSupply: number,
  amount: number,
  totalSupply: number,
  config: BondingCurveConfig = DEFAULT_BONDING_CURVE
): number {
  let totalReturn = 0;

  for (let i = 0; i < amount; i++) {
    const price = calculatePrice(currentSupply - i - 1, totalSupply, config);
    totalReturn += price;
  }

  return totalReturn;
}

export function shouldGraduate(marketCap: number, config: BondingCurveConfig = DEFAULT_BONDING_CURVE): boolean {
  return marketCap >= config.graduationThreshold;
}

export function calculateMarketCap(currentPrice: number, totalSupply: number): number {
  return currentPrice * totalSupply;
}
