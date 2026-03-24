import React, { useState, useEffect } from 'react';
import { createWallet, fetchBalance } from '../api/blockchain.api';
import './Wallet.css';

const Wallet = ({ onRefresh }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load wallets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('wallets');
    if (stored) {
      try {
        setWallets(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load wallets:', err);
      }
    }
  }, []);

  // Save wallets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  // Fetch balances for all wallets when component mounts or onRefresh is called
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchWalletBalances = async () => {
      if (wallets.length === 0) return;

      try {
        const updatedWallets = await Promise.all(
          wallets.map(async (wallet) => {
            try {
              const response = await fetchBalance(wallet.publicKey); 
 
              const balance = response?.balance || 0;
              return { ...wallet, balance: balance };
            } catch (err) {
              console.error(`Failed to fetch balance for wallet ${wallet.id}:`, err);
              return { ...wallet, balance: 0 };
            }
          })
        );
        setWallets(updatedWallets);
      } catch (err) {
        console.error('Failed to fetch wallet balances:', err);
      }
    };

    fetchWalletBalances();
  }, [onRefresh]);

  const handleCreateWallet = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await createWallet();
 
      const newWallet = {
        id: Date.now().toString(),
        address: response.publicKey,
        publicKey: response.publicKey,
        privateKey: response.privateKey,
        createdAt: new Date().toISOString(),
      };
      
      setWallets([...wallets, newWallet]); 
      
      // Refresh to update balances
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.log("err:", err)
      setMessage('Failed to create wallet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWallet = (walletId) => {
    setWallets(wallets.filter(w => w.id !== walletId));
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
  };

  const handleRefreshBalance = async (walletId) => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) return;

      const response = await fetchBalance(wallet.publicKey); 
 
      const balance = response?.balance || 0;
      
      setWallets(wallets.map(w => 
        w.id === walletId ? { ...w, balance: balance } : w
      ));
    } catch (err) {
      console.error(`Failed to refresh balance for wallet ${walletId}:`, err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  return (
    <div className="wallet-panel">
      <div className="panel-header">
        <h2 className="panel-title">Wallets</h2>
        <button 
          className="create-wallet-btn" 
          onClick={handleCreateWallet}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Wallet'}
        </button>
      </div>

      {message && (
        <div className={`wallet-message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="wallets-list">
        {wallets.length === 0 ? (
          <div className="empty-state">
            <p>No wallets created yet</p>
            <p className="hint">Click "Create Wallet" to generate a new wallet</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div key={wallet.id} className="wallet-row">
              <span className="wallet-name">Wallet #{wallets.indexOf(wallet) + 1}</span>
              <span className="wallet-divider">|</span>
              <span className="wallet-address" title={wallet.publicKey}>
                {formatAddress(wallet.publicKey)}
              </span>
              <span className="wallet-divider">|</span>
              <span className="wallet-balance">{wallet.balance || 0} Coins</span>
              <span className="wallet-divider">|</span>
              <button 
                className="refresh-balance-btn" 
                onClick={() => handleRefreshBalance(wallet.id)}
                title="Refresh balance"
              >
                Refresh
              </button>
              <span className="wallet-divider">|</span>
              <button 
                className="copy-btn-text" 
                onClick={() => handleCopyAddress(wallet.publicKey)}
                title="Copy address"
              >
                Copy Address
              </button>
              <span className="wallet-divider">|</span>
              <button 
                className="remove-wallet-btn" 
                onClick={() => handleRemoveWallet(wallet.id)}
                title="Remove wallet"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wallet;