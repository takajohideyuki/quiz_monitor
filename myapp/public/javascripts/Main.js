import React from 'react';
import ReactDOM from 'react-dom';

/* import SikenHeader from './SikenHeader';
import DispTable from './DispTable';
import { tableData } from './DispTable';
import Evaluator from './InputTest';
import CallSuperAgent from './CallSuperAgent'; */

import ShowMondaishuTop from './ShowSiken.js';
import Request from 'superagent';

//--------------------------------------------------------------------------------------
/* ReactDOM.render(
  <WebSocket />,
  document.getElementById('websocket')
);

ReactDOM.render(
  //React.createElement(SikenHeader), JSXで書くと下のようになる
  <SikenHeader />,
  document.getElementById('SikenHeader')
);

ReactDOM.render(
  <DispTable data={tableData} />,
  document.getElementById('DispTable')
);

ReactDOM.render(
  <Evaluator />,
  document.getElementById('Evaluator')
);

ReactDOM.render(
  <CallSuperAgent />,
  document.getElementById('CallSuperAgent')
); */


function GetQueryString() {
  var result = {};
  if (1 < window.location.search.length) {
    // 最初の1文字 (?記号) を除いた文字列を取得する
    var query = window.location.search.substring(1);

    // クエリの区切り記号 (&) で文字列を配列に分割する
    var parameters = query.split('&');

    for (var i = 0; i < parameters.length; i++) {
      // パラメータ名とパラメータ値に分割する
      var element = parameters[i].split('=');

      var paramName = decodeURIComponent(element[0]);
      var paramValue = decodeURIComponent(element[1]);

      // パラメータ名をキーとして連想配列に追加する
      result[paramName] = paramValue;
    }
  }
  return result;
}


let qs = GetQueryString().qset; //変数qsには問題セットの番号が入る
let user = GetQueryString().user;
let URL = 'http://                :3000/api/mondai/get/list/' + qs;

// 以下でReactDOM.render()の引数にJSXが書けるのはWebPackが変換してくれているのだろう。
Request // SuperAgentを使って高城作のapi.jsを呼んでいる。
  .get(URL)
  .end(function (err, res) {
    if (res.ok) {
      let mondaiSet2 = res.body;
      ReactDOM.render(
        <ShowMondaishuTop mondaiSet={mondaiSet2} user={user}/>,
        document.getElementById('ShowMondaishuTop')
      );
    } else {
      console.log('Main.jsからapi.jsへのアクセス中にerrorが起きましたよ');
    }
  });
