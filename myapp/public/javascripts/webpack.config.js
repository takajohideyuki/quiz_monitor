const path = require('path')
const webpack = require('webpack')

module.exports = {
  /* ビルドの起点となるファイルの設定 */
  entry: {
     'monitor': './mon/Monitor.js',
      'main': './Main.js'
  },
  /* 出力されるファイルの設定 */
  output: {
    path: __dirname + '/dist', // 出力先のパス
    filename: "[name].bundle.js",  // 出力先のファイル名
    library: "[name]", 
    libraryTarget: "var" // この２行は、bundleしたjsファイル内のオブジェクトを参照するために追加
  },
  /* ソースマップをファイル内に出力させる場合は以下を追加 */
  devtool: 'inline-source-map',
  module: {
    /* loaderの設定 */
    loaders: [
      { /*以下は元々jsだったのを高城がjsxに変更 */
        test: /\.js$/, // 対象となるファイルの拡張子（正規表現可）
        exclude: /node_modules/, // 除外するファイル/ディレクトリ（正規表現可）
        loader: 'babel-loader' ,// 使用するloader
        /* 以下のqueryは高城が追加 */
        query: {
          plugins: ["transform-react-jsx"] // babelのtransform-react-jsxプラグインを使ってjsxを変換
        }
      }
    ]
  }
};
