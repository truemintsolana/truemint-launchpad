import { useState, useEffect } from 'react';
import { Shield, TrendingUp } from 'lucide-react';
import Header from './components/Header';
import LaunchTokenForm from './components/LaunchTokenForm';
import TokenCard from './components/TokenCard';
import TradingInterface from './components/TradingInterface';
import BubbleMap from './components/BubbleMap';
import StakingPanel from './components/StakingPanel';
import FairLaunchRules from './components/FairLaunchRules';
import AdminPanel from './components/AdminPanel';
import WalletTierWidget from './components/WalletTierWidget';
import CandlestickChart from './components/CandlestickChart';
import { supabase, Token, WalletAnalytics, WalletCluster, StakingPool, StakerPosition } from './lib/supabase';
import { analyzeWallet } from './lib/wallet-analyzer';

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'launch' | 'token' | 'admin'>('home');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [walletAnalytics, setWalletAnalytics] = useState<WalletAnalytics | null>(null);
  const [clusters, setClusters] = useState<WalletCluster[]>([]);
  const [stakingPool, setStakingPool] = useState<StakingPool | null>(null);
  const [stakerPosition, setStakerPosition] = useState<StakerPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [hasEnvError, setHasEnvError] = useState(false);

  useEffect(() => {
    console.log('App mounting...');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Missing environment variables!');
      setHasEnvError(true);
      return;
    }

    loadTokens();

    const { solana } = window as any;
    if (solana?.isConnected) {
      solana.disconnect().catch(() => {});
    }

    if (solana) {
      const handleAccountChanged = (publicKey: any) => {
        console.log('=== ACCOUNT CHANGED EVENT ===');
        console.log('New PublicKey:', publicKey?.toString() || 'null');
        if (publicKey) {
          const newAddress = publicKey.toString();
          handleWalletChanged(newAddress);
        } else {
          setWalletAddress(null);
          setWalletAnalytics(null);
          setIsAdmin(false);
        }
      };

      solana.on('accountChanged', handleAccountChanged);

      return () => {
        solana.off('accountChanged', handleAccountChanged);
      };
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'launch') {
        setActiveView('launch');
      } else if (hash === 'tokens' || hash === 'faq') {
        setActiveView('home');
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setActiveView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (selectedToken) {
      loadTokenDetails(selectedToken.id);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (walletAddress) {
      checkAdminStatus(walletAddress);
    } else {
      setIsAdmin(false);
    }
  }, [walletAddress]);

  const checkAdminStatus = async (address: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_wallets')
        .select('wallet_address')
        .eq('wallet_address', address)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);

      const { data: txData } = await supabase
        .from('transactions')
        .select('sol_amount');

      if (txData) {
        const total = txData.reduce((sum, tx) => sum + (tx.sol_amount / 1e9), 0);
        setTotalVolume(total);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  const loadTokenDetails = async (tokenId: string) => {
    try {
      const { data: clustersData } = await supabase
        .from('wallet_clusters')
        .select('*')
        .eq('token_id', tokenId);

      setClusters(clustersData || []);

      const { data: poolData } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('token_id', tokenId)
        .maybeSingle();

      setStakingPool(poolData);

      if (walletAddress && poolData) {
        const { data: positionData } = await supabase
          .from('staker_positions')
          .select('*')
          .eq('pool_id', poolData.id)
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        setStakerPosition(positionData);
      }
    } catch (error) {
      console.error('Error loading token details:', error);
    }
  };

  const handleWalletChanged = async (publicKey: string) => {
    console.log('=== HANDLING WALLET CHANGE ===');
    console.log('New wallet:', publicKey);
    console.log('Previous wallet:', walletAddress);

    // Force clear state immediately
    setWalletAddress(null);
    setWalletAnalytics(null);
    setIsAdmin(false);
    setIsLoading(true);

    // Add a small delay to ensure state clears
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log('Starting wallet analysis for:', publicKey);
      const analysis = await analyzeWallet(publicKey);
      console.log('=== ANALYSIS COMPLETE ===');
      console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

      const analytics: WalletAnalytics = {
        id: publicKey,
        wallet_address: publicKey,
        age_days: analysis.ageDays,
        transaction_count: analysis.transactionCount,
        tier: analysis.tier,
        max_buy_percent: analysis.maxBuyPercent,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      console.log('=== SETTING STATE ===');
      console.log('Analytics Object:', JSON.stringify(analytics, null, 2));

      setWalletAddress(publicKey);
      setWalletAnalytics(analytics);

      const { error } = await supabase.from('wallet_analytics').upsert(analytics, {
        onConflict: 'wallet_address',
      });

      if (error) {
        console.error('Error saving wallet analytics:', error);
      }
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      setWalletAddress(null);
      setWalletAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsLoading(true);
    setWalletAddress(null);
    setWalletAnalytics(null);
    setIsAdmin(false);

    try {
      const { solana } = window as any;

      if (!solana) {
        alert('Phantom wallet not found! Please install Phantom wallet extension.');
        setIsLoading(false);
        return;
      }

      if (!solana.isPhantom) {
        alert('Please use Phantom wallet.');
        setIsLoading(false);
        return;
      }

      if (solana.isConnected) {
        await solana.disconnect();
      }

      const response = await solana.connect({ onlyIfTrusted: false });
      const publicKey = response.publicKey.toString();

      console.log('=== WALLET CONNECTED ===');
      console.log('Wallet Address:', publicKey);

      const analysis = await analyzeWallet(publicKey);
      console.log('=== ANALYSIS COMPLETE ===');
      console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

      const analytics: WalletAnalytics = {
        id: publicKey,
        wallet_address: publicKey,
        age_days: analysis.ageDays,
        transaction_count: analysis.transactionCount,
        tier: analysis.tier,
        max_buy_percent: analysis.maxBuyPercent,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      console.log('=== SETTING STATE ===');
      console.log('Analytics Object:', JSON.stringify(analytics, null, 2));

      setWalletAddress(publicKey);
      setWalletAnalytics(analytics);

      const { error } = await supabase.from('wallet_analytics').upsert(analytics, {
        onConflict: 'wallet_address',
      });

      if (error) {
        console.error('Error saving wallet analytics:', error);
      }
    } catch (error: any) {
      if (error.code === 4001) {
        console.log('User rejected the connection');
      } else {
        console.error('Error connecting wallet:', error);
      }
      setWalletAddress(null);
      setWalletAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }

    setWalletAddress(null);
    setWalletAnalytics(null);
    setIsAdmin(false);
    if (activeView === 'admin') {
      setActiveView('home');
    }
  };

  const handleLaunchToken = async (formData: any) => {
    setIsLoading(true);

    try {
      const scheduledLaunch = formData.launchDelayMinutes > 0
        ? new Date(Date.now() + formData.launchDelayMinutes * 60000).toISOString()
        : null;

      const creationFeeLamports = Math.round(0.006 * 1e9);
      const creationFeeTransaction = `${Math.random().toString(36).substring(2, 15)}`;

      const { data: newToken, error } = await supabase
        .from('tokens')
        .insert({
          mint_address: `${Math.random().toString(36).substring(2, 15)}`,
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image_url: formData.imageUrl,
          twitter_url: formData.twitterUrl,
          telegram_url: formData.telegramUrl,
          creator_wallet: walletAddress || 'unknown',
          total_supply: Number(formData.totalSupply),
          virtual_sol_reserves: 0,
          virtual_token_reserves: Number(formData.totalSupply) * 0.8,
          is_graduated: false,
          dev_allocation_percent: 100,
          dev_unlock_rate: 1,
          sealed_lp: true,
          lp_burn_threshold: 50000,
          launch_delay_minutes: formData.launchDelayMinutes,
          scheduled_launch_at: scheduledLaunch,
          is_tradeable: formData.launchDelayMinutes === 0,
          current_price: 0.00001,
          creation_fee_paid: true,
          creation_fee_transaction: creationFeeTransaction,
          creation_fee_amount: creationFeeLamports,
        })
        .select()
        .single();

      if (error) throw error;

      if (newToken) {
        await supabase.from('staking_pools').insert({
          token_id: newToken.id,
        });

        await supabase.from('creation_fees').insert({
          token_id: newToken.id,
          creator_wallet: walletAddress || 'unknown',
          transaction_signature: creationFeeTransaction,
          fee_amount_lamports: creationFeeLamports,
          fee_amount_usd: 1.00,
        });
      }

      await loadTokens();
      setActiveView('home');
    } catch (error) {
      console.error('Error launching token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = async (type: 'buy' | 'sell', amount: number) => {
    if (!selectedToken || !walletAddress) return;

    setIsLoading(true);

    try {
      const price = selectedToken.current_price;
      const solAmount = amount * price;
      const totalFee = solAmount * 0.02;
      const platformFee = solAmount * 0.01;
      const creatorFee = solAmount * 0.005;
      const stakerFee = solAmount * 0.005;

      await supabase.from('transactions').insert({
        token_id: selectedToken.id,
        transaction_signature: `${Math.random().toString(36).substring(2, 15)}`,
        wallet_address: walletAddress,
        transaction_type: type,
        token_amount: amount,
        sol_amount: Math.round(solAmount * 1e9),
        price_per_token: price,
        total_fee: Math.round(totalFee * 1e9),
        platform_fee: Math.round(platformFee * 1e9),
        creator_fee: Math.round(creatorFee * 1e9),
        staker_fee: Math.round(stakerFee * 1e9),
      });

      const newProgress = selectedToken.bonding_curve_progress + (type === 'buy' ? 5 : -5);
      const newPrice = price * (type === 'buy' ? 1.05 : 0.95);
      const newMarketCap = newPrice * selectedToken.total_supply;

      const newVirtualSolReserves = (selectedToken.virtual_sol_reserves || 0) + (type === 'buy' ? solAmount : -solAmount);
      const newVirtualTokenReserves = (selectedToken.virtual_token_reserves || selectedToken.total_supply * 0.8) + (type === 'buy' ? -amount : amount);

      const updateData: any = {
        bonding_curve_progress: Math.max(0, Math.min(100, newProgress)),
        current_price: newPrice,
        volume_24h: selectedToken.volume_24h + solAmount,
        market_cap: newMarketCap,
        virtual_sol_reserves: newVirtualSolReserves,
        virtual_token_reserves: newVirtualTokenReserves,
      };

      if (!selectedToken.is_graduated && newMarketCap >= 50000) {
        const bundlePlatformFee = 100;
        const remainingSol = newVirtualSolReserves - bundlePlatformFee;

        updateData.is_graduated = true;
        updateData.graduated_at = new Date().toISOString();
        updateData.dex_pool_address = `dex_${Math.random().toString(36).substring(2, 15)}`;

        await supabase.from('bundle_events').insert({
          token_id: selectedToken.id,
          market_cap_at_bundle: newMarketCap,
          sol_to_dex: remainingSol,
          platform_fee_collected: bundlePlatformFee,
          bundle_transaction: `bundle_${Math.random().toString(36).substring(2, 15)}`,
        });
      }

      await supabase
        .from('tokens')
        .update(updateData)
        .eq('id', selectedToken.id);

      if (stakingPool) {
        await supabase
          .from('staking_pools')
          .update({
            total_rewards_accumulated: stakingPool.total_rewards_accumulated + Math.round(stakerFee * 1e9),
          })
          .eq('id', stakingPool.id);
      }

      await loadTokens();
      const updatedToken = tokens.find((t) => t.id === selectedToken.id);
      if (updatedToken) setSelectedToken(updatedToken);
    } catch (error) {
      console.error('Error executing trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async (amount: number) => {
    if (!selectedToken || !walletAddress || !stakingPool) return;

    setIsLoading(true);

    try {
      if (stakerPosition) {
        await supabase
          .from('staker_positions')
          .update({
            staked_amount: stakerPosition.staked_amount + amount,
          })
          .eq('id', stakerPosition.id);
      } else {
        await supabase.from('staker_positions').insert({
          pool_id: stakingPool.id,
          wallet_address: walletAddress,
          staked_amount: amount,
        });
      }

      await supabase
        .from('staking_pools')
        .update({
          total_staked: stakingPool.total_staked + amount,
        })
        .eq('id', stakingPool.id);

      await loadTokenDetails(selectedToken.id);
    } catch (error) {
      console.error('Error staking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (amount: number) => {
    if (!selectedToken || !stakerPosition || !stakingPool) return;

    setIsLoading(true);

    try {
      await supabase
        .from('staker_positions')
        .update({
          staked_amount: Math.max(0, stakerPosition.staked_amount - amount),
        })
        .eq('id', stakerPosition.id);

      await supabase
        .from('staking_pools')
        .update({
          total_staked: Math.max(0, stakingPool.total_staked - amount),
        })
        .eq('id', stakingPool.id);

      await loadTokenDetails(selectedToken.id);
    } catch (error) {
      console.error('Error unstaking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!stakerPosition) return;

    setIsLoading(true);

    try {
      await supabase
        .from('staker_positions')
        .update({
          rewards_earned: 0,
          last_claim_time: new Date().toISOString(),
        })
        .eq('id', stakerPosition.id);

      await loadTokenDetails(selectedToken!.id);
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasEnvError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-red-500 rounded-xl p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h1>
          <p className="text-slate-300 mb-4">
            The application is missing required environment variables. Please configure the following in Vercel:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-2 mb-6">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-slate-500 text-sm">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onNavigateToAdmin={() => setActiveView('admin')}
        isAdmin={isAdmin}
      />

      {walletAddress && walletAnalytics && !isLoading && (
        <div className="fixed top-24 right-6 z-40 w-80">
          <WalletTierWidget
            key={walletAnalytics.wallet_address}
            walletAnalytics={walletAnalytics}
            totalSupply={selectedToken?.total_supply}
          />
        </div>
      )}

      {walletAddress && !walletAnalytics && isLoading && (
        <div className="fixed top-24 right-6 z-40 w-80">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <p className="text-center text-slate-400 text-sm mt-2">Analyzing wallet...</p>
          </div>
        </div>
      )}

      <main>
        {activeView === 'home' && (
          <>
            <section className="py-20 px-4">
              <div className="container mx-auto max-w-6xl text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full mb-6">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    Transparent Fair Rules
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Fair Launch Platform
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                    Built to Fight Scams
                  </span>
                </h1>

                <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
                  Launch tokens with built-in anti-scam features. Per-wallet caps, dev vesting, sealed
                  LP, and delayed launches. Same rules for everyone.
                </p>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setActiveView('launch')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105"
                  >
                    Launch a Token
                  </button>
                  <a
                    href="#faq"
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl transition-all border border-slate-700"
                  >
                    See Fair Rules
                  </a>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {totalVolume > 0
                        ? totalVolume >= 1000000
                          ? `$${(totalVolume / 1000000).toFixed(2)}M`
                          : totalVolume >= 1000
                          ? `$${(totalVolume / 1000).toFixed(1)}K`
                          : `$${totalVolume.toFixed(2)}`
                        : '$0'}
                    </div>
                    <div className="text-xs text-slate-400">Total Volume</div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <Shield className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{tokens.length}</div>
                    <div className="text-xs text-slate-400">Active Tokens</div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">2%</div>
                    <div className="text-xs text-slate-400 mb-2">Total Trading Fee</div>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <div>1% Platform</div>
                      <div>0.5% Creators</div>
                      <div>0.5% Stakers</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="tokens" className="py-16 px-4 bg-slate-900/50">
              <div className="container mx-auto max-w-6xl">
                <h2 className="text-3xl font-bold text-white mb-8">Active Launches</h2>

                {tokens.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No tokens launched yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tokens.map((token) => (
                      <TokenCard
                        key={token.id}
                        token={token}
                        onClick={() => {
                          setSelectedToken(token);
                          setActiveView('token');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section id="faq">
              <FairLaunchRules />
            </section>
          </>
        )}

        {activeView === 'launch' && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-2xl">
              <button
                onClick={() => setActiveView('home')}
                className="text-slate-400 hover:text-white mb-6 transition-colors"
              >
                ← Back to Home
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Launch Your Token</h2>
                <p className="text-slate-400">
                  Create a fair launch with built-in anti-scam protections
                </p>
              </div>

              <LaunchTokenForm onSubmit={handleLaunchToken} isLoading={isLoading} />
            </div>
          </section>
        )}

        {activeView === 'token' && selectedToken && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-7xl">
              <button
                onClick={() => {
                  setActiveView('home');
                  setSelectedToken(null);
                }}
                className="text-slate-400 hover:text-white mb-6 transition-colors"
              >
                ← Back to Launches
              </button>

              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                  {selectedToken.image_url ? (
                    <img
                      src={selectedToken.image_url}
                      alt={selectedToken.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                      {selectedToken.symbol.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedToken.name}</h2>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="font-mono">{selectedToken.symbol}</span>
                    <span>•</span>
                    <span className="text-xs">
                      {selectedToken.creator_wallet.slice(0, 4)}...
                      {selectedToken.creator_wallet.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <CandlestickChart
                  tokenId={selectedToken.id}
                  currentPrice={selectedToken.current_price}
                  marketCap={selectedToken.market_cap}
                  totalSupply={selectedToken.total_supply}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <TradingInterface
                  token={selectedToken}
                  walletAnalytics={walletAnalytics}
                  onTrade={handleTrade}
                  isLoading={isLoading}
                />

                {stakingPool && (
                  <StakingPanel
                    pool={stakingPool}
                    position={stakerPosition}
                    tokenSymbol={selectedToken.symbol}
                    onStake={handleStake}
                    onUnstake={handleUnstake}
                    onClaim={handleClaimRewards}
                    isLoading={isLoading}
                  />
                )}
              </div>

              {clusters.length > 0 && <BubbleMap clusters={clusters} tokenId={selectedToken.id} />}
            </div>
          </section>
        )}

        {activeView === 'admin' && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-4xl">
              <button
                onClick={() => setActiveView('home')}
                className="text-slate-400 hover:text-white mb-6 transition-colors"
              >
                ← Back to Home
              </button>

              <AdminPanel isAdmin={isAdmin} walletAddress={walletAddress} />
            </div>
          </section>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 mt-16">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-slate-400 text-sm">
            Program trades start at 1.00% fee, scheduled to reduce to 0.10% over time.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Normal transfers are not charged by the platform.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
