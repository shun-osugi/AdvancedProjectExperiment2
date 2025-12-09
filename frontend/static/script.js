// static/script.js

document.addEventListener("DOMContentLoaded", async () => {

    // ---------------------------------------------------
    // 1. 避難所リストを取得してプルダウンを作成する処理
    // ---------------------------------------------------
    const shelterSelect = document.getElementById("shelter-id");

    // URLから shelter_id を取得しておく
    const urlPath = window.location.pathname;
    const pathParts = urlPath.split('/');
    let targetShelterId = null;

    if (pathParts.length > 2 && pathParts[1] === 'register') {
        targetShelterId = pathParts[2];
    }

    if (shelterSelect) {
        try {
            // APIから全避難所リストを取得
            const res = await fetch("/api/shelters/all");
            if (res.ok) {
                const shelters = await res.json();

                // プルダウンの選択肢を作成
                shelters.forEach(s => {
                    const option = document.createElement("option");
                    option.value = s.shelter_id;
                    option.textContent = `${s.name}`;
                    shelterSelect.appendChild(option);
                });

                // リスト生成後に、URLで指定されたIDがあれば自動選択する
                if (targetShelterId) {
                    shelterSelect.value = targetShelterId;
                }
            }
        } catch (e) {
            console.error("避難所リストの取得に失敗しました", e);
        }
    }

    // ---------------------------------------------------
    // 2. フォーム送信処理
    // ---------------------------------------------------
    const form = document.getElementById("registration-form");
    const result = document.getElementById("result-message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // ▼ 送信ボタンを取得し、連打できないように無効化(disabled)する
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "送信中...";

        clearMessage(result);

        // フォームデータの取得
        const data = collectFormData(form);

        // バリデーション
        const validationError = validate(data);
        if (validationError) {
            showError(result, validationError);
            // エラー時はボタンを再度押せるように戻す
            submitBtn.disabled = false;
            submitBtn.textContent = "登録する";
            return;
        }

        try {
            // サーバーAPIへ送信
            const userID = await sendToBackend(data);

            // 完了画面へ遷移
            window.location.href = `/registration-complete?user_id=${encodeURIComponent(userID)}`;

        } catch (err) {
            console.error(err);
            showError(result, "登録中にエラーが発生しました: " + err.message);
            // 通信エラー時もボタンを再度押せるように戻す
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

    // 避難所選択のチェック（ステータスが避難済みなのに避難所が未選択の場合など）
    // 必要であればここに追加できますが、今回は必須入力チェックのみとします

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