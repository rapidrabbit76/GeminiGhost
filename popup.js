function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

document.getElementById("shortcut-hint").innerHTML =
  `${t("shortcutOr")} <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>O</kbd>`;

const openBtn = document.getElementById("open-btn");

openBtn.addEventListener("click", async () => {
  openBtn.disabled = true;
  openBtn.querySelector("[data-i18n]").textContent = t("opening");

  try {
    await chrome.runtime.sendMessage({ action: "open-temp-chat" });
    window.close();
  } catch (e) {
    openBtn.disabled = false;
    openBtn.querySelector("[data-i18n]").textContent = t("openTempChat");
  }
});

document.getElementById("settings-link").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});
