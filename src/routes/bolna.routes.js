const express = require('express');
const { handleBolnaWebhook } = require('../controllers/bolna.controller');

const bolnaRouter = express.Router();

bolnaRouter.post('/bolna', handleBolnaWebhook);

module.exports = {
  bolnaRouter
};
