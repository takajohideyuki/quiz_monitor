var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('elearning/menu', {title: 'イーラーニングのページ', user: req.user.username}); 
});


router.get('/seiseki', function(req, res, next) {
    res.render('elearning/seiseki', {title: '成績表' });
  });


router.get('/siryou', function(req, res, next) {
res.render('elearning/siryou', {title: '授業資料' });
}); 

module.exports = router;

