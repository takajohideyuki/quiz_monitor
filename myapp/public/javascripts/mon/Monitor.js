import Request from 'superagent';
import { ETIME } from 'constants';

let D3andWebSocObj = null;

// startMonitorをexportしているのは、WebPackでbundle化し、monitor.htmlのonclickで使うため。
export function startMonitor(mondai_set_num, students_set_num) {
    if (mondai_set_num == "" || students_set_num == "")
        alert("問題セット番号と履修者セット番号を入力して下さい");
    else {
        let URL1 = 'http://           :3000/api/mondai/get/list/' + mondai_set_num;
        let URL2 = 'http://           :3000/api/students/get/list/' + students_set_num;

        if (D3andWebSocObj !== null) {
            D3andWebSocObj.getWebSocket().deleteConnection();
            D3andWebSocObj.getWebSocket = null;
            D3andWebSocObj.getD3Object().deleteGraph();
            D3andWebSocObj.getD3Object = null;
            D3andWebSocObj = null;
        }
        D3andWebSocObj = AsyncGetDATAandMakeD3and(URL1, URL2, RunD3, startWebSocket);
    }
}

// asyncAgentはSuperAgentの単なるラッパー関数
function asyncAgent(URL, fn) {
    Request
        .get(URL)
        .end(function (err, res) {
            if (res.ok) {
                fn(res.body);
            }
        });
}


// ここは、superagentが非同期関数なので簡単には書けない。
// このgetDATAandRunD3にはちょっと問題がある。url1からのデータ取得とurl2からのデータ取得は
// 平行して行えるのにここではurl1のデータ取得が終わってからurl2のデータ取得をしている。
// これを解決するには、今だったらES6から導入されたPromiseを使うのがベストだと思う。

// その後、以下の書き方には他にもまだ大きな問題があることが判明。
// これだとgetDATAandMakeD3関数はdataを取得する前にundefinedをreturnしてしまう。
// つまり、非同期関数がreturnで値を返すようにしていると大火傷する可能性がある。
// いずれPromiseを使ってnewでオブジェクトの取得が終了してからreturnするように書き直すべき。
/* function getDATAandMakeD3(url1, url2, D3Class) {
    asyncAgent(url1, function (data1) {
        asyncAgent(url2, function (data2) {
            return (new D3Class(data1, data2));
        });
    });
} */
// その後、「モニタリング開始」ボタンを押したら新規にD3Objectを作り直すようにした。
// しかし、（おそらくクロージャのために）学生の小テストの解答が古いD3ObjectとWebSocket通信
// してしまうという問題が起きた。（startWebSocket(d3obj)がD3Objectを引数にとるためだろう。）
// そのため、一旦、WebSocketとD3Objectを解放してやる必要が生じたため、returnで返すことにした。

function AsyncGetDATAandMakeD3and(url1, url2, D3Class, fn) {
    let D3Object;
    let websocket;
    // data1には、問題リストだけでなくqsetX.jsonで指定される問題番号、4択、正解などが全て返ってくる。
    // これは将来、D3.jsで、マウスが重なったら問題文や正解などが表示されるようにするため。
    asyncAgent(url1, function (data1) {
        asyncAgent(url2, function (data2) {
            D3Object = new D3Class(data1, data2);
            websocket = fn(D3Object);
            document.getElementById("clearButton").onclick = websocket.clearRedisDB;
            document.getElementById("getAllButton").onclick = websocket.getAllDataFromRedisDB;
        });
    });
    // asyncAgent(url2, function (data2) 中にreturn文を書いてしまったら、先に非同期関数が終了して
    // undefinedが返ってしまうのでreturn文はここに書く必要がある。（非同期は難しいね。）
    return {
        getD3Object: function () { return D3Object; },
        getWebSocket: function () { return websocket; }
    };
}


// ここからはWebSocket.jsから転記してきたもの
function startWebSocket(d3obj) {

    let socket = io.connect('http://           :8080/');

    socket.on('connect', function () {
        console.log('WebSocketの接続が完了しました in Monitor.js');
        // 第３引数は送達確認のためのもの
        // emitの第２引数は送信するデータ。この場合は'Teacher'を送信している。
        socket.emit('login', 'Teacher', function (data) {
            console.log('WebSocketサーバからログインのACK(' + data + ')が返ってきました');
        });
    });

    // 学生iPad　-> Node.js -> D3.jsで渡ってくるdata(JSON形式)を受信
    socket.on('C2T', function (data) {  // C2TはClient(学生) to Teacherの意味
        //console.log('学生iPadから『' + JSON.stringify(data) + '』を受信しました');
        d3obj.update(transFormat(data));
    });

    socket.on('R2N2TbyArr', function (dataArr) {
        d3obj.updateAll(dataArr);
    });

    // サーバからのメッセージを受信
    socket.on('S2C', function (data) {
        console.log('メッセージ『' + data + '』は学生向けなので無視するよ');
    });

    socket.on('disconnect', function () {
        socket.disconnect(); // 開発段階ではこれでいいが、運用段階では、自動再接続した方がいいのでコメントアウトする。
        //socket.close();    // disconnect()とclose()の違いはよくわからない。
        console.log('webSocketの接続が切れました');
    });

    return {
        clearRedisDB: function () {
            socket.emit("T2N2R", { command: "ClearRedisDB" });
        },

        getAllDataFromRedisDB: function () {
            // T2N2Rは Teacher -> Node -> Redis の意味
            socket.emit("T2N2R", { command: "SendMeAllRedisData" });
        },

        // 使わなくなったWebSocketオブジェクトを解放するための処理
        deleteConnection: function () {
            socket.disconnect();
            socket = null;
        }
    };
}

// 学生iPad　-> Node.js -> D3.jsで渡ってくるデータフォーマット(JSON)をD3.js用のフォーマットに変換
function transFormat(data) {
    let id = data.ID;
    let qnum = data.QNum;
    let ans;

    switch (data.Choice) {
        case "notSelected": ans = 0; break;
        case "choiceA": ans = 1; break;
        case "choiceB": ans = 2; break;
        case "choiceC": ans = 3; break;
        case "choiceD": ans = 4; break;
    }

    let torf = data.TorF;
    return { ID: id, QNum: qnum, Ans: ans, TorF: torf };
}

//===================== これより下はD3.js関連 =================================================
function RunD3(_qArr, _students) {

    let qlist = [];
    _qArr.forEach(function (mondaiObj) {
        qlist.push(Number(mondaiObj.no));
    });

    let numMondai = qlist.length;

    let mondaiNums = d3.range(1, numMondai + 1); //問題番号の配列[1,2,3,...,20]を作成。

    // var AnsColorScale = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00']; 
    var TorFColor = ['#FFFFFF', '#00FF00', '#FF0000'];

    // ブラウザ上で学生のデータを管理するための配列（連想配列）の作成と初期化。
    // 連想配列にしたのは、redisがKey-Value Store形式なので、将来的にこちらの方がいいと思ったから。
    // JavaScriptの連想配列は、配列と言いながら実装は単なるオブジェクトなので、初期化には[]ではなく{}を使う。
    var dataArrOfAllStudents = {};

    // 全学生のansArrとtorfArrを初期化
    _students.forEach(function (e) { // eはelementの意味。students配列の要素が入る。
        // let dataArr = (new Array(numMondai)).fill({ Ans:0, TorF:'M' })); のような書き方をすると配列の全ての要素が
        // 一つの { Ans:0, TorF:'M' } というオブジェクトを指してしまうのでダメ。
        let dataArr = (new Array(numMondai));
        // かといって、この時点ではdataArrの配列は中身がないので、dataArr.forEachでループは回せない。for文でループさせる。
        for (let i = 0; i < numMondai; i++) { dataArr[i] = { Ans: 0, TorF: 'M' }; }

        // 以下で、dataArrOfAllStudents.eとすると、eは文字列ではなく識別子として扱われるので注意。
        dataArrOfAllStudents[e] = dataArr;
    });


    var table = d3.select('body').append('table').attr("cellspacing", "0");
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    var terms = ['ID'].concat(mondaiNums); // termsは表の項目（表の１行目）の配列

    thead.append('tr')
        .selectAll('th')
        .data(terms)
        .enter()
        .append('th')
        .attr("width", "30")
        .text(function (d, i) { return d; }); // dにはterms配列の各要素が入る。

    tbody.selectAll('tr')
        .data(_students)
        .enter()
        .append('tr')
        .attr("id", function (who) { return who; }) // ここでtableの各行ごとに、DOMのidとしてstudentsの各要素をセットしている。#idでアクセスする。
        .selectAll('td')
        .data(function (who, i) { return [who].concat(dataArrOfAllStudents[who]); }) // [d].と書くと、要素dひとつの配列を生成して先頭に結合する。
        .enter()
        .append('td')
        .attr("align", "center")
        .style("background-color", function (d, i) {
            if (i == 0) return '#FFFFFF';
            else
                if (d.TorF == 'M') return TorFColor[0];
                else if (d.TorF == 'T') return TorFColor[1];
                else return TorFColor[2]; // d == 'F'
        })
        .text(function (d, i) { if (i == 0) return d; else return d.Ans; });


    // データ取得および内部データの書き換えサブルーチン
    // dataはJSON形式（具体的なフォーマットは上のtmpdata配列の１行）。
    function changeData(data) {
        // ブラウザ上で管理しているデータの書き換え
        let who = data.ID;
        let qnum = qlist.indexOf(data.QNum);

        dataArrOfAllStudents[who][qnum].Ans = data.Ans; // 意味的には (dataArrOfAllStudents[who])[qnum].Ans = data.Ans; 
        dataArrOfAllStudents[who][qnum].TorF = data.TorF;
    }


    // 既にあるグラフの中身を初期化するメソッド
    function clearGraph() {
        let qnum;
        _students.forEach(function (who) {
            for (qnum = 0; qnum < numMondai; qnum++) {
                dataArrOfAllStudents[who][qnum].Ans = 0;
                dataArrOfAllStudents[who][qnum].TorF = 'M';
            }
            reDraw(who);
        });
    }

    // whoに対応する学生部分を再描画
    function reDraw(who) {
        d3.select('#' + who)
            .selectAll('td')
            .data([who].concat(dataArrOfAllStudents[who]))
            .attr("align", "center")
            .style("background-color", function (d, i) {
                if (i == 0) return '#FFFFFF';
                else
                    if (d.TorF == 'M') return TorFColor[0];
                    else if (d.TorF == 'T') return TorFColor[1];
                    else return TorFColor[2];
            })
            .text(function (d, i) { if (i == 0) return d; else return d.Ans; });
    }


    // グラフを削除するメソッド（これを使わないとモニタリング開始ボタンを押すたびに下に新たにグラフ（表）が挿入されてしまう。)
    this.deleteGraph = function () {
        table.remove();
    };


    // WebSocketのonメソッドから呼ばれる。
    this.update = function (newData) {
        changeData(newData);
        reDraw(newData.ID);
    };

    // Redisから全てのデータを再取得して再描画するメソッド（その前にclearGraph()で全学生データを初期化（して再描画）する。）
    this.updateAll = function (redisAllData) {
        clearGraph();
        redisAllData.forEach(function (e) { changeData(transFormat(JSON.parse(e))); });
        _students.forEach(function (who) { reDraw(who); });
    }
}
