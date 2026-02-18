function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

document.getElementById("shortcut-display").innerHTML =
  "<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>O</kbd>";

document.getElementById("shortcuts-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
