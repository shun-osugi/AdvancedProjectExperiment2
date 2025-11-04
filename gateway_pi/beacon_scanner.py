import asyncio
import requests
from bleak import BleakScanner

# --- 設定項目 ---
# ターゲットビーコンのUUID (ハイフンなし)
TARGET_UUID = "F358693D49C750E85012C5D7F2979806"
# 送信先Flaskサーバー
FLASK_SERVER_URL = "http://192.168.92.175:5001/api/detect_beacon"
# ラズパイのゲートウェイID (場所の識別に使う)
GATEWAY_ID = "raspberrypi_01"
# -----------------


def parse_ibeacon_data(data: bytes):
    """
    iBeaconのManufacturer Data (キー76の値) を解析する
    """
    # 1. iBeacon識別子 (0x0215) かどうかをチェック (バイト 0-1)
    if data[:2] != b"\x02\x15":
        return None

    # 2. データの長さをチェック (最低23バイト必要)
    if len(data) < 23:
        return None

    try:
        # 3. 各データを抽出
        # UUID (バイト 2-17)
        uuid = data[2:18].hex().upper()
        # Major (バイト 18-19)
        major = int.from_bytes(data[18:20], byteorder="big")
        # Minor (バイト 20-21)
        minor = int.from_bytes(data[20:22], byteorder="big")
        # Tx Power (バイト 22)
        tx_power = int.from_bytes(data[22:23], byteorder="big", signed=True)

        return {"uuid": uuid, "major": major, "minor": minor, "tx_power": tx_power}
    except Exception as e:
        print(f"[エラー] iBeaconデータ解析失敗: {e}")
        return None


def send_to_flask(beacon_info, rssi):
    """
    解析したビーコン情報をFlaskサーバーにPOSTする (タスク2)
    """
    payload = {
        "gateway_id": GATEWAY_ID,
        "uuid": beacon_info["uuid"],
        "major": beacon_info["major"],
        "minor": beacon_info["minor"],
        "rssi": rssi,
        # tx_power はデバッグ用に含めても良い
        # "tx_power": beacon_info["tx_power"]
    }

    try:
        response = requests.post(FLASK_SERVER_URL, json=payload, timeout=5)
        print(f"--- [送信成功] ---")
        print(f"  データ: {payload}")
        print(f"  レスポンス: {response.status_code}")
        print("-" * 20)
    except requests.exceptions.RequestException as e:
        print(f"!!! [送信失敗] !!! Flaskサーバー({FLASK_SERVER_URL})に接続できません。")
        # print(f"  エラー詳細: {e}") # デバッグ時にコメント解除


def detection_callback(device, advertisement_data):
    """
    BLEデバイスを検知したときに呼ばれるコールバック
    """
    # 1. Manufacturer Data (キー76: Apple) があるかチェック
    manufacturer_data = advertisement_data.manufacturer_data.get(76)  # 76 = 0x004C

    if manufacturer_data:
        # 2. iBeaconデータとして解析を試みる
        beacon_info = parse_ibeacon_data(manufacturer_data)

        if beacon_info:
            # 3. ターゲットUUIDと一致するかフィルタリング
            if beacon_info["uuid"] == TARGET_UUID:
                print(f"*** [ターゲットiBeacon検知] ***")
                print(f"  Address: {device.address}")
                print(f"  RSSI: {advertisement_data.rssi} dBm")
                print(f"  Data: {beacon_info}")

                # 4. Flaskサーバーに送信
                send_to_flask(beacon_info, advertisement_data.rssi)

            # else:
            #    # ターゲット以外のiBeaconを検知した場合 (デバッグ用)
            #    print(f"[他iBeacon検知] {beacon_info['uuid']}")


async def main():
    print("BLEスキャナ(iBeacon)を起動します...")
    print(f"ターゲットUUID: {TARGET_UUID}")
    print(f"送信先: {FLASK_SERVER_URL}")

    # スキャナをコールバックモードで起動
    scanner = BleakScanner(detection_callback=detection_callback)

    try:
        await scanner.start()
        # プログラムが終了しないように無限ループ
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("スキャンを停止します。")
    finally:
        await scanner.stop()


if __name__ == "__main__":
    # Python 3.9.2 (ラズパイ) で実行
    asyncio.run(main())
