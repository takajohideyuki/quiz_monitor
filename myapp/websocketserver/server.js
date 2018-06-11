var http = require('http');

//リクエストがあったときはmyHandlerが呼ばれる
//var server = http.createServer(myHandler);
var server = http.createServer();
var io = require('socket.io').listen(server);
//var io = require('socket.io').listen(8080);
server.listen(8080);
console.log('WebSocketサーバが起動しました');

var redis = require("redis");
var client4dataAccess = redis.createClient('6379', 'localhost');

client4dataAccess.on("connect", () => {
    console.log("RedisDBへの接続完了");
});

client4dataAccess.on("error", (err) => {
    console.log("RedisDBへの接続に失敗しました");
});

let teacherSID = undefined;

// 引数のsocketは接続してくるクライアント１つに対して１つ作成されると思う。
// そして、クライアントと接続するたびに、そのそれぞれのsocketがコールバック関数の引数として渡ってくるので
//  そのsocketに対してfunction (socket) {} 内の処理（イベントハンドラの割り当て）をしていると思う。
io.sockets.on('connection', function (socket) {
    console.log('WebSocketサーバに接続がありました。このソケットIDは', socket.id);

    //Server To Client
    //emitの第２引数は他のサイトを見てとりあえずオブジェクトにした。
    //msgは単なる文字列なのでmsgをそのまま送ってもいいはず。
    let msg = '小テスト頑張って下さい';
    socket.emit("S2C", { value: msg });

    socket.on('login', function (data, res) {
        if (data === 'Teacher') teacherSID = socket.id;
        console.log('ユーザー' + data + 'がログインしました');
        res('ユーザー' + data + 'がログインしました');
    });


    socket.on('kaitou-event', function (data) {
        //console.log('学生から「' + JSON.stringify(data) + '」を受信しました');
        // 教師への送信
        if (teacherSID !== undefined) {
            // 学生iPadから受信したJSON形式のdataをそのまま教師iPadのD3.jsに送っている。
            socket.to(teacherSID).emit('C2T', data);
        };
        // ここからRedisへの書き込みルーチン
        client4dataAccess.rpush('answers', JSON.stringify(data));
    });

    socket.on('T2N2R', function (data) {
        if (data.command === 'ClearRedisDB') { client4dataAccess.del('answers'); }
        else if (data.command === 'SendMeAllRedisData') {
            client4dataAccess.lrange('answers', 0, -1, function (err, replies) {

                if (teacherSID !== undefined) {
                    // ここで受信するrepliesは配列なので注意。
                    // また、replies配列のそれぞれの要素はJSON.stringifyされているので注意。
                    io.sockets.to(teacherSID).emit('R2N2TbyArr', replies);
                }
            });
        }
    });

});
