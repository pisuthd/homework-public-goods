const { blockchain, Transaction } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');

const addTransaction = (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, timestamp, signature, publicKey } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    if (!signature || !publicKey) {
      return sendError(res, 'Transaction must be signed before submitting', 400);
    }

    if (!timestamp) {
      return sendError(res, 'Transaction timestamp is required', 400);
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount),
      timestamp    // preserve original timestamp so hash matches
    );

    transaction.attachSignature(signature, publicKey);

    if (!transaction.isValid()) {
      return sendError(res, 'Invalid transaction signature', 400);
    }

    blockchain.addTransaction(transaction);

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction: {
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };
