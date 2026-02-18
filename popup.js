function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

function formatShortcutKeys(shortcut) {
  if (!shortcut) return "";
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  if (isMac) {
    return shortcut
      .replace("MacCtrl", "⌃")
      .replace("Ctrl", "⌃")
      .replace("Alt", "⌥")
      .replace("Shift", "⇧")
      .replace("Command", "⌘")
      .replace(/\+/g, "");
  }
  return shortcut.split("+").map((k) => `<kbd>${k}</kbd>`).join("");
}

chrome.commands.getAll((commands) => {
  const cmd = commands.find((c) => c.name === "open-temp-chat");
  const label = formatShortcutKeys(cmd?.shortcut || "");
  const hintEl = document.getElementById("shortcut-hint");
  if (label) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    hintEl.innerHTML = isMac
      ? `${t("shortcutOr")} <kbd>${label}</kbd>`
      : `${t("shortcutOr")} ${label}`;
  } else {
    hintEl.innerHTML = `${t("shortcutOr")} <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>O</kbd>`;
  }
});

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
