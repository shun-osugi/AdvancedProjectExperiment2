// static/script.js

document.addEventListener("DOMContentLoaded", () => {
    // URLから shelter_id を取得して hidden フィールドにセットする処理
    const urlPath = window.location.pathname;
    const pathParts = urlPath.split('/');

    if (pathParts.length > 2 && pathParts[1] === 'register') {
        const shelterIdFromUrl = pathParts[2];
        const shelterInput = document.getElementById("shelter-id");
        if (shelterInput && shelterIdFromUrl) {
            shelterInput.value = shelterIdFromUrl;
        }
    }

    const form = document.getElementById("registration-form");
    const result = document.getElementById("result-message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // ▼ 追加: 送信ボタンを取得し、連打できないように無効化(disabled)する
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "送信中..."; // (任意) ボタンの文字を変える

        clearMessage(result);

        // 1. フォームデータの取得
        const data = collectFormData(form);

        // 2. バリデーション
        const validationError = validate(data);
        if (validationError) {
            showError(result, validationError);
            // ▼ エラー時はボタンを再度押せるように戻す
            submitBtn.disabled = false;
            submitBtn.textContent = "登録する";
            return;
        }

        try {
            // 3. サーバーAPIへ送信 (Firebase直接ではなくFlask経由)
            const userID = await sendToBackend(data);

            // 4. 完了画面へ遷移
            window.location.href = `/registration-complete?user_id=${encodeURIComponent(userID)}`;

        } catch (err) {
            console.error(err);
            showError(result, "登録中にエラーが発生しました: " + err.message);
            // ▼ 通信エラー時もボタンを再度押せるように戻す
            submitBtn.disabled = false;
            submitBtn.textContent = "登録する";
        }
    });
});

// ===============================
// フォームデータ収集
// ===============================
function collectFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // 数値変換
    if (data.age) data.age = Number(data.age);
    // 空文字対応
    if (!data.birth) data.birth = null;

    return data;
}

// ===============================
// バックエンドAPIへの送信
// ===============================
async function sendToBackend(data) {
    console.log("サーバーへ送信中...", data);

    const response = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const resJson = await response.json();

    if (!response.ok) {
        throw new Error(resJson.error || "サーバーエラーが発生しました");
    }

    // 成功したら user_id を返す
    return resJson.user_id;
}

// ===============================
// バリデーション
// ===============================
function validate(data) {
    const requiredFields = {
        last_name: "姓",
        first_name: "名",
        last_name_kana: "セイ（カナ）",
        first_name_kana: "メイ（カナ）",
        mobile_phone: "携帯電話",
        emergency_contact: "緊急連絡先",
        gender: "性別",
        age: "年齢",
        status: "避難ステータス",
        beacon_id: "ビーコンID"
    };

    for (const key in requiredFields) {
        if (!data[key] || (typeof data[key] === 'string' && data[key].trim() === "")) {
            return `${requiredFields[key]}は必須入力です`;
        }
    }

    if (!/^[0-9\-]+$/.test(data.mobile_phone)) return "携帯電話番号の形式が正しくありません";
    if (!/^[0-9\-]+$/.test(data.emergency_contact)) return "緊急連絡先の形式が正しくありません";
    if (isNaN(data.age) || data.age < 0 || data.age > 120) return "年齢の値が不正です";

    return null;
}

// ===============================
// メッセージ表示
// ===============================
function showError(target, msg) {
    target.style.color = "#d9534f"; // 赤色
    target.textContent = msg;
}

function clearMessage(target) {
    target.textContent = "";
}