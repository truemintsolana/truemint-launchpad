import { Wallet, Settings } from 'lucide-react';

type HeaderProps = {
  walletAddress: string | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onNavigateToAdmin?: () => void;
  isAdmin?: boolean;
};

function TrueMintLogo() {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-xl opacity-20 blur-lg"></div>
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 rounded-xl p-2 w-12 h-12 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <text
            x="50"
            y="70"
            fontFamily="Arial, sans-serif"
            fontSize="72"
            fontWeight="900"
            fill="url(#tmGradient)"
            textAnchor="middle"
            letterSpacing="-8"
          >
            TM
          </text>
          <text
            x="50"
            y="70"
            fontFamily="Arial, sans-serif"
            fontSize="72"
            fontWeight="900"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            textAnchor="middle"
            letterSpacing="-8"
            opacity="0.6"
          >
            TM
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function Header({ walletAddress, onConnectWallet, onDisconnectWallet, onNavigateToAdmin, isAdmin }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrueMintLogo />
            <div>
              <h1 className="text-xl font-bold text-white">TrueMint</h1>
              <p className="text-xs text-slate-400">Fair Launch Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => window.location.hash = ''} className="text-slate-300 hover:text-white transition-colors">
              Home
            </button>
            <button onClick={() => window.location.hash = 'launch'} className="text-slate-300 hover:text-white transition-colors">
              Launch
            </button>
            <button onClick={() => window.location.hash = 'tokens'} className="text-slate-300 hover:text-white transition-colors">
              Launches
            </button>
            <button onClick={() => window.location.hash = 'faq'} className="text-slate-300 hover:text-white transition-colors">
              FAQ
            </button>
            {isAdmin && onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Admin
              </button>
            )}
          </nav>

          {walletAddress ? (
            <div className="relative group">
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
              </button>
              <button
                onClick={onDisconnectWallet}
                className="absolute top-full mt-1 right-0 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 whitespace-nowrap text-sm shadow-lg border border-slate-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
