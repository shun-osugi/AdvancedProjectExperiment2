// ===============================
// 初期処理
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registration-form");
    const result = document.getElementById("result-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // ← ここで「通常のフォーム送信」を止めている

        clearMessage(result);

        const data = collectFormData(form);

        const validationError = validate(data);
        if (validationError) {
            showError(result, validationError);
            return;
        }

        try {
            const res = await submitToServer(data);
            const json = await res.json();

            if (res.ok) {
                // 成功したら register_complete.html に遷移
                // Flask のテンプレートなら `"/register_complete"` にしてもOK
                window.location.href = `/registration-complete?user_id=${data.user_id}`;
            } else {
                showError(result, "エラー：" + (json.error || "不明なエラー"));
            }

        } catch (err) {
            console.error(err);
            showError(result, "通信エラーが発生しました");
        }
    });
});


// ===============================
// 1. フォーム入力値収集
// ===============================
function collectFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // 数値に変換するフィールド
    if (data.age) data.age = Number(data.age);

    // Firestore に入れる際は user_id を beacon_id と同じにする
    data.user_id = data.beacon_id;

    // 生年月日が空なら null に
    data.birth = data.birth || null;

    return data;
}


// ===============================
// 2. バリデーション
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
        birth: "生年月日",
        status: "避難ステータス",
        beacon_id: "ビーコンID"
    };

    for (const key in requiredFields) {
        if (!data[key] || data[key].trim() === "") {
            return `${requiredFields[key]}は必須入力です`;
        }
    }

    // 電話番号チェック（かなりゆるめ）
    if (!/^[0-9\-]+$/.test(data.mobile_phone)) {
        return "携帯電話番号の形式が正しくありません";
    }
    if (!/^[0-9\-]+$/.test(data.emergency_contact)) {
        return "緊急連絡先の形式が正しくありません";
    }

    // 年齢チェック
    if (isNaN(data.age) || data.age < 0 || data.age > 120) {
        return "年齢の値が不正です";
    }

    // 生年月日の形式チェック（YYYY-MM-DD）
    if (data.birth && !/^\d{4}-\d{2}-\d{2}$/.test(data.birth)) {
        return "生年月日の形式は YYYY-MM-DD です";
    }

    return null; // 問題なし
}


// ===============================
// 3. サーバー（Flask）へ送信
// ===============================
function submitToServer(data) {
    return fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}


// ===============================
// 4. メッセージ表示まわり
// ===============================
function showError(target, msg) {
    target.style.color = "red";
    target.textContent = msg;
}

function showSuccess(target, msg) {
    target.style.color = "green";
    target.textContent = msg;
}

function clearMessage(target) {
    target.textContent = "";
}
