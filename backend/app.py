import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv 

load_dotenv() 

# Firebaseの初期化とロジック
import firebase_admin
from firebase_admin import credentials, firestore

# --- Firebaseの初期化 ---
cred_path = os.path.join(os.path.dirname(__file__), '../advancedprojectexperiment2-firebase-adminsdk-fbsvc-999f94b825.json') 
cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()


app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend")


# テスト用のルート(テスト完了後に削除予定)
@app.route('/')
def hello():
    return 'Hello, Firebase!'

# (テスト) Firestoreへのデータ追加
@app.route('/add')
def add_data():
    try:
        doc_ref = db.collection('users').document('alovelace')
        doc_ref.set({
            'first': 'Ada',
            'last': 'Lovelace',
            'born': 1815
        })
        return jsonify({"success": True, "message": "データを追加しました"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# (テスト) Firestoreからのデータ取得
@app.route('/get')
def get_data():
    try:
        users_ref = db.collection('users')
        docs = users_ref.stream() 
        results = [doc.to_dict() for doc in docs] # リスト内包表記で簡潔に
        return jsonify({"success": True, "data": results}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500



# ラズパイからの検知データを受け付けるAPI
@app.route("/api/detect_beacon", methods=["POST"])
def receive_beacon_data():
    data = request.get_json()
    # 【TODO: Firebaseに検知ログを保存するロジックを実装】
    print(f"ラズパイからデータを受信: {data}")
    return jsonify({"message": "OK"}), 200


# Webアプリのフロントエンド表示（URL識別子を含む）
@app.route("/register/<shelter_id>")
def register_page(shelter_id):
    # index.htmlをレンダリングし、shelter_idをJavaScriptに渡す
    return render_template("registration-complete.html", shelter_id=shelter_id)


if __name__ == "__main__":
    # ローカルネットワークからのアクセスを許可するために '0.0.0.0' を指定
    # 演習時は必ずこの設定にしてください。
    app.run(host="0.0.0.0", port=5001, debug=True)