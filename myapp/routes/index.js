var express = require('express');
var router = express.Router();
//var saiten_model = require('../models/saiten_model.js');

function isLogined(req, res, next) {
  if (req.isAuthenticated()) { //ログイン済み
    return next();
  }
  else {
    res.redirect('/login');
  }
}

router.get('/', isLogined, function (req, res) {
  res.redirect('/elearn');
});


module.exports = router;
