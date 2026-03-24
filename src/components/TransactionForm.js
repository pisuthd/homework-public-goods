import React, { useState } from 'react';
import useSignature from '../hooks/useSignature';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';

const TransactionForm = ({ onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    fromAddress: '',
    toAddress: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [message, setMessage] = useState(''); 
  const { signTransaction } = useSignature();

  const formatSignature = (signature) => {
    if (!signature) return '';
    return `${signature.substring(0, 8)}...${signature.substring(signature.length - 8)}`;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Step 1: Lookup wallet from localStorage
      const wallets = JSON.parse(localStorage.getItem('wallets') || '[]');
      const wallet = wallets.find(w => w.publicKey === formData.fromAddress || w.address === formData.fromAddress);
      
      if (!wallet) {
        throw new Error('Wallet not found for this address');
      }

      // Step 2: Sign transaction using useSignature hook
      const { signature, timestamp } = await signTransaction(
        formData.fromAddress,
        formData.toAddress,
        formData.amount,
        wallet.privateKey
      );

      // Show signing status and signature
      setSigning(true); 
      setMessage(`Signature: ${formatSignature(signature)}`);

      // Step 3: Add delay before submitting to backend
      await delay(2000);

      // Step 4: Submit to backend
      await addTransaction({
        fromAddress: formData.fromAddress,
        toAddress: formData.toAddress,
        amount: formData.amount,
        timestamp,
        signature,
        publicKey: wallet.publicKey
      });

      setMessage('Transaction added successfully!');
      setFormData({ fromAddress: '', toAddress: '', amount: '' });
      onTransactionAdded();
    } catch (err) {
      setMessage(err.message || 'Failed to add transaction');
      console.error(err);
    } finally {
      setLoading(false);
      setSigning(false);  
    }
  };

  return (
    <div className="transaction-form">
      <h2 className="panel-title">Create Transaction</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fromAddress">From Address</label>
          <input
            type="text"
            id="fromAddress"
            name="fromAddress"
            value={formData.fromAddress}
            onChange={handleChange}
            placeholder="e.g., 04a1b2c3d4e5f6..."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="toAddress">To Address</label>
          <input
            type="text"
            id="toAddress"
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            placeholder="e.g., 04f7e8d9c0b1a2..."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g., 100.00"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        {message && (
          <div className={`form-message ${signing ? 'signing' : message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
