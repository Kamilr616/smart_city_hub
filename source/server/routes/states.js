var express = require('express');
var router = express.Router();
var StateController = require('../controllers/state.controller');

var stateController = new StateController();

router.use('/', stateController.router);

module.exports = router;