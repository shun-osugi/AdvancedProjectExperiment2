from flask import Flask, request, jsonify, render_template
import os
from dotenv import load_dotenv
# Firebaseの初期化とロジックはこの後に実装
# import firebase_admin

load_dotenv()  # .envファイルを読み込む

app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend")


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
    return render_template("index.html", shelter_id=shelter_id)


if __name__ == "__main__":
    # ローカルネットワークからのアクセスを許可するために '0.0.0.0' を指定
    # 演習時は必ずこの設定にしてください。
    app.run(host="0.0.0.0", port=5001, debug=True)
