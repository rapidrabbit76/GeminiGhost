const SIDEBAR_BUTTON_SELECTOR = '[data-test-id="side-nav-menu-button"]';
const SIDEBAR_BUTTON_ARIA_LABELS = ["기본 메뉴", "Main menu"];

const MODEL_MENU_BUTTON_SELECTOR = '[data-test-id="bard-mode-menu-button"]';

const TEMP_CHAT_SELECTORS = [
  '[data-test-id="temp-chat-button"]',
  '[aria-label="임시 채팅"]',
  '[aria-label="Temporary chat"]',
  ".temp-chat-button",
];

function findTempChatButton() {
  for (const selector of TEMP_CHAT_SELECTORS) {
    const btn = document.querySelector(selector);
    if (btn) return btn;
  }

  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    const tooltip = btn.getAttribute("mattooltip");
    if (tooltip === "임시 채팅" || tooltip === "Temporary chat") {
      return btn;
    }
  }

  return null;
}

function isAlreadyInTempChat() {
  const btn = findTempChatButton();
  return btn?.classList.contains("temp-chat-on") ?? false;
}

async function activateTempChat() {
  const btn = findTempChatButton();

  if (!btn) {
    await waitForButton();
    return;
  }

  if (isAlreadyInTempChat()) {
    return;
  }

  btn.click();
}

function waitForButton(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;

    const observer = new MutationObserver(() => {
      const btn = findTempChatButton();
      if (btn) {
        observer.disconnect();
        if (!btn.classList.contains("temp-chat-on")) {
          btn.click();
        }
        resolve();
      } else if (Date.now() > deadline) {
        observer.disconnect();
        reject(new Error("임시 채팅 버튼을 찾지 못했습니다"));
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function findSidebarButton() {
  const btn = document.querySelector(SIDEBAR_BUTTON_SELECTOR);
  if (btn) return btn;

  const buttons = document.querySelectorAll("button");
  for (const b of buttons) {
    const label = b.getAttribute("aria-label");
    if (SIDEBAR_BUTTON_ARIA_LABELS.includes(label)) return b;
  }

  return null;
}

function toggleSidebar() {
  const btn = findSidebarButton();
  if (btn) {
    btn.click();
    return;
  }
}

function findModelMenuButton() {
  return document.querySelector(MODEL_MENU_BUTTON_SELECTOR);
}

function getCurrentModelLabel() {
  const btn = findModelMenuButton();
  if (!btn) return null;
  const container = btn.querySelector('[data-test-id="logo-pill-label-container"]');
  const span = container?.querySelector("span");
  return span?.textContent?.trim() || null;
}

function isModelMenuOpen() {
  const btn = findModelMenuButton();
  return btn?.getAttribute("aria-expanded") === "true";
}

function findVisibleMenuPanel() {
  const panels = document.querySelectorAll(".mat-mdc-menu-panel");
  for (const panel of panels) {
    const style = window.getComputedStyle(panel);
    if (style.display !== "none" && style.visibility !== "hidden" && panel.offsetParent !== null) {
      return panel;
    }
  }
  return null;
}

function waitForMenuPanel(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const existing = findVisibleMenuPanel();
    if (existing) {
      resolve(existing);
      return;
    }

    const deadline = Date.now() + timeout;

    const check = () => {
      const panel = findVisibleMenuPanel();
      if (panel) return panel;
      return null;
    };

    const observer = new MutationObserver(() => {
      const panel = check();
      if (panel) {
        observer.disconnect();
        resolve(panel);
      } else if (Date.now() > deadline) {
        observer.disconnect();
        reject(new Error("모델 메뉴 패널을 찾지 못했습니다"));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  });
}

async function cycleModel() {
  const menuBtn = findModelMenuButton();
  if (!menuBtn) return;

  const currentLabel = getCurrentModelLabel();

  if (!isModelMenuOpen()) {
    menuBtn.click();
  }

  const panel = await waitForMenuPanel();

  const items = Array.from(
    panel.querySelectorAll("[role='menuitem'], button.mat-mdc-menu-item, button[mat-menu-item]"),
  );
  if (items.length === 0) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return;
  }

  const currentIndex = currentLabel
    ? items.findIndex((item) => item.textContent?.trim().includes(currentLabel))
    : -1;

  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
  items[nextIndex].click();
}

function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

function formatShortcut(shortcut) {
  if (!shortcut) return "";
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  if (!isMac) return shortcut;
  return shortcut
    .replace("MacCtrl", "⌃")
    .replace("Ctrl", "⌃")
    .replace("Alt", "⌥")
    .replace("Shift", "⇧")
    .replace("Command", "⌘")
    .replace(/\+/g, "");
}

function createTooltip() {
  const el = document.createElement("div");
  el.id = "gtc-tooltip";
  el.style.cssText = `
    position: fixed;
    z-index: 99999;
    background: #3c3c3c;
    color: #fff;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 6px 10px;
    border-radius: 6px;
    pointer-events: none;
    white-space: nowrap;
    display: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    line-height: 1.4;
  `;
  document.body.appendChild(el);
  return el;
}

let cachedTempChatShortcut = null;

chrome.runtime.sendMessage({ action: "get-shortcut", commandName: "open-temp-chat" }, (res) => {
  if (chrome.runtime.lastError) return;
  cachedTempChatShortcut = formatShortcut(res?.shortcut || "");
});

function attachTooltip(btn) {
  if (btn.dataset.gtcTooltip) return;
  btn.dataset.gtcTooltip = "1";
  btn.removeAttribute("mattooltip");

  const tooltip = document.getElementById("gtc-tooltip") || createTooltip();

  btn.addEventListener("mouseenter", () => {
    const shortcut = cachedTempChatShortcut || "";
    tooltip.innerHTML = `${t("tooltipLabel")}${shortcut ? ` <span style="opacity:0.6;margin-left:6px;font-size:11px;">${shortcut}</span>` : ""}`;
    tooltip.style.visibility = "hidden";
    tooltip.style.display = "block";

    const rect = btn.getBoundingClientRect();
    tooltip.style.left = rect.right + 8 + "px";
    tooltip.style.top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2 + "px";
    tooltip.style.visibility = "visible";
  });

  btn.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });
}

function observeButton() {
  const btn = findTempChatButton();
  if (btn) attachTooltip(btn);

  new MutationObserver(() => {
    const b = findTempChatButton();
    if (b) attachTooltip(b);
  }).observe(document.body, { childList: true, subtree: true });
}

observeButton();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "activate-temp-chat") {
    activateTempChat()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === "toggle-sidebar") {
    toggleSidebar();
    sendResponse({ success: true });
  }

  if (message.action === "cycle-model") {
    cycleModel()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === "get-temp-chat-status") {
    sendResponse({
      active: isAlreadyInTempChat(),
      buttonFound: !!findTempChatButton(),
    });
  }
});
