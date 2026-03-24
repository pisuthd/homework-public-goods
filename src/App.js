import React, { useState, useEffect } from 'react';
import './App.css';

import BlockchainViewer from './components/BlockchainViewer';
import TransactionForm from './components/TransactionForm';
import StatsPanel from './components/StatsPanel';
import Wallet from './components/Wallet';
import Header from './components/Header';

import useBlockchain from './hooks/useBlockchain';
import { mineBlock } from './api/blockchain.api';

function App() {
  const { chain, stats, loading, error, refresh } = useBlockchain();
  const [mineError, setMineError] = useState('');

  const handleMine = async () => {
    try {
      // Get first wallet from localStorage for mining reward
      const wallets = JSON.parse(localStorage.getItem('wallets') || '[]');
      
      if (wallets.length === 0) {
        setMineError('Please create a wallet first before mining');
        return;
      }

      // Use first wallet's public key as mining reward address
      const miningRewardAddress = wallets[0].publicKey;
      setMineError('');
      
      await mineBlock(miningRewardAddress);
      await refresh();
    } catch (err) {
      console.error('Mining failed:', err.message);
      setMineError(err.message || 'Mining failed');
    }
  };

  // Clear mine error when transactions are added or blockchain refreshes
  useEffect(() => {
    if (error || mineError) {
      const timer = setTimeout(() => setMineError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, mineError]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading Blockchain...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="app-container">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        {mineError && (
          <div className="error-banner">
            <p>{mineError}</p>
          </div>
        )}

        <div className="main-content">
          <div className="left-panel">
            <StatsPanel stats={stats} onMine={handleMine} />
            <TransactionForm onTransactionAdded={refresh} />
          </div>

          <div className="right-panel">
            <BlockchainViewer blockchain={chain} />
            <Wallet onRefresh={refresh} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
