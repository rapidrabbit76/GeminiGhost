function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

const isMac = navigator.platform.toUpperCase().includes("MAC");

function renderShortcut(shortcut, fallback) {
  if (shortcut) {
    if (isMac) {
      const label = shortcut
        .replace("MacCtrl", "⌃")
        .replace("Ctrl", "⌃")
        .replace("Alt", "⌥")
        .replace("Shift", "⇧")
        .replace("Command", "⌘")
        .replace(/\+/g, "");
      return `<kbd>${label}</kbd>`;
    }
    return shortcut.split("+").map((k) => `<kbd>${k}</kbd>`).join("");
  }
  return fallback;
}

chrome.commands.getAll((commands) => {
  const tempChatCmd = commands.find((c) => c.name === "open-temp-chat");
  document.getElementById("shortcut-display").innerHTML = renderShortcut(
    tempChatCmd?.shortcut,
    isMac ? "<kbd>⌃⇧O</kbd>" : "<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>O</kbd>",
  );

  const sidebarCmd = commands.find((c) => c.name === "toggle-sidebar");
  document.getElementById("sidebar-shortcut-display").innerHTML = renderShortcut(
    sidebarCmd?.shortcut,
    isMac ? "<kbd>⌃⇧S</kbd>" : "<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>S</kbd>",
  );
});

document.getElementById("shortcuts-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
