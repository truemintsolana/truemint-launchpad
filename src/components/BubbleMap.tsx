import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { WalletCluster } from '../lib/supabase';

type BubbleMapProps = {
  clusters: WalletCluster[];
  tokenId: string;
};

type BubbleNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  walletCount: number;
  holdings: number;
  riskScore: number;
};

export default function BubbleMap({ clusters }: BubbleMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBubble, setSelectedBubble] = useState<BubbleNode | null>(null);
  const [bubbles, setBubbles] = useState<BubbleNode[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const nodes: BubbleNode[] = clusters.map((cluster, index) => {
      const holdings = cluster.total_holdings;
      const radius = Math.min(Math.max(Math.sqrt(holdings) * 2, 20), 80);

      const getRiskColor = (score: number) => {
        if (score >= 0.7) return '#ef4444';
        if (score >= 0.4) return '#f97316';
        return '#22c55e';
      };

      return {
        id: cluster.cluster_id,
        x: Math.random() * (width - radius * 2) + radius,
        y: Math.random() * (height - radius * 2) + radius,
        radius,
        color: getRiskColor(cluster.risk_score),
        walletCount: cluster.wallet_addresses.length,
        holdings,
        riskScore: cluster.risk_score,
      };
    });

    setBubbles(nodes);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((node, i) => {
        nodes.forEach((other, j) => {
          if (i !== j) {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = node.radius + other.radius + 10;

            if (distance < minDist) {
              const angle = Math.atan2(dy, dx);
              const overlap = minDist - distance;
              node.x -= Math.cos(angle) * overlap * 0.5;
              node.y -= Math.sin(angle) * overlap * 0.5;
            }
          }
        });

        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      });

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
          node.x - node.radius / 3,
          node.y - node.radius / 3,
          0,
          node.x,
          node.y,
          node.radius
        );
        gradient.addColorStop(0, node.color + '80');
        gradient.addColorStop(1, node.color + '40');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.walletCount.toString(), node.x, node.y);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [clusters]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = bubbles.find((bubble) => {
      const dx = bubble.x - x;
      const dy = bubble.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= bubble.radius;
    });

    setSelectedBubble(clicked || null);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Wallet Cluster Analysis
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Detects wallets potentially controlled by the same entity
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-400">Low Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">High Risk</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onClick={handleCanvasClick}
          className="w-full bg-slate-950 rounded-lg cursor-pointer"
        />

        {selectedBubble && (
          <div className="absolute top-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedBubble.color }}
              ></div>
              <h4 className="text-white font-semibold">Cluster Details</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Wallets</span>
                <span className="text-white font-medium">{selectedBubble.walletCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Holdings</span>
                <span className="text-white font-medium">
                  {selectedBubble.holdings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Score</span>
                <span className="text-white font-medium">
                  {(selectedBubble.riskScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {selectedBubble.riskScore >= 0.7 && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-start gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    High risk of coordinated manipulation. Multiple wallets show similar behavior
                    patterns.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <p className="text-xs text-purple-300">
          <span className="font-medium">Detection Method:</span> Analyzes wallet creation times,
          transaction patterns, and token purchase timing to identify potential clusters.
        </p>
      </div>
    </div>
  );
}
