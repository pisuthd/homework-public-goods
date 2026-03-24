const { sendError, sendCreated } = require('../utils/response');
const crypto = require('crypto');

const createWallet = (req, res) => {
    try {
        
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: {
                type: 'spki',
                format: 'hex'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'hex'
            }
        });
 
        sendCreated(res, {
            publicKey,
            privateKey, 
            message: 'New wallet created successfully'
        });
    } catch (error) { 
        sendError(res, 'Failed to create wallet', 500);
    }
};



module.exports = {
    createWallet
};
