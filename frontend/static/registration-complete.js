// ===== ユーザーIDを表示 =====
const userIdEl = document.getElementById("userId");
const serverUserId = window.__USER_ID__ || sessionStorage.getItem("user_id");

if (serverUserId) {
  userIdEl.textContent = serverUserId;
}

// ===== コピー機能 =====
const copyBtn = document.getElementById("copyBtn");
copyBtn.addEventListener("click", async () => {
  const text = userIdEl.textContent.trim();
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "コピーしました";
    setTimeout(() => (copyBtn.textContent = "コピー"), 1600);
  } catch (e) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    copyBtn.textContent = "コピーしました";
    setTimeout(() => (copyBtn.textContent = "コピー"), 1600);
  }
});

// ===== 各ボタンの遷移処理 =====
document.getElementById("openShelters").onclick = () => {
  const uid = encodeURIComponent(userIdEl.textContent.trim());
  location.href = `/shelters?user_id=${uid}`;
};

document.getElementById("openSearch").onclick = () => {
  const uid = encodeURIComponent(userIdEl.textContent.trim());
  location.href = `/search?user_id=${uid}`;
};

document.getElementById("goHome").onclick = () => {
  location.href = "/";
};
