var express = require('express');
var router = express.Router();
var testData;
var MongoClient = require('mongodb').MongoClient;
var DB;

console.log('users.jsが呼び出されましたよ'); //これはmyapp起動時に１回しか表示されない。

// フォーマット　　mongodb://[hostname]/[データベース名]
// ちなみに、データベースの保存場所は /var/lib/mongodb
var url = "mongodb://localhost:27017/mydb";
MongoClient.connect(url, (error, db) => {
  //ここもmyapp起動時に１回しか表示されない。
  if (error) { 
    console.log("MongoDBへの接続失敗"); 
  } else {
    console.log("MongoDBへの接続成功");
    DB = db;
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
    var collection = DB.collection("mondaishu");
        collection.find().toArray( function (err, documents) {
          if (err) throw { err };
          res.send(documents); // Mondaishu.jsのsuperAgentへの返信
        });
});

/* 大幅書き直し前（データベースから取得したドキュメント全体を１行ずつ区切ってconsoleに表示）
router.get('/', function(req, res, next) {
  var collection = DB.collection("mondaishu");
      collection.find().toArray( function (err, documents) {
        if (err) throw { err };
        for (var doc of documents) {
          console.log("問題"+doc.no+":"+doc.question); 
          //console.log(doc._id); //_idをnameやxにしたら、nameやxがないレコード（ドキュメント）はundefinedになる。
      };
    });
  //DB.close(); //これを有効にすると、ページをリロードしたらNode.jsが落ちる。そりゃそうだ。
  //res.send('このメッセージはuser.jsが出している');
  res.send([{ no: 33,  type: "YesNo",  level: 1,   question: "小テストは嫌いか？",  ans: "Y" }]);
});
*/

module.exports = router;

/* ちなみに、MongoDB上のデータベースは、
　データベース名：mydb
  コレクション名: mondaishu
  コレクションの中身
  { no: 10,  type: "YesNo",  level: 1,   question: "TCPのTはTransport？",  ans: "N" }
  { no: 11,  type: "YesNo",  level: 1,   question: "TCPは信頼性を提供する？",  ans: "Y" }
  { no: 12,  type: "YesNo",  level: 1,   question: "IPは第３層のプロトコル？",  ans: "Y" }
  となっている。
*/