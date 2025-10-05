import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Transaction {
  id: string;
  wallet_address: string;
  token_id: string;
  created_at: string;
  token_amount: number;
  transaction_type: string;
}

interface WalletAnalytics {
  wallet_address: string;
  age_days: number;
  transaction_count: number;
  tier: number;
}

interface ClusterResult {
  cluster_id: string;
  wallet_addresses: string[];
  token_id: string;
  total_holdings: number;
  risk_score: number;
  detection_method: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token_id } = await req.json();

    if (!token_id) {
      return new Response(
        JSON.stringify({ error: "token_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("id, wallet_address, token_id, created_at, token_amount, transaction_type")
      .eq("token_id", token_id)
      .eq("transaction_type", "buy")
      .order("created_at", { ascending: true });

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ clusters: [], message: "No transactions found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const walletAddresses = [...new Set(transactions.map((t: Transaction) => t.wallet_address))];

    const { data: analytics, error: analyticsError } = await supabase
      .from("wallet_analytics")
      .select("wallet_address, age_days, transaction_count, tier")
      .in("wallet_address", walletAddresses);

    if (analyticsError) throw analyticsError;

    const analyticsMap = new Map<string, WalletAnalytics>();
    (analytics || []).forEach((a: WalletAnalytics) => {
      analyticsMap.set(a.wallet_address, a);
    });

    const clusters: Map<string, Set<string>> = new Map();
    const walletToCluster: Map<string, string> = new Map();
    let clusterCounter = 0;

    const TIME_WINDOW_MS = 5 * 60 * 1000;
    const NEW_WALLET_THRESHOLD_DAYS = 30;
    const NEW_WALLET_THRESHOLD_TX = 30;

    const sortedTxs = [...transactions].sort(
      (a: Transaction, b: Transaction) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (let i = 0; i < sortedTxs.length; i++) {
      const tx1 = sortedTxs[i];
      const wallet1 = tx1.wallet_address;
      const analytics1 = analyticsMap.get(wallet1);

      if (!analytics1) continue;

      const isNew1 =
        analytics1.age_days < NEW_WALLET_THRESHOLD_DAYS ||
        analytics1.transaction_count < NEW_WALLET_THRESHOLD_TX;

      if (!isNew1) continue;

      let assignedCluster = walletToCluster.get(wallet1);

      for (let j = i + 1; j < sortedTxs.length; j++) {
        const tx2 = sortedTxs[j];
        const wallet2 = tx2.wallet_address;

        if (wallet1 === wallet2) continue;

        const analytics2 = analyticsMap.get(wallet2);
        if (!analytics2) continue;

        const isNew2 =
          analytics2.age_days < NEW_WALLET_THRESHOLD_DAYS ||
          analytics2.transaction_count < NEW_WALLET_THRESHOLD_TX;

        if (!isNew2) continue;

        const timeDiff =
          Math.abs(
            new Date(tx1.created_at).getTime() - new Date(tx2.created_at).getTime()
          );

        if (timeDiff <= TIME_WINDOW_MS) {
          if (!assignedCluster) {
            const existingCluster = walletToCluster.get(wallet2);
            if (existingCluster) {
              assignedCluster = existingCluster;
              walletToCluster.set(wallet1, assignedCluster);
              clusters.get(assignedCluster)?.add(wallet1);
            } else {
              assignedCluster = `cluster_${clusterCounter++}`;
              clusters.set(assignedCluster, new Set([wallet1, wallet2]));
              walletToCluster.set(wallet1, assignedCluster);
              walletToCluster.set(wallet2, assignedCluster);
            }
          } else {
            const existingCluster = walletToCluster.get(wallet2);
            if (existingCluster && existingCluster !== assignedCluster) {
              const oldClusterWallets = clusters.get(existingCluster);
              if (oldClusterWallets) {
                oldClusterWallets.forEach((w) => {
                  clusters.get(assignedCluster!)?.add(w);
                  walletToCluster.set(w, assignedCluster!);
                });
                clusters.delete(existingCluster);
              }
            } else if (!existingCluster) {
              clusters.get(assignedCluster)?.add(wallet2);
              walletToCluster.set(wallet2, assignedCluster);
            }
          }
        }
      }
    }

    const clusterResults: ClusterResult[] = [];
    
    for (const [clusterId, wallets] of clusters.entries()) {
      if (wallets.size < 2) continue;

      const walletArray = Array.from(wallets);
      const clusterTxs = transactions.filter((t: Transaction) =>
        walletArray.includes(t.wallet_address)
      );

      const totalHoldings = clusterTxs.reduce(
        (sum: number, t: Transaction) => sum + (t.transaction_type === "buy" ? t.token_amount : -t.token_amount),
        0
      );

      let riskScore = 0;

      if (wallets.size >= 10) riskScore += 0.4;
      else if (wallets.size >= 5) riskScore += 0.25;
      else if (wallets.size >= 3) riskScore += 0.15;

      const avgAge =
        walletArray.reduce(
          (sum, w) => sum + (analyticsMap.get(w)?.age_days || 0),
          0
        ) / wallets.size;
      const avgTx =
        walletArray.reduce(
          (sum, w) => sum + (analyticsMap.get(w)?.transaction_count || 0),
          0
        ) / wallets.size;

      if (avgAge < 7) riskScore += 0.3;
      else if (avgAge < 30) riskScore += 0.15;

      if (avgTx < 10) riskScore += 0.2;
      else if (avgTx < 30) riskScore += 0.1;

      const timestamps = clusterTxs.map((t: Transaction) => new Date(t.created_at).getTime());
      const timeSpread = Math.max(...timestamps) - Math.min(...timestamps);
      if (timeSpread < 60000) riskScore += 0.3;
      else if (timeSpread < 300000) riskScore += 0.15;

      riskScore = Math.min(riskScore, 1.0);

      clusterResults.push({
        cluster_id: clusterId,
        wallet_addresses: walletArray,
        token_id,
        total_holdings: Math.round(totalHoldings),
        risk_score: Math.round(riskScore * 100) / 100,
        detection_method: "Time-based transaction clustering of new wallets",
      });
    }

    await supabase.from("wallet_clusters").delete().eq("token_id", token_id);

    if (clusterResults.length > 0) {
      const { error: insertError } = await supabase
        .from("wallet_clusters")
        .insert(clusterResults);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        clusters_detected: clusterResults.length,
        clusters: clusterResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error detecting clusters:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
