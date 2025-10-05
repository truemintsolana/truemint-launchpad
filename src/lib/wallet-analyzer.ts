import { calculateWalletTier } from './wallet-tiers';

const SOLANA_RPC_URLS = [
  'https://solana-mainnet.g.alchemy.com/v2/Uji5eGznZBCbLJdHOl154',
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
];

export interface WalletAnalysis {
  ageDays: number;
  transactionCount: number;
  tier: number;
  maxBuyPercent: number;
}

export async function analyzeWallet(walletAddress: string): Promise<WalletAnalysis> {
  try {
    console.log('Analyzing wallet:', walletAddress);
    const signatures = await fetchSignatures(walletAddress);
    const transactionCount = signatures.length;
    console.log('Transaction count:', transactionCount);

    const oldestSignature = signatures[signatures.length - 1];
    const ageDays = oldestSignature
      ? calculateWalletAge(oldestSignature.blockTime)
      : 0;
    console.log('Wallet age (days):', ageDays);

    const walletTier = calculateWalletTier(ageDays, transactionCount);
    console.log('Calculated tier:', walletTier);

    return {
      ageDays,
      transactionCount,
      tier: walletTier.tier,
      maxBuyPercent: walletTier.maxBuyPercent,
    };
  } catch (error) {
    console.error('Error analyzing wallet:', error);
    return {
      ageDays: 0,
      transactionCount: 0,
      tier: 0,
      maxBuyPercent: 0.5,
    };
  }
}

async function fetchSignatures(walletAddress: string, limit = 1000): Promise<any[]> {
  const requestBody = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getSignaturesForAddress',
    params: [
      walletAddress,
      {
        limit,
      },
    ],
  };

  console.log('=== FETCHING SIGNATURES ===');
  console.log('Wallet:', walletAddress);
  console.log('Request:', JSON.stringify(requestBody, null, 2));

  for (let i = 0; i < SOLANA_RPC_URLS.length; i++) {
    const rpcUrl = SOLANA_RPC_URLS[i];

    try {
      console.log(`Trying RPC ${i + 1}/${SOLANA_RPC_URLS.length}: ${rpcUrl}`);

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RPC Error Response:', errorText);
        continue;
      }

      const data = await response.json();

      if (data.error) {
        console.error('RPC returned error:', data.error);
        continue;
      }

      console.log('✓ Success! Signatures fetched:', data.result?.length || 0);
      return data.result || [];
    } catch (error) {
      console.error(`Failed with ${rpcUrl}:`, error);
      if (i === SOLANA_RPC_URLS.length - 1) {
        console.error('All RPC endpoints failed');
        return [];
      }
      continue;
    }
  }

  return [];
}

function calculateWalletAge(blockTime: number | null): number {
  if (!blockTime) return 0;

  const now = Math.floor(Date.now() / 1000);
  const ageSeconds = now - blockTime;
  const ageDays = Math.floor(ageSeconds / (24 * 60 * 60));

  return ageDays;
}
