const crypto = require('crypto');
const secp = require('@noble/secp256k1');
const { hmac } = require('@noble/hashes/hmac.js');
const { sha256 } = require('@noble/hashes/sha2.js');

// Configure hash functions for sync methods
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);
secp.hashes.sha256 = sha256;

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class Transaction {
  constructor(fromAddress, toAddress, amount, timestamp = null) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = timestamp || Date.now();
    this.signature = '';
    this.publicKey = '';
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  attachSignature(signature, publicKey) {
    this.signature = signature;
    this.publicKey = publicKey;
  }

  isValid() {
    // Mining rewards don't require signatures 
    if (!this.fromAddress) {
      return true;
    }

    if (!this.signature || !this.publicKey) {
      throw new Error('Transaction is not signed');
    }

    try {
      // Convert hex strings to Uint8Array
      const signatureBytes = new Uint8Array(
        this.signature.match(/.{1,2}/g).map(b => parseInt(b, 16))
      );
      // Add 0x04 prefix for full public key
      const fullPublicKey = '04' + this.publicKey;
      const publicKeyBytes = new Uint8Array(
        fullPublicKey.match(/.{1,2}/g).map(b => parseInt(b, 16))
      );
      const messageBytes = new Uint8Array(
        this.calculateHash().match(/.{1,2}/g).map(b => parseInt(b, 16))
      );

      // Verify signature using @noble/secp256k1
      return secp.verify(signatureBytes, messageBytes, publicKeyBytes, { prehash: false });
    } catch (err) {
      console.error('Signature verification failed:', err);
      return false;
    }
  }
}

class Blockchain {
  constructor(difficulty, miningReward) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty || 2;
    this.pendingTransactions = [];
    this.miningReward = miningReward || 100;
  }

  createGenesisBlock() {
    return new Block(Date.now(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    // Verify sender has sufficient balance
    const senderBalance = this.getBalanceOfAddress(transaction.fromAddress);
    if (senderBalance < transaction.amount) {
      throw new Error(`Insufficient balance.`);
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) balance -= trans.amount;
        if (trans.toAddress === address) balance += trans.amount;
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (!current.hasValidTransactions()) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }

    return true;
  }

  getAllTransactions() {
    return this.chain.flatMap((block) => block.transactions);
  }
}

module.exports = { Blockchain, Block, Transaction };
