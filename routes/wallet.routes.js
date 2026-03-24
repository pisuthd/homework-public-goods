const { Router } = require('express');
const { createWallet } = require('../controllers/wallet.controller');

const router = Router();

// No writeLimiter since this doesn't modify blockchain state
router.post('/', createWallet);

module.exports = router;
