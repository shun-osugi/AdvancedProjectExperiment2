import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import math

load_dotenv()

# Firebaseの初期化とロジック
import firebase_admin
from firebase_admin import credentials, firestore

# --- Firebaseの初期化 ---
cred_path = os.path.join(
    os.path.dirname(__file__),
    "../advancedprojectexperiment2-firebase-adminsdk-fbsvc-999f94b825.json",
)
cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()


app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend")

'''''
# (テスト) Firestoreへのデータ追加
@app.route("/add")
def add_data():
    try:
        doc_ref = db.collection("users").document("alovelace")
        doc_ref.set({"first": "Ada", "last": "Lovelace", "born": 1815})
        return jsonify({"success": True, "message": "データを追加しました"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# (テスト) Firestoreからのデータ取得
@app.route("/get")
def get_data():
    try:
        users_ref = db.collection("users")
        docs = users_ref.stream()
        results = [doc.to_dict() for doc in docs]  # リスト内包表記で簡潔に
        return jsonify({"success": True, "data": results}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
'''

# ラズパイからの検知データを受け付けるAPI
@app.route("/api/detect_beacon", methods=["POST"])
def receive_beacon_data():
    """
    ラズパイ(ゲートウェイ)からビーコン検知情報を受け取るAPI
    ローカル版のログ機能と、タスク3のDB保存機能を実装
    """
    # 1. ローカル版の堅牢なリクエストチェック
    if not request.is_json:
        print("!!! [受信エラー] !!! リクエストがJSONではありません。")
        return jsonify({"error": "Invalid request: JSON required"}), 400

    data = request.json

    # 2. ローカル版の詳細なprintロジック (コンソール確認用)
    print("--- [ビーコン検知ログ受信] ---")
    print(f"  ゲートウェイID: {data.get('gateway_id')}")
    print(f"  UUID: {data.get('uuid')}")
    print(f"  Major: {data.get('major')}")
    print(f"  Minor: {data.get('minor')}")
    print(f"  RSSI: {data.get('rssi')}")
    print("-" * 30)

    # 3. 【タスク3】Firebase (Firestore) への検知ログ保存
    try:
        # 保存するデータにサーバー側のタイムスタンプを追加
        log_data = {
            "gateway_id": data.get("gateway_id"),
            "uuid": data.get("uuid"),
            "major": data.get("major"),
            "minor": data.get("minor"),
            "rssi": data.get("rssi"),
            # Firestoreのサーバータイムスタンプ (推奨)
            "timestamp": firestore.SERVER_TIMESTAMP,
        }

        # 'beacon_logs' コレクションにドキュメントを自動IDで追加
        # (コレクション名はここで指定)
        db.collection("beacon_logs").add(log_data)

        print("  [DB保存成功] Firestore 'beacon_logs' に書き込みました。")

    except Exception as e:
        print("!!! [DB保存エラー] !!! Firestoreへの書き込みに失敗しました。")
        print(f"  エラー詳細: {e}")
        # DBエラーが発生しても、検知自体は成功しているのでラズパイには成功を返す
        pass

    # 4. ローカル版の成功レスポンス
    return jsonify({"status": "success", "received_data": data}), 200

# 距離計算用の関数
def calculate_distance(lat1, lng1, lat2, lng2):
    R = 6371.0  # 地球の半径 (km)
    
    # ラジアンに変換
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)
    
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

# 近くの避難所を取得するAPI
@app.route("/api/shelters", methods=["GET"])
def get_nearby_shelters():
    try:
        # 1. クエリパラメータの取得
        current_lat = request.args.get("lat", type=float)
        current_lng = request.args.get("lng", type=float)
        radius_km = request.args.get("radius_km", default=5.0, type=float) # デフォルト5km

        if current_lat is None or current_lng is None:
            return jsonify({"error": "lat and lng are required"}), 400

        # 2. Firestoreから全避難所を取得
        # (注: FirestoreはGeoクエリが苦手なため、件数が少なければ全件取得してアプリ側でフィルタリングするのが一般的です)
        docs = db.collection("shelters").stream()
        
        nearby_shelters = []
        
        for doc in docs:
            data = doc.to_dict()
            # データ内の lat, lng を取得
            s_lat = data.get("lat")
            s_lng = data.get("lng")
            
            if s_lat is None or s_lng is None:
                continue

            # 3. 距離計算
            dist = calculate_distance(current_lat, current_lng, s_lat, s_lng)
            
            # 4. 半径以内ならリストに追加
            if dist <= radius_km:
                # フロント表示用に距離情報も追加しておくと親切です
                data["distance_km"] = round(dist, 2) 
                nearby_shelters.append(data)

        # 距離が近い順にソート
        nearby_shelters.sort(key=lambda x: x["distance_km"])

        return jsonify(nearby_shelters), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Webアプリのフロントエンド表示 ---

@app.route("/")
def index_page():
    """トップページ (index.html) を表示"""
    return render_template("index.html")


@app.route("/search")
def search_page():
    """安否確認検索ページ (search.html) を表示"""
    return render_template("search.html")


@app.route("/shelter_list")
def shelter_list_page():
    """避難所一覧ページ (shelter_list.html) を表示"""
    return render_template("shelter_list.html")

@app.route("/register")
def register_page_no_id():
    """登録ページ (register.html) を表示"""
    return render_template("register.html")

# Webアプリのフロントエンド表示（URL識別子を含む）
@app.route("/register/<shelter_id>")
def register_page(shelter_id):
    # index.htmlをレンダリングし、shelter_idをJavaScriptに渡す
    return render_template("registration-complete.html", shelter_id=shelter_id)


if __name__ == "__main__":
    # ローカルネットワークからのアクセスを許可するために '0.0.0.0' を指定
    # 演習時は必ずこの設定にしてください。
    app.run(host="0.0.0.0", port=5001, debug=True)
