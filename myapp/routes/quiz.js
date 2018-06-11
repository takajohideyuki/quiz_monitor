var express = require('express');
var path = require('path');
var router = express.Router();

function isLogined(req, res, next) {
  if (req.isAuthenticated()) {  // 認証済
    return next(); // 単に next(); と書いても動くぞ。
  }
  else {
    res.redirect('/login');  // まだログインしていない場合（この場合、認証に失敗する）場合はログイン画面に遷移
  }
}

// route.getの最初の'/'はマウントポイント。２つ目以降は実行する関数で、いくつでも書ける。
router.get('/', isLogined, function (req, res) {
  res.render('select_quiz', {user: req.user.username});
});

router.get('/:mondai_no(\\d+)', isLogined, function (req, res) {
  // res.sendFile(path.join(__dirname, '../public', 'ReactSikenIndex.html')); // 認証済のとき実行される

  let q = '?qset='+req.params.mondai_no;
  console.log("who=" + req.user.username);
  let u = '&' + 'user=' + req.user.username;
  res.redirect('/ReactSikenIndex.html'+ q + u); 
});


module.exports = router;
