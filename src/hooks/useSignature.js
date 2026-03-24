import { useState } from 'react';
import { signAsync } from '@noble/secp256k1';

const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

const calculateHash = (fromAddress, toAddress, amount, timestamp) => { 
  const data = `${fromAddress}${toAddress}${amount}${timestamp}`;
  const hashBuffer = new TextEncoder().encode(data);
  return crypto.subtle.digest('SHA-256', hashBuffer).then(buffer => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });
};

const useSignature = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signTransaction = async (fromAddress, toAddress, amount, privateKey) => {
    setLoading(true);
    setError(null);

    try {
      // Create timestamp and calculate hash
      const timestamp = Date.now();
      const hash = await calculateHash(fromAddress, toAddress, amount, timestamp);

      // Sign transaction with noble-secp256k1
      const signature = await signAsync(
        hexToBytes(hash),
        hexToBytes(privateKey),
        { prehash: false }
      );

      // Convert signature to hex format
      const signatureHex = Array.from(signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        signature: signatureHex,
        timestamp
      };
    } catch (err) {
      setError(err.message || 'Failed to sign transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    signTransaction,
    loading,
    error
  };
};

export default useSignature;
