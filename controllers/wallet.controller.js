const { sendError, sendCreated } = require('../utils/response');
const secp = require('@noble/secp256k1');
const { hmac } = require('@noble/hashes/hmac.js');
const { sha256 } = require('@noble/hashes/sha2.js');

// Configure hash functions for sync methods
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);
secp.hashes.sha256 = sha256;

const createWallet = (req, res) => {
    try {
        // Generate key pair using @noble/secp256k1
        const privateKeyBytes = secp.utils.randomSecretKey();
        const privateKeyHex = Array.from(privateKeyBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        const publicKeyBytes = secp.getPublicKey(privateKeyBytes, false); // false = uncompressed
        
        // Remove 0x04 prefix from uncompressed public key
        const publicKeyHex = publicKeyBytes.slice(1).reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');

        sendCreated(res, {
            publicKey: publicKeyHex,
            privateKey: privateKeyHex,
            message: 'New wallet created successfully'
        });
    } catch (error) {
        console.error('Wallet creation error:', error);
        sendError(res, 'Failed to create wallet', 500);
    }
};



module.exports = {
    createWallet
};
