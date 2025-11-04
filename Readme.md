# 災害避難所名簿自動登録システム (演習用) 🏠

本プロジェクトは、**Raspberry Pi**（ゲートウェイ）と連携し、Webブラウザから名簿情報を登録する際に、**アクセス場所を自動的に識別・記録する**システムです。

---

## ⚙️ 技術スタック

| 分野               | 技術               | 詳細                                 |
| :----------------- | :----------------- | :----------------------------------- |
| **Python Version** | 3.12.9             | **全員で統一する必須バージョン**     |
| **バックエンド**   | Flask (Python)     | APIサーバーを担当                    |
| **パッケージ管理** | uv                 | 高速な仮想環境とライブラリ管理ツール |
| **データベース**   | Firebase Firestore | Admin SDK経由でデータ永続化          |
| **ゲートウェイ**   | Raspberry Pi       | BLEビーコンの検知を担当              |

---

## 🚀 開発環境のセットアップ (チームメンバー全員が必須)

**目標**: 全員が **Python 3.12.9** 環境で、依存ライブラリをインストールした仮想環境を使用すること。

### 1. Pythonバージョンの統一 (3.12.9)

チームメンバー全員が Python 3.12.9 を使用してください。

* **インストール**:
    * **Mac/Linux (pyenv)**:
        ```bash
        pyenv install 3.12.9
        ```
    * **Windows (pyenv-win推奨)**: `pyenv-win`を使用するか、公式インストーラーから 3.12.9 をインストールします。
* **プロジェクトでのバージョン切り替え (Mac/Linux)**:
    プロジェクトのルートディレクトリで実行します。
    ```bash
    pyenv shell 3.12.9
    ```

**# 確認**

```bash
python --version
```

### 2. 仮想環境の構築とライブラリのインストール (uvを使用)

* **uvのインストール** (未インストールの人のみ):
    ```bash
    pip install uv
    ```
* **仮想環境の作成**:
    ```bash
    uv venv venv
    ```
* **OSごとの仮想環境のアクティベート**:
    ターミナルごとに、以下のいずれかを実行してください。
    * **Mac/Linux**:
        ```bash
        source venv/bin/activate
        ```
    * **Windows (Command Prompt / PowerShell)**:
        ```bash
        .\venv\Scripts\activate
        ```
    > ターミナル行の先頭に `(venv)` と表示されれば成功です。
* **依存ライブラリのインストール**:
    `requirements.txt` を使って、必要なすべてのライブラリをインストールします。
    ```bash
    uv pip install -r requirements.txt
    ```


## 🌐 Flaskサーバーの起動と確認

### 1. Flaskサーバーの起動

プロジェクトルートディレクトリで、**必ず仮想環境が有効な状態（`(venv)`がある状態）** で以下のコマンドを実行します。

```bash
# プロジェクトルートから実行
python backend/app.py
```

サーバーが起動したら、ログに以下のような行が表示されます。

```log
 * Running on all addresses (0.0.0.0)
 * Running on [http://127.0.0.1:5001](http://127.0.0.1:5001)
 ```
 
 ### 2. Webアプリの動作確認

ブラウザを開き、以下のURLにアクセスして、**名簿登録フォームが表示されるか**を確認してください。

* **URL**: `http://127.0.0.1:5001/register/SHELTER_A1`

#### ✅ 成功ログの確認

ターミナルのログに以下の2つのリクエストが **`200 -` (200 OK)** になっていることを確認してください。

```log
"GET /register/SHELTER_A1 HTTP/1.1" 200 -
"GET /static/script.js HTTP/1.1" 200 -
```

### 3. APIエンドポイントの確認 (ラズパイ連携部分)

このエンドポイントは **POST のみ**を受け付けます。ブラウザでアクセスした場合、以下のエラーが出るのが正しい動作です。

* **URL**: `http://127.0.0.1:5001/api/detect_beacon`
* **結果**: **`405 (Method Not Allowed)`** が表示される。


## 🔥 Firebaseのセットアップと接続確認 (11/04 追記)

バックエンドサーバー（Flask）からデータベース（Firestore）に接続するための追加設定です。

### 1. Firebase 秘密鍵の設定 (最重要)

Firebaseへの接続には、**サービスアカウントの秘密鍵 (JSONファイル)** が必要です。

1.  **秘密鍵の入手:**
    * 秘密鍵のJSONファイルをSlackのDMに送信します。
    * （ファイル名: `advancedprojectexperiment2-firebase-adminsdk-fbsvc-999f94b825.json`）

2.  **ファイルの配置:**
    * 入手したJSONファイルを、**プロジェクトフォルダの直下**に配置してください。

    ```
    プロジェクトルート/
    ├── backend/
    │   └── app.py
    ├── venv/
    ├── Readme.md
    ├── requirements.txt
    └── advancedprojectexperiment2-firebase-adminsdk-fbsvc-999f94b825.json  <--- (ここに入手したファイルを置く)
    ```

3.  **`.gitignore` の確認 (必須！)**
    * 秘密鍵ファイルが誤ってGitにコミットされるのを防ぐため、プロジェクトルートの `.gitignore` に秘密鍵のファイル名が記載されているか**必ず確認**してください。

    ```gitignore
    # .gitignore (プロジェクトルートに配置)

    # Firebase
    # キーファイル名は環境によって異なる可能性があるため、自分のファイル名に置き換えてください
    advancedprojectexperiment2-firebase-adminsdk-fbsvc-999f94b825.json
    ```

---

### 2. 依存関係のトラブルシューティング (`packaging`)
以下のコマンドで `packaging` を明示的に **venv へ**インストールしてください。

```bash
# venv を有効化した状態で実行
uv pip install packaging
```

### 3. Firestore 接続確認

`app.py` には、Firestoreとの接続をテストするためのAPIが用意されています。コメントアウトを外して実行してください．

1.  **Flaskサーバーの起動:**
    `venv` を有効化した状態で、プロジェクトルートからサーバーを起動します。

    ```bash
    # venv が有効化された状態で、プロジェクトルートから実行
    python backend/app.py
    ```

2.  **接続テストの実行:**
    サーバーが起動したら（`Running on http://127.0.0.1:5001/` と表示されたら）、Webブラウザで以下のURLに順番にアクセスします。

    * **① 書き込みテスト:**
        `http://127.0.0.1:5001/add`
        → ブラウザに `{"success": true, "message": "データを追加しました"}` と表示されればOKです。

    * **② 読み取りテスト:**
        `http://127.0.0.1:5001/get`
        → ブラウザに `{"success": true, "data": [{"born": 1815, ...}]}` のように、`data` が表示されればOKです。

    * **③ Firebaseコンソールでの最終確認:**
        Firebaseコンソールにログインし、「Firestore Database」に `users` コレクションが作成され、`alovelace` ドキュメントが追加されていることを確認してください。
