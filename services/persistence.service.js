/**
 * Blockchain Persistence Service
 * 
 * Handles saving, loading, and clearing blockchain state to/from disk.
 * 
 * Storage Format (blockchain.json):
 * {
 *   "chain": [
 *     {
 *       "timestamp": 1234567890,
 *       "transactions": [...],
 *       "previousHash": "0",
 *       "nonce": 0,
 *       "hash": "abc123..."
 *     }
 *   ],
 *   "pendingTransactions": [...],
 *   "difficulty": 2,
 *   "miningReward": 100
 * }
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const STORAGE_FILE = path.join(__dirname, '..', 'blockchain.json');

/**
 * Loads blockchain state synchronously from disk
 * Used during module initialization when async/await is not available
 * @returns {Object|null} The saved blockchain state or null if file doesn't exist or is invalid
 */
function loadSync() {
  try {
    const data = fsSync.readFileSync(STORAGE_FILE, 'utf8');
    const parsed = JSON.parse(data);
    logger.info('Blockchain state loaded from disk (sync)');
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - this is expected on first run
      logger.debug('No saved blockchain state found, starting fresh (sync)');
      return null;
    }
    
    if (error instanceof SyntaxError) {
      // Invalid JSON - corrupted file
      logger.warn('Saved blockchain state is corrupted, starting fresh (sync)');
      return null;
    }
    
    // Other file I/O errors
    logger.error(`Failed to load blockchain state (sync): ${error.message}`);
    return null;
  }
}

/**
 * Serializes and writes blockchain state to disk
 * @param {Blockchain} blockchain - The blockchain instance to save
 * @returns {Promise<void>}
 */
async function save(blockchain) {
  try {
    const state = {
      chain: blockchain.chain.map(block => ({
        timestamp: block.timestamp,
        transactions: block.transactions.map(tx => ({
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          amount: tx.amount,
          timestamp: tx.timestamp,
          signature: tx.signature,
          publicKey: tx.publicKey
        })),
        previousHash: block.previousHash,
        nonce: block.nonce,
        hash: block.hash
      })),
      pendingTransactions: blockchain.pendingTransactions.map(tx => ({
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        amount: tx.amount,
        timestamp: tx.timestamp,
        signature: tx.signature,
        publicKey: tx.publicKey
      })),
      difficulty: blockchain.difficulty,
      miningReward: blockchain.miningReward
    };

    await fs.writeFile(STORAGE_FILE, JSON.stringify(state, null, 2), 'utf8');
    logger.info('Blockchain state saved to disk');
  } catch (error) {
    logger.error(`Failed to save blockchain state: ${error.message}`);
    // Re-throw to let caller handle critical failures
    throw error;
  }
}

/**
 * Reads and deserializes saved blockchain state
 * @returns {Promise<Object|null>} The saved blockchain state, or null if no file exists or is invalid
 */
async function load() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    logger.info('Blockchain state loaded from disk');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - this is expected on first run
      logger.debug('No saved blockchain state found, starting fresh');
      return null;
    }
    
    if (error instanceof SyntaxError) {
      // Invalid JSON - corrupted file
      logger.warn('Saved blockchain state is corrupted, starting fresh');
      return null;
    }
    
    // Other file I/O errors
    logger.error(`Failed to load blockchain state: ${error.message}`);
    return null;
  }
}

/**
 * Deletes the saved blockchain state from disk
 * @returns {Promise<void>}
 */
async function clear() {
  try {
    await fs.unlink(STORAGE_FILE);
    logger.info('Blockchain state cleared from disk');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - that's fine
      logger.debug('No saved blockchain state to clear');
      return;
    }
    logger.error(`Failed to clear blockchain state: ${error.message}`);
    // Re-throw to let caller handle critical failures
    throw error;
  }
}

module.exports = {
  save,
  load,
  loadSync,
  clear
};
