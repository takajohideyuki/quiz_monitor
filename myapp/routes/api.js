var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

function isLogined(req, res, next) {
  if (req.isAuthenticated()) {  // 認証済
    return next(); // 単に next(); と書いても動くぞ。
  }
  else {
    res.redirect('/login');  // まだログインしていない場合（この場合、認証に失敗する）場合はログイン画面に遷移
  }
}

//集合を表すのにsetでなく、listという単語を使ったのはset/getのsetと間違えそうだから。
router.get('/mondai/get/list/:mondai_no(\\d+)', function (req, res) {
  // 認証をかけたい場合はこちらを使う 
  //router.get('/mondai/get/list/:mondai_no(\\d+)', isLogined, function (req, res) {
  var mondai_list = [];
  // ここは同期読み込みのfs.readFileSyncを使う手もある。
  fs.readFile(path.join(__dirname, '../public/MONDAISHU/qset' + req.params.mondai_no + '.json'), 'utf8', function (err, data1) {
    //var data_arr = data.split(/\r\n|\r|\n/);  
    var qlist_arr = JSON.parse(data1).qlist;

    fs.readFile(path.join(__dirname, '../public/MONDAISHU/AllMondai.json'), 'utf8', function (err, data2) {
      var mondai_arr = JSON.parse(data2).Type4; //H29M12D29にType1からType4に変更した。Type4は問題だけでなく正解も含むので注意。
      qlist_arr.forEach(function (mondai_no, index1) {
        mondai_arr.forEach(function (mondai_obj, index2) {
          if (mondai_no == mondai_obj.no) mondai_list.push(mondai_obj);
        });
      });
      res.send(mondai_list); // fs.readFile()などは非同期で動くので、この場所に入れないとだめだ。
    });      // 上のmondai_listはH29M12D29より問題と正解を含む。AllMondai.jsonのType4を参考にせよ。
  });

  //console.log(mondai_list);  // fs.readFile()などは非同期で動くので、mondai_listが[]の状態でconsole.log()を実行してしまう。
  //res.send(mondai_list); // fs.readFile()などは非同期で動くので、ここに入れたら、readFileする前にreturnするようだ。
});


//--------- 学生のリストを取得するためのAPI ----------
router.get('/students/get/list/:students_no(\\d+)', function (req, res) {
  var mondai_list = [];
  fs.readFile(path.join(__dirname, '../public/STUDENTS/StudentsLists.json'), 'utf8', function (err, data1) {
    //stlistの後に引数のパラメータを合体させたものにアクセスするために以下のように[ ]を使用した。
    res.send(JSON.parse(data1)['stlist' + req.params.students_no]);
  });
});


module.exports = router;
