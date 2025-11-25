// static/search.js

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
        let apiUrl = '';

        if (activeTabId === 'userid') {
            // --- User ID で検索 ---
            const userId = userIdInput.value.trim();
            if (!userId) {
                displaySearchError('入力エラー', 'User ID を入力してください。');
                return;
            }
            apiUrl = `/api/search?user_id=${encodeURIComponent(userId)}`;

        } else if (activeTabId === 'name') {
            // --- 名前で検索 ---
            const name = nameInput.value.trim();
            if (!name) {
                displaySearchError('入力エラー', '氏名（姓または名）を入力してください。');
                return;
            }
            apiUrl = `/api/search?name=${encodeURIComponent(name)}`;
        }

        // --- API通信と結果表示 ---
        try {
            const response = await fetch(apiUrl);

            if (response.ok) { // 200 OK
                const dataList = await response.json();
                // 検索結果は配列で返ってくるので、ループして表示
                if (Array.isArray(dataList) && dataList.length > 0) {
                    dataList.forEach(data => {
                        displaySearchResultCard(data);
                    });
                } else {
                    // 空配列の場合
                    displaySearchError(
                        '該当する結果が見つかりませんでした',
                        '検索条件に一致するユーザーが見つかりませんでした。'
                    );
                }

            } else if (response.status === 404) {
                displaySearchError(
                    '該当する結果が見つかりませんでした',
                    '検索条件に一致するユーザーが見つかりませんでした。'
                );
            } else {
                displaySearchError(
                    '検索エラー',
                    `サーバーでエラーが発生しました。(Status: ${response.status})`
                );
            }
        } catch (error) {
            console.error(error);
            displaySearchError(
                '通信エラー',
                'サーバーとの通信に失敗しました。'
            );
        }
    });

    // --- 4. 描画関数 (成功時 - カードを追加) ---
    const displaySearchResultCard = (data) => {
        const { name, status, shelter, last_seen_at, user_id } = data;
        const statusDetails = getStatusDetails(status);
        const shelterName = shelter ? shelter.name : '(避難所情報なし)';
        const shelterAddress = shelter ? shelter.address : '';
        const lastSeenTime = last_seen_at
            ? formatTimestamp(last_seen_at)
            : '(未確認)';

        // カードHTMLの作成
        const cardDiv = document.createElement('div');
        cardDiv.className = 'result-card';
        cardDiv.innerHTML = `
            <div class="result-header">
                <div>
                    <span class="result-name">${escapeHTML(name)}</span>
                    <small style="color:#666; font-size:0.8em;">(ID: ${escapeHTML(user_id)})</small>
                </div>
                <span class="status-badge ${statusDetails.className}">${statusDetails.text}</span>
            </div>
            <div class="result-details">
                <p><strong>避難所名:</strong> <span>${escapeHTML(shelterName)}</span></p>
                ${shelterAddress ? `<p><strong>住所:</strong> <span>${escapeHTML(shelterAddress)}</span></p>` : ''}
                <p><strong>最終確認時刻:</strong> <span>${escapeHTML(lastSeenTime)}</span></p>
            </div>
        `;
        resultsContainer.appendChild(cardDiv);
    };

    // --- 5. 描画関数 (失敗時) ---
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

    // --- 6. ヘルパー関数 ---

    const getStatusDetails = (status) => {
        switch (status) {
            case 'evacuated':
                return { text: '避難中', className: 'status-evacuated' };
            case 'left':
                return { text: '帰宅済', className: 'status-left' }; // PDFのleftは帰宅や退出
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
            hour: '2-digit', minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Tokyo'
        };
        try {
            return new Intl.DateTimeFormat('ja-JP', options).format(date);
        } catch (e) {
            return date.toLocaleString();
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

    // 初回タブ設定
    const initiallyActiveTab = document.querySelector('.tab-item.active');
    if (initiallyActiveTab) {
        activateTab(initiallyActiveTab);
    }
});