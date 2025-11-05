// DOM（HTML）の読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 必要な要素を取得 ---
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');
    
    const nameInput = document.getElementById('name-input');
    const userIdInput = document.getElementById('userid-input');

    // --- 2. タブ切り替えロジック ---
    const activateTab = (tabButton) => {
        const targetTabId = tabButton.dataset.tab; 
        
        tabItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        tabButton.classList.add('active');
        const targetContent = document.getElementById(targetTabId + '-content');
        if (targetContent) {
            targetContent.classList.add('active');
        }
    };

    tabItems.forEach(button => {
        button.addEventListener('click', () => {
            activateTab(button);
        });
    });

    // --- 3. 検索実行ロジック ---
    searchButton.addEventListener('click', async () => {
        const activeTab = document.querySelector('.tab-item.active');
        const activeTabId = activeTab.dataset.tab;
        
        resultsContainer.innerHTML = ''; // 既存の結果をクリア

        if (activeTabId === 'userid') {
            // --- User ID で検索 ---
            const userId = userIdInput.value.trim();
            
            // ▼ エラー1: 入力エラー (クライアント側)
            if (!userId) {
                displaySearchError(
                    '入力エラー', // Title
                    'User ID を入力してください。' // Description
                );
                return;
            }
            
            try {
                // API通信を実行 (サーバーのルート /api/search を叩く)
                const response = await fetch(`/api/search?user_id=${encodeURIComponent(userId)}`);

                if (response.ok) { // 200 OK
                    const data = await response.json();
                    displaySearchResult(data); // 成功時の表示
                
                // ▼ エラー2: APIエラー (404 Not Found)
                } else if (response.status === 404) {
                    displaySearchError(
                        '該当する結果が見つかりませんでした',
                        '検索条件に一致するユーザーが見つかりませんでした。\n別の検索条件をお試しください。'
                    );
                
                // ▼ エラー3: APIエラー (500, 400などその他)
                } else { 
                     displaySearchError(
                        '検索エラー',
                        `サーバーでエラーが発生しました。(Status: ${response.status})`
                    );
                }
            } catch (error) {
                 // (補足) 通信自体が失敗した場合のエラー
                 displaySearchError(
                    '通信エラー',
                    'サーバーとの通信に失敗しました。\nネットワーク接続を確認してください。'
                );
            }

        } else if (activeTabId === 'name') {
            // --- 名前で検索 ---
            const name = nameInput.value.trim();

            // ▼ エラー1: 入力エラー (クライアント側)
            if (!name) {
                displaySearchError(
                    '入力エラー',
                    '氏名またはカナを入力してください。'
                );
                return;
            }
            
            // ▼ 「名前検索」はAPI未定のため、強制的にエラー表示 (モック)
            displaySearchError(
                '該当する結果が見つかりませんでした',
                '検索条件に一致するユーザーが見つかりませんでした。\n（現在、User IDでの検索のみ利用可能です）'
            );
        }
    });

    // --- 4. 描画関数 (成功時) ---
    const displaySearchResult = (data) => {
        const { name, status, shelter, last_seen_at } = data;
        const statusDetails = getStatusDetails(status);
        const shelterName = shelter ? shelter.name : '(情報なし)';
        const shelterAddress = shelter ? shelter.address : '(情報なし)';
        const lastSeenTime = last_seen_at 
            ? formatTimestamp(last_seen_at) 
            : '(ビーコン未連携)';
        
        const resultHtml = `
            <div class="result-card">
                <div class="result-header">
                    <span class="result-name">${escapeHTML(name)}</span>
                    <span class="status-badge ${statusDetails.className}">${statusDetails.text}</span>
                </div>
                <div class="result-details">
                    <p><strong>避難所名:</strong> <span>${escapeHTML(shelterName)}</span></p>
                    <p><strong>住所:</strong> <span>${escapeHTML(shelterAddress)}</span></p>
                    <p><strong>最終確認時刻:</strong> <span>${escapeHTML(lastSeenTime)}</span></p>
                </div>
            </div>
        `;
        resultsContainer.innerHTML = resultHtml;
    };

    // --- 5. 描画関数 (失敗時 - Figmaデザイン) ---
    const displaySearchError = (title, description) => {
        const iconSvg = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#adb5bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="#adb5bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        const errorHtml = `
            <div class="error-message-card">
                <div class="error-icon">
                    ${iconSvg}
                </div>
                <h3 class="error-title">${escapeHTML(title)}</h3>
                <p class="error-description">${escapeHTML(description).replace('\n', '<br>')}</p>
            </div>
        `;
        resultsContainer.innerHTML = errorHtml;
    };

    // --- 6. ヘルパー関数 (日時フォーマットなど) ---

    const getStatusDetails = (status) => {
        switch (status) {
            case 'evacuated':
                return { text: '避難中', className: 'status-evacuated' };
            case 'left':
                return { text: '退出', className: 'status-left' };
            case 'unknown':
            default:
                return { text: '不明', className: 'status-unknown' };
        }
    };
    
    const formatTimestamp = (unixTime) => {
        if (!unixTime) return null;
        const date = new Date(unixTime * 1000); 
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Tokyo'
        };
        
        try {
            const formatter = new Intl.DateTimeFormat('ja-JP', options);
            const parts = formatter.formatToParts(date).reduce((acc, part) => {
                if (part.type !== 'literal') {
                    acc[part.type] = part.value;
                }
                return acc;
            }, {});
            return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
        } catch (e) {
            // フォールバック
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const sec = String(date.getSeconds()).padStart(2, '0');
            return `${y}/${m}/${d} ${h}:${min}:${sec}`;
        }
    };
    
    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>"']/g, (match) => {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    };

    // (初回読み込み時のタブ設定)
    const initiallyActiveTab = document.querySelector('.tab-item.active');
    if (initiallyActiveTab) {
        activateTab(initiallyActiveTab);
    }
});