// ドキュメント読み込み完了時に実行
document.addEventListener('DOMContentLoaded', function() {
  // 現在の用語データ数を表示
  updateTermCount();
  
  // TSVファイルアップロード処理
  document.getElementById('uploadTsv').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        processTsvFile(event.target.result);
      };
      reader.readAsText(file);
    }
  });

  // タブ切り替え機能
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // すべてのタブボタンからactiveクラスを削除
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // クリックされたボタンにactiveクラスを追加
      this.classList.add('active');
      
      // すべてのタブコンテンツを非表示
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // クリックされたタブに対応するコンテンツを表示
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // 用語検索機能
  document.getElementById('searchBtn').addEventListener('click', function() {
    const searchTerm = document.getElementById('searchTerm').value.trim().toLowerCase();
    if (searchTerm) {
      searchTerms(searchTerm);
    }
  });
});

// 用語を検索する関数
function searchTerms(term) {
  chrome.storage.local.get('termsData', function(data) {
    const termsData = data.termsData || {};
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (termsData[term]) {
      // 完全一致の場合
      resultsContainer.innerHTML = `
        <div class="term-result">
          <h4>${term}</h4>
          <p>${termsData[term]}</p>
        </div>
      `;
    } else {
      // 部分一致を検索
      const matches = [];
      for (const [key, value] of Object.entries(termsData)) {
        if (key.includes(term)) {
          matches.push({ term: key, description: value });
        }
      }

      if (matches.length > 0) {
        matches.forEach(match => {
          resultsContainer.innerHTML += `
            <div class="term-result">
              <h4>${match.term}</h4>
              <p>${match.description}</p>
            </div>
          `;
        });
      } else {
        resultsContainer.innerHTML = '<p>該当する用語が見つかりませんでした</p>';
      }
    }
  });
}

// TSVファイルを処理する関数
function processTsvFile(tsvContent) {
  const newTermsData = {};
  const lines = tsvContent.split('\n');

  // ヘッダー行をスキップして2行目から処理
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const [term, description] = line.split('\t');
      if (term && description) {
        newTermsData[term.toLowerCase()] = description;
      }
    }
  }

  // 既存データを取得してからマージする
  chrome.storage.local.get('termsData', function(data) {
    const existingTermsData = data.termsData || {};

    // 既存データに新データを追加（上書きされる項目もある）
    const mergedTermsData = { ...existingTermsData, ...newTermsData };

    // マージ後のデータを保存
    chrome.storage.local.set({ termsData: mergedTermsData }, function() {
      console.log('用語データを追加・更新しました');
      document.getElementById('status').style.display = 'block';
      updateTermCount();
      
      // 2秒後にステータスメッセージを非表示
      setTimeout(function() {
        document.getElementById('status').style.display = 'none';
      }, 2000);
    });
  });
}


// 用語数を更新する関数
function updateTermCount() {
  chrome.storage.local.get('termsData', function(data) {
    const termsData = data.termsData || {};
    const count = Object.keys(termsData).length;
    document.getElementById('count').textContent = count;
  });
}
