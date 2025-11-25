// ===============================
// 初期処理
// ===============================

// ===============================
// Firebase / Firestore の設定
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ★ここを自分の firebaseConfig に置き換える
const firebaseConfig = {
    apiKey: "AIzaSyCrNWrnm1XFc4PrUS8uO26kTZpjmTwEXaw",
    authDomain: "advancedprojectexperiment2.firebaseapp.com",
    projectId: "advancedprojectexperiment2",
    storageBucket: "advancedprojectexperiment2.firebasestorage.app",
    messagingSenderId: "1053843660005",
    appId: "1:1053843660005:web:b2444dc5715d318fa9c80c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
            
            const userID = await saveUserToFirestore(data);
            
            //const res = await submitToServer(data);
            //const json = await res.json();

            //if (res.ok) {
                // 成功したら register_complete.html に遷移
                // Flask のテンプレートなら `"/register_complete"` にしてもOK
            //    window.location.href = `/registration-complete?user_id=${data.user_id}`;
            //} else {
            //    showError(result, "エラー：" + (json.error || "不明なエラー"));
            //}
            //
            // Firestore 保存成功後
            window.location.href = `/registration-complete?user_id=${encodeURIComponent(userId)}`;


        } catch (err) {
            console.error(err);
            showError(result, "登録中にエラーが発生しました");
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
// Firestore への保存
// ===============================
async function saveUserToFirestore(data) {
    // user_id をドキュメントIDに使う例
    const usersColRef = collection(db, "users");
    const userRef = doc(usersColRef);
    const userID = userRef.id;

    // Firestore に入れたくない項目があればここで削る
    const firestoreData = {
        user_id: userID,
        shelter_id: data.shelter_id || null,
        last_name: data.last_name,
        first_name: data.first_name,
        last_name_kana: data.last_name_kana,
        first_name_kana: data.first_name_kana,
        email: data.email || null,
        mobile_phone: data.mobile_phone,
        emergency_contact: data.emergency_contact,
        gender: data.gender,
        age: data.age,
        birth: data.birth,     // "YYYY-MM-DD" の文字列で保存
        address: data.address || null,
        job: data.job || null,
        status: data.status,
        notes: data.notes || null,
        beacon_id: data.beacon_id,
        created_at: serverTimestamp()
    };

    await setDoc(userRef, firestoreData);

  // この docRef.id が「一意な user_id」として使える
    return userID;
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
