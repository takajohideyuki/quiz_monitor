var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// Passport用に追加した。
var session = require('express-session');
var passport = require('passport');
// 以下のconnect-flashは使わなくても問題ないみたいなのでコメントアウトした。
// var flash = require('connect-flash'); //PassportでExpressのflash機能を使うために追加した

//ここでルーティングファイルの分割をやっていると思う. 
//ここで指定したものは下のapp.use()で使われる.
// require()の引数で指定したファイル内のexportsが = の左辺に代入されると思う。
var index = require('./routes/index');
var users = require('./routes/users');
//var siken = require('./routes/siken_route');
//var saiten = require('./routes/saiten_route');
var elearn = require('./routes/elearn');
var quiz = require('./routes/quiz');
var api = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// faviconを表示させるには、Safariのキャッシュをいったん空にする必要がある。
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'haruwa akebono',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());

// Passportは色々な認証系に対応しているが、とりあえず一番簡単なpassport-local認証を使うことにした。
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function (username, password, done) {
    if (
 // この部分ではユーザー認証をしている。GitHubにアップロードする版では削除した。
    ) {
      return done(null, false, { message: 'そんなユーザーいませんよ' }); // このmessageは下のinfo.message経由でsession.messageに入る。 
    }
    else if (
 // この部分ではユーザー認証をしている。GitHubにアップロードする版では削除した。
    ) {
      return done(null, false, { message: 'パスワードが間違っていますよ' }); // このmessageは下のinfo.message経由でsession.messageに入る。 
    }
    else {
      var userObj = {};
      if (username == "yamada") {
        userObj = {
          username: "yamada", //たぶんここのusernameはuserやnameなど他の文字列ではダメだと思う。
          firstName: "tarou",
          lastName: "yamada",
          id: 0
        };
      } else if ((username.substr(0, 2) == "st") || (username.substr(0, 1) == "n")) {
        userObj = {
          username: username,
          firstName: username + "First",
          lastName: username + "Last",
          id: parseInt(username.substr(2), 10)    // ２文字目から最後までを10進数の整数に変換
        };
      }
      return done(null, userObj);
    }
  }
));

passport.serializeUser(function (userObj, done) {
  done(null, userObj);
});

passport.deserializeUser(function (userObj, done) {
  done(null, userObj);
});

app.get('/login', function (req, res) {
  if (req.user !== undefined) { // 既にログインしている場合（req.userはreq.session.passport.userにマッピングされているようだ。）
    res.redirect('/elearn');
  }
  else { // まだログインしていない。
    var msg = req.session.message;
    if (msg == undefined) msg = ''; //(msg == undefined)になるのは、認証を経ずにいきなりloginページにアクセスした場合

    res.render('loginPage', {
      title: '通信ネットワーク工学科 E-learningシステムログインページ',
      errMsg: msg
    });
  }
});


app.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { //認証に成功したらuserオブジェクトは存在するので、この条件にマッチするのは認証失敗時。
      req.session.message = info.message; // done(null, false, { message: ... のmessageはinfo.messageに入ってる。 
      return res.redirect('/login');
    }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      delete req.session.message;     // ログインに成功した時点でエラー受け渡し用のsession.messageは消去しておくべき。
      return res.redirect('/elearn'); // ログインに成功のとき実行される
    });
  })(req, res, next);
});


app.get('/logout', function (req, res) {
  req.logout(); 
  res.render('logoutPage');
});


app.use('/', index);
app.use('/users', users);
// URLの/sikenにアクセスがあった場合は、var siken = require('./routes/siken');の部分を使うという指定
//app.use('/siken', siken);
//app.use('/saiten', saiten);
app.use('/elearn', elearn);
app.use('/quiz', quiz);
app.use('/api', api);

// ############# Passport用に挿入した部分はここまで　##################

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
