// background.js
// Chrome拡張機能のバックグラウンドスクリプト
// 常に裏で動き続けて、イベント待ち受け（例：ボタン押された、ページ開いた など）を担当します。

const TERMS_FILE_NAME = 'terms.tsv'; // 用語データのTSVファイル名
const LOCAL_STORAGE_KEY = 'termsData'; // ストレージキー
let termsData = {}; // 用語データを格納するオブジェクト

// デバッグ情報
console.log('background.js: 起動しました');

// 拡張機能の初期化時にTSVファイルを読み込む
function loadTermsData() {
  console.log('用語データ読み込み開始');
  
  fetch(TERMS_FILE_NAME)
    .then(response => {
      console.log('TSVファイル応答受信:', response.status);
      return response.text();
    })
    .then(tsvContent => {
      console.log('TSVデータ取得成功、パース開始');
      
      // TSVをパースして用語データに変換
      const lines = tsvContent.split('\n');
      console.log('行数:', lines.length);
      
      // ヘッダー行をスキップして2行目から処理
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [term, description] = line.split('\t');
          if (term && description) {
            termsData[term.toLowerCase()] = description;
          }
        }
      }
      
      console.log('用語データパース完了、エントリ数:', Object.keys(termsData).length);
      
      // ストレージに保存
      chrome.storage.local.set({ [LOCAL_STORAGE_KEY]: termsData }, function() {
        console.log('用語データをストレージに保存しました');
      });
    })
    .catch(error => {
      console.error('用語データの読み込みに失敗しました:', error);
    });
}

// 用語を検索する関数
function searchTerm(term) {
  console.log('用語検索:', term);
  
  // 小文字に変換して検索
  const normalizedTerm = term.toLowerCase();
  const result = termsData[normalizedTerm];
  
  console.log('検索結果:', result ? '見つかりました' : '見つかりませんでした');
  return result || null;
}

// メッセージリスナーを設定
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('メッセージ受信:', request);
  
  if (request.action === 'searchTerm') {
    const result = searchTerm(request.term);
    console.log('用語検索結果を返します:', result);
    sendResponse({ found: !!result, description: result });
  } 
  else if (request.action === 'loadTerms') {
    console.log('用語データロードリクエスト');
    
    chrome.storage.local.get(LOCAL_STORAGE_KEY, function(data) {
      if (data.termsData && Object.keys(data.termsData).length > 0) {
        console.log('ストレージから用語データを読み込みました');
        termsData = data.termsData;
        sendResponse({ success: true, count: Object.keys(termsData).length });
      } else {
        console.log('ストレージにデータがないためファイルから読み込みます');
        loadTermsData();
        sendResponse({ success: true, message: 'データを読み込み中' });
      }
    });
    return true; // 非同期レスポンスのため true を返す
  }
  else {
    console.log('不明なアクション:', request.action);
    sendResponse({ error: '不明なアクション' });
  }
  
  // 非同期レスポンスではない場合はここでreturn trueは不要
});

// 初期化時に用語データを読み込む
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('拡張機能がインストールされました:', details.reason);
  loadTermsData();
});

// セッション開始時にもデータをロード
chrome.runtime.onStartup.addListener(function() {
  console.log('ブラウザ起動: データをリロードします');
  loadTermsData();
});

// デバッグ用：現在のデータを表示
console.log('background.js: 初期化完了');
