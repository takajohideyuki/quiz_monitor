import React from 'react'

//import update from 'immutability-helper';
//import Immutable from 'immutable';
var Immutable = require("immutable");
var io = require('socket.io-client');

/* ここでは4択式の小テストを表示する。
   ４択式ではあるが、「未回答」というラジオボタンを追加して５択式になっている。
 */
// とりあえず4択式の問題集（問題と答え）はハードコーディングする。後日、MongoDBに格納する。
// たぶん、H29M11D11現在、このmondaishu変数はつかっていない。
// ShowMondaishuTopコンポーネントへのプロパティthis.props.mondaiSetで渡ってくるようになっている。
/* let mondaishu = [
    {
        no: 100, type: "4Select", level: 1, question: "TCPは第何層のプロトコルですか？",
        choiceA: "2", choiceB: "3", choiceC: "4", choiceD: "5", ans: "choiceC"
    },
    {
        no: 101, type: "4Select", level: 1, question: "UDPは第何層のプロトコルですか？",
        choiceA: "2", choiceB: "3", choiceC: "4", choiceD: "5", ans: "choiceC"
    },
    {
        no: 102, type: "4Select", level: 1, question: "IPは第何層のプロトコルですか？",
        choiceA: "2", choiceB: "3", choiceC: "4", choiceD: "5", ans: "choiceB"
    }
]; */

// 実際はデータベースに格納することになるだろう。ここでは仮想的にDBのつもりで、gakuseiKaitouDBを作った。
let gakuseiKaitouDB = { /* no:???, kaitou:??? の形式の連想配列 */ }; //JavaScriptでは連想配列は単なるオブジェクト(単なるJSONと言ってもいいのかな。)

let socket; 
let who;

class ShowMondaishuTop extends React.Component {

    constructor(props) {
        super(props);

        this.makeKaitouSetFromMondaiSet = this.makeKaitouSetFromMondaiSet.bind(this);
        this.mark = this.mark.bind(this);
        this.onUserSelect = this.onUserSelect.bind(this);
        this.gakuseiSelection = this.gakuseiSelection.bind(this);
        this.startWebSocket = this.startWebSocket.bind(this);
        this.changeConnectedState = this.changeConnectedState.bind(this);

        let _kaitouSet = this.makeKaitouSetFromMondaiSet(this.props.mondaiSet);
        //console.log("_kaitouSet=" + _kaitouSet);

        this.state = {
            kaitouSet: _kaitouSet,
            connected: false   // WebSocketプロトコルで接続しているかどうかの状態を表す
        };

        who = this.props.user;
        console.log("ログインユーザー = " + who);
    }


    changeConnectedState(status) {
        this.setState({ connected: status });
    }


    // ここからはWebSocket.jsから転記してきたもの
    startWebSocket() {
        socket = io.connect('http://                 :8080/');

        socket.on('connect', function () {
            console.log('WebSocketの接続が完了しました');

            // サーバにメッセージを送信
            socket.emit('login', who, function (data) {
                console.log('サーバ側で「' + data + '」だそうです');
            });
            // サーバからのメッセージを受信
            socket.on('S2C', function (data) {  // S2CはServer to Clientの意味
                console.log('WebSocket Server からメッセージ『' + data.value + '』を受信しました');
            });

            this.changeConnectedState(true);
        }.bind(this)); 

        socket.on('disconnect', function () {
            socket.disconnect(); // 開発段階ではこれでいいが、運用段階では自動再接続した方がいいので、とりあえずコメントアウトする。
            //            socket.close();    // disconnect()とclose()の違いはよくわからない。
            console.log('webSocketの接続が切れました');
            this.changeConnectedState(false);
        }.bind(this));
    }

    componentDidMount() {
        console.log('WebSocketへの接続を開始します');
        this.startWebSocket();
    }
    // ここまでがWebSocket.jsから転記してきたもの 


    makeKaitouSetFromMondaiSet(_mondaiSet) {
        return _mondaiSet.map(item => ({ no: item.no, selection: "notSelected" }));
    }

    // 解答をどこでするかは大きな問題だ。当初は解答をするWebAPIを作成し、saiten_model.jsから呼び出すつもり
    // だったが、これではWebAPIで毎回、問題と正解をデータベースなりファイルなりから読み込むためオーバーヘッドが大きい。
    // （後で考えたら、解答をするサーバを構築して、常時問題と正解を読み込んでおけば、オーバーヘッドの問題は解消するな。）
    // そこで、地産地消ということでこの場所で採点することにした。 markは採点の意味。
    // 問題番号no(ここでのnoは問題データベースでの問題番号)に学生がkaitouを選択したときの正誤。正解なら"T", 不正解なら"F"を返す。
    // mark関数でやっていることは、基本的に下のgakuseiSelection(_no)と同じ。ただし、gakuseiSelectionはkaitouSetから探している。
    // _mondaiSet配列のそれぞれの要素each_mondaiの番号noが_noに一致する要素を検索し、その要素のcorrectをまず取り出している。
    mark(_mondaiSet, _no, _kaitou) {
        let seikai = _mondaiSet.find((each_mondai) => each_mondai.no === _no).correct;

        if (_kaitou === "notSelected") return "M"; // Mは未回答のつもり
        else {
            if (_kaitou === seikai) return "T";
            else return "F";
        }
    }

    // _noの問題に対して_choiceを選択したときのハンドラ
    // _choiceは4択式のchoiceAからchoiceD以外に未回答を意味するnotSelectedのいずれかの値になる。
    onUserSelect(_no, _choice) {
        let saiten = this.mark(this.props.mondaiSet, _no, _choice);
        //console.log("学生の解答は" + _choice + "で、正誤は" + saiten + "です。");
        // socket.emit('kaitou-event', "ユーザー" + who + "の" + _no + "の問題のchoiceは" + _choice + "です");
        let emitdata = { ID: who, QNum: _no, Choice: _choice, TorF: saiten }; 
        socket.emit('kaitou-event', emitdata); // JSONオブジェクトのまま送信

        let immutableKaitouSet = Immutable.fromJS(this.state.kaitouSet); //JSの配列(array)をImmutableのListに変換
        let idx = immutableKaitouSet.findIndex((a) => a.get("no") === _no);
        let curMap = immutableKaitouSet.get(idx);
        let newMap = curMap.set("selection", _choice);
        let immutableNewKaitouSet = immutableKaitouSet.update(idx, item => newMap); //Listのidx番目の内容をnewMapに置き換え
        let newKaitouSet = immutableNewKaitouSet.toJS();
        this.setState({ kaitouSet: newKaitouSet });
    }

    // _noで指定した問題に対する学生の解答をkaitouSetから調べるメソッド
    gakuseiSelection(_no) {
        let _kaitouSet = this.state.kaitouSet;
        let hitNo = _kaitouSet.findIndex((kaitou) => kaitou.no === _no);

        //   console.log("セレクタ="+_kaitouSet[hitNo].selection);
        if (hitNo === -1) return "notSelected"; 
        else return _kaitouSet[hitNo].selection;
    }

    render() {
        let questions = this.props.mondaiSet.map((mondaiOne) => {
            return (
                <ShowOneMondai key={mondaiOne.no} // Reactではコンポーネントの配列の出力にはkeyが必要なようだ。ここでは問題noをキーとした
                    mondaiOne={mondaiOne}
                    selection={this.gakuseiSelection.bind(this)(mondaiOne.no)}
                    onUserSelect={this.onUserSelect.bind(this)} />
            )
        });

        return (
            <div className="showAllMondai">
                <p> 現在 {this.state.connected ? "WebSocket接続中" : "WebSocket切断中"} です </p>
                {questions}
            </div>
        )
    }
}

//-----------------------------------------------------------------------------------------------------------------------
// 1つの小テスト問題を表示するクラス
// Propsとして、
// １つの問題 mondaiOne
// どのラジオボタンを選んでいるかを表す selection
// ラジオボタンのイベントハンドラ onUserSelect
// が渡って来る。

class ShowOneMondai extends React.Component {

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        // selectionは4択式の"choiceA"から"choiceD"以外に未回答を意味する"notSelected"のいずれかの値になる。
        // イベントハンドラonUserSelectに対して、mondaiOne.no番号の問題の解答をevent.target.valueに変更することを伝える
        this.props.onUserSelect(this.props.mondaiOne.no, event.target.value);
    }

    render() {
        let sideColor_NotSelected = {
            position: 'absolute', //JSXではCSSはJavaScriptのオブジェクトなので、行末は;ではなく,を使う。
            zIndex: -1, //JSXではz-indexの代わりにzIndexと書く
            top: 0,
            bottom: 0,
            left: 0,
            width: 8,
            backgroundColor: "black"
        };
        let sideColor_Selected = {
            position: 'absolute',
            zIndex: -1,
            top: 0,
            bottom: 0,
            left: 0,
            width: 8,
            backgroundColor: "#eee"
        };

        // 下の<div style={sideColor}></div> は</div>で閉じているので、これ１つで左のサイドの枠を作っている。
        return (
            <div className="showOneMondai">
                <div style={this.props.selection === "notSelected" ? sideColor_NotSelected : sideColor_Selected}></div>
                <h3> 問題番号 : {this.props.mondaiOne.no} <br />
                    {this.props.mondaiOne.mondaibun}
                </h3>

                <input
                    type='radio'
                    value='choiceA'
                    checked={this.props.selection === 'choiceA'} //コンポーネントはただ単に上位のコンポーネントのデータを表示するだけ
                    onChange={this.handleChange.bind(this)}
                /> {this.props.mondaiOne.choiceA}
                <br />

                <input
                    type='radio'
                    value='choiceB'
                    checked={this.props.selection === 'choiceB'}
                    onChange={this.handleChange.bind(this)}
                /> {this.props.mondaiOne.choiceB}
                <br />

                <input
                    type='radio'
                    value='choiceC'
                    checked={this.props.selection === 'choiceC'}
                    onChange={this.handleChange.bind(this)}
                /> {this.props.mondaiOne.choiceC}
                <br />

                <input
                    type='radio'
                    value='choiceD'
                    checked={this.props.selection === 'choiceD'}
                    onChange={this.handleChange.bind(this)}
                /> {this.props.mondaiOne.choiceD}
                <br />

                <input
                    type='radio'
                    value='notSelected'
                    checked={this.props.selection === 'notSelected'}
                    onChange={this.handleChange.bind(this)}
                /> 未回答
                </div>
        );
    }
}


export default ShowMondaishuTop;