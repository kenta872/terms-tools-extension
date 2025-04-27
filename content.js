// Webページ上で直接動く
// 文字列の選択監視とか

// UI要素
let termButton = null;
let termDialog = null;

// 初期化関数
function initializeExtension() {
  console.log('用語検索拡張機能を初期化しています...');
  
  // 翻訳ボタンを作成
  createTermButton();
  // 翻訳ダイアログを作成
  createTermDialog();
  // テキスト選択イベントのリスナーを追加
  addTextSelectionListeners();

  
  // バックグラウンドスクリプトに用語データのロードを要求
  chrome.runtime.sendMessage({ action: 'loadTerms' }, function(response) {
    console.log('用語データのロード結果:', response);
  });
  
  console.log('初期化完了: イベントリスナーを設定しました');
}

// 用語検索ボタンを作成する関数
function createTermButton() {
  // すでに存在する場合は削除
  if (termButton) {
    document.body.removeChild(termButton);
  }
  termButton = document.createElement('div');
  termButton.className = 'term-button';
  termButton.textContent = '用語検索';
  termButton.style.display = 'none';
  termButton.style.position = 'absolute';
  termButton.style.padding = '8px 16px';
  termButton.style.backgroundColor = '#3c4043';
  termButton.style.color = 'white';
  termButton.style.borderRadius = '4px';
  termButton.style.fontSize = '12px';
  termButton.style.cursor = 'pointer';
  termButton.style.zIndex = '9999';
  termButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
  
  // ボタンクリック時の処理
  termButton.addEventListener('click', function() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      searchTermDefinition(selectedText);
    }
  });
  
  document.body.appendChild(termButton);
}

// 用語説明ダイアログを作成する関数
function createTermDialog() {
  // すでに存在する場合は削除
  if (termDialog) {
    document.body.removeChild(termDialog);
  }
  
  termDialog = document.createElement('div');
  termDialog.className = 'term-dialog';
  termDialog.style.display = 'none';
  
  // デバッグ用のスタイルを追加（表示確認用）
  termDialog.style.position = 'absolute';
  termDialog.style.width = '400px';
  termDialog.style.backgroundColor = 'white';
  termDialog.style.borderRadius = '8px';
  termDialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  termDialog.style.zIndex = '10000';
  termDialog.style.overflow = 'hidden';
  
  // ダイアログのヘッダー部分
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'dialog-header';
  dialogHeader.style.display = 'flex';
  dialogHeader.style.justifyContent = 'space-between';
  dialogHeader.style.alignItems = 'center';
  dialogHeader.style.padding = '16px';
  dialogHeader.style.backgroundColor = '#3c4043';
  dialogHeader.style.borderBottom = '1px solid #e0e0e0';
  
  // タイトル
  const dialogTitle = document.createElement('span');
  dialogTitle.className = 'dialog-title';
  dialogTitle.style.fontWeight = 'normal';
  dialogTitle.style.fontSize = '16px';
  dialogTitle.style.letterSpacing = '1.2px';
  dialogTitle.style.color = '#fff';
  
  // 閉じるボタン
  const closeButton = document.createElement('span');
  closeButton.className = 'dialog-close';
  closeButton.textContent = '×';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#fff';
  closeButton.style.fontSize = '16px';
  closeButton.addEventListener('click', function() {
    termDialog.style.display = 'none';
  });
  
  // コンテンツ部分
  const dialogContent = document.createElement('div');
  dialogContent.className = 'dialog-content';
  dialogContent.style.backgroundColor = '#3c4043';
  dialogContent.style.padding = '16px';
  
  // 説明
  const termDescriptionDiv = document.createElement('div');
  termDescriptionDiv.className = 'term-description';
  termDescriptionDiv.style.color = '#fff';
  termDescriptionDiv.style.fontSize = '14px';
  termDescriptionDiv.style.lineHeight = '1.5';
  
  // 構造を組み立て
  dialogHeader.appendChild(dialogTitle);
  dialogHeader.appendChild(closeButton);
  dialogContent.appendChild(termDescriptionDiv);
  
  termDialog.appendChild(dialogHeader);
  termDialog.appendChild(dialogContent);
  
  document.body.appendChild(termDialog);
  console.log('用語説明ダイアログを作成しました');
}

// テキスト選択を処理する関数
function handleTextSelection(e) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // デバッグ情報
  if (e) {
    console.log('選択イベント発生:', e.type);
  }
  
  // 選択されたテキストがある場合
  if (selectedText) {
    console.log('テキスト選択検出:', selectedText);
    
    try {
      // 選択範囲の座標を取得
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // ボタンの位置を設定
      termButton.style.top = (window.scrollY + rect.bottom + 5) + 'px';
      termButton.style.left = (window.scrollX + rect.left) + 'px';
      termButton.style.display = 'block';
      
      console.log('ボタンを表示しました:', 
        '位置=(', termButton.style.left, ',', termButton.style.top, ')',
        'テキスト=', selectedText);
    } catch (error) {
      console.error('選択範囲の座標取得エラー:', error);
    }
  } else {
    // 選択がない場合、かつイベントがmousedownでない場合に非表示
    // (mousedownは他の要素をクリックした時のイベントで、別途処理しているため)
    if (!e || e.type !== 'mousedown') {
      termButton.style.display = 'none';
    }
  }
}

function addTextSelectionListeners() {
  // mouseupイベント (マウスボタンを離した時)
  document.addEventListener('mouseup', handleTextSelection);
  
  // ダブルクリックイベント (明示的に処理)
  document.addEventListener('dblclick', handleTextSelection);
  
  // 選択変更イベント (selectionchangeイベント)
  document.addEventListener('selectionchange', function() {
    // 少し遅延させて選択が完了した後に処理する
    setTimeout(handleTextSelection, 10);
  });
  
  // キーボードイベント (Shift+矢印などでの選択)
  document.addEventListener('keyup', function(e) {
    // 矢印キー、Shift、Ctrl等のキーが押されたときのみ処理
    if (e.key.includes('Arrow') || e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta') {
      handleTextSelection();
    }
  });
  
  // クリックイベントをリスン（ダイアログを閉じるため）
  document.addEventListener('mousedown', function(e) {
    // ボタンやダイアログ以外をクリックしたらUIを非表示に
    if (termButton && !termButton.contains(e.target) && 
        termDialog && !termDialog.contains(e.target)) {
      termButton.style.display = 'none';
      termDialog.style.display = 'none';
    }
  });
}

// 用語の定義を検索する関数
function searchTermDefinition(term) {
  console.log('用語検索開始:', term);
  
  // バックグラウンドスクリプトに用語検索のメッセージを送信
  chrome.runtime.sendMessage(
    { action: 'searchTerm', term: term },
    function(response) {
      console.log('検索結果受信:', response);
      
      const dialogTitle = termDialog.querySelector('.dialog-title');
      const termDescriptionDiv = termDialog.querySelector('.term-description');
      
      // 検索結果を表示
      dialogTitle.textContent = term;
      
      if (response && response.found) {
        termDescriptionDiv.textContent = response.description;
      } else {
        termDescriptionDiv.textContent = 'この用語は用語集に登録されていません。';
      }
      
      // ダイアログの位置を設定（ボタンの近く）
      termDialog.style.top = termButton.style.top;
      termDialog.style.left = termButton.style.left;
      termDialog.style.display = 'block';
      
      console.log('ダイアログを表示しました');
    }
  );
}

// 初期化関数の呼び出し
// DOMContentLoadedイベントとwindow.onloadの両方でトライ
document.addEventListener('DOMContentLoaded', initializeExtension);

// DOMContentLoadedが発火しない場合のフォールバック
window.onload = function() {
  // すでに初期化されている場合は何もしない
  if (!termButton) {
    console.log('window.onloadでの初期化');
    initializeExtension();
  }
};

// 即時実行関数としても実行（ページがすでにロードされている可能性がある場合）
(function() {
  // document.readyStateが'complete'または'interactive'の場合、すぐに初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // すでに初期化されている場合は何もしない
    if (!termButton) {
      console.log('即時実行での初期化 (readyState=' + document.readyState + ')');
      setTimeout(initializeExtension, 10); // 少し遅延させる
    }
  }
})();
