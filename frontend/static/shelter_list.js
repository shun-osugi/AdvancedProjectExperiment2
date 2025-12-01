document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み完了後に実行
    getCurrentLocation();
});

// 1. 現在地を取得する
function getCurrentLocation() {
    const container = document.getElementById('shelter-list-container');

    if (!navigator.geolocation) {
        container.innerHTML = '<p class="error-msg">お使いのブラウザは位置情報をサポートしていません。</p>';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // 取得できたらAPIを叩く
            fetchShelters(lat, lng);
        },
        (error) => {
            console.error("位置情報エラー:", error);
            // エラー時はデフォルト（例: 名古屋市役所付近）またはエラー表示
            container.innerHTML = '<p class="error-msg">位置情報の取得に失敗しました。<br>設定を確認してください。</p>';
        }
    );
}

// 2. バックエンドAPIからデータを取得
async function fetchShelters(lat, lng) {
    const container = document.getElementById('shelter-list-container');

    try {
        // 半径5kmで検索
        const response = await fetch(`/api/shelters?lat=${lat}&lng=${lng}&radius_km=5`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const shelters = await response.json();
        renderShelters(shelters, container);

    } catch (error) {
        console.error("データ取得エラー:", error);
        container.innerHTML = '<p class="error-msg">データの取得に失敗しました。</p>';
    }
}

// 3. 画面に描画（HTML生成）
function renderShelters(shelters, container) {
    container.innerHTML = ""; // "読み込み中..." を消す

    if (shelters.length === 0) {
        container.innerHTML = '<p>近く（半径5km以内）に避難所は見つかりませんでした。</p>';
        return;
    }

    shelters.forEach(shelter => {
        // 混雑率の計算
        const ratio = shelter.current_count / shelter.capacity;
        const status = getStatusInfo(ratio);

        // カードHTMLの生成
        const card = document.createElement('div');
        card.className = 'shelter-card';

        // Google Mapsへのリンク生成
        const mapLink = `http://maps.google.com/maps?q=${shelter.lat},${shelter.lng}`;

        // 避難所IDを含む登録ページへのリンクを生成
        // IDが不明な場合のフォールバックも考慮
        const registerLink = shelter.shelter_id ? `/register/${shelter.shelter_id}` : '/register';

        card.innerHTML = `
            <div class="card-header">
                <h3 class="shelter-name">${shelter.name}</h3>
                <span class="distance-badge">${shelter.distance_km} km</span>
            </div>
            
            <div class="card-body">
                <p class="address">📍 ${shelter.address}</p>
                
                <div class="stats-row">
                    <div class="capacity-info">
                        <span class="label">現在の避難者数:</span>
                        <span class="value">${shelter.current_count}</span>
                        <span class="slash">/</span>
                        <span class="capacity">${shelter.capacity}人</span>
                    </div>
                    <span class="status-tag ${status.className}">${status.label}</span>
                </div>

                <a href="${mapLink}" target="_blank" class="map-btn">地図で見る</a>
                <a href="${registerLink}" class="action-btn">ここに避難登録する</a>
            </div>
        `;

        container.appendChild(card);
    });
}

// 4. 混雑率からラベルと色クラスを判定するヘルパー関数
function getStatusInfo(ratio) {
    if (ratio >= 0.95) {
        return { label: '満員', className: 'status-red' };
    } else if (ratio >= 0.70) {
        return { label: '混雑', className: 'status-yellow' };
    } else {
        return { label: '空きあり', className: 'status-green' };
    }
}