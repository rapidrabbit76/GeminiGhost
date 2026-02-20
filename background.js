const GEMINI_URL = "https://gemini.google.com/app";

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-temp-chat") {
    await openTempChat();
  }
  if (command === "toggle-sidebar") {
    await toggleSidebar();
  }
  if (command === "cycle-model") {
    await dispatchToGeminiTab("cycle-model");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "open-temp-chat") {
    openTempChat()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === "toggle-sidebar") {
    toggleSidebar()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === "get-shortcut") {
    chrome.commands.getAll((commands) => {
      const cmd = commands.find((c) => c.name === message.commandName);
      sendResponse({ shortcut: cmd?.shortcut || "" });
    });
    return true;
  }

  if (message.action === "cycle-model") {
    dispatchToGeminiTab("cycle-model")
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function openTempChat() {
  const geminiTabs = await chrome.tabs.query({
    url: "https://gemini.google.com/*",
  });

  if (geminiTabs.length > 0) {
    const tab = geminiTabs[0];

    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    try {
      await chrome.tabs.sendMessage(tab.id, { action: "activate-temp-chat" });
    } catch (e) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: activateTempChatInPage,
      });
    }
  } else {
    const newTab = await chrome.tabs.create({ url: GEMINI_URL });

    const listener = async (tabId, changeInfo) => {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(newTab.id, {
              action: "activate-temp-chat",
            });
          } catch (e) {
            await chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: activateTempChatInPage,
            });
          }
        }, 1500);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  }
}

async function dispatchToGeminiTab(action) {
  const geminiTabs = await chrome.tabs.query({
    url: "https://gemini.google.com/*",
  });

  if (geminiTabs.length > 0) {
    const tab = geminiTabs[0];

    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    await chrome.tabs.sendMessage(tab.id, { action });
  } else {
    const newTab = await chrome.tabs.create({ url: GEMINI_URL });

    const listener = async (tabId, changeInfo) => {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        setTimeout(async () => {
          await chrome.tabs.sendMessage(newTab.id, { action });
        }, 1500);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  }
}

async function toggleSidebar() {
  const geminiTabs = await chrome.tabs.query({
    url: "https://gemini.google.com/*",
  });

  if (geminiTabs.length > 0) {
    const tab = geminiTabs[0];

    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    try {
      await chrome.tabs.sendMessage(tab.id, { action: "toggle-sidebar" });
    } catch (e) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: toggleSidebarInPage,
      });
    }
  } else {
    const newTab = await chrome.tabs.create({ url: GEMINI_URL });

    const listener = async (tabId, changeInfo) => {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(newTab.id, { action: "toggle-sidebar" });
          } catch (e) {
            await chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: toggleSidebarInPage,
            });
          }
        }, 1500);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  }
}

function toggleSidebarInPage() {
  const btn = document.querySelector('[data-test-id="side-nav-menu-button"]');
  if (btn) {
    btn.click();
    return;
  }

  const buttons = document.querySelectorAll("button");
  for (const b of buttons) {
    if (
      b.getAttribute("aria-label") === "기본 메뉴" ||
      b.getAttribute("aria-label") === "Main menu"
    ) {
      b.click();
      return;
    }
  }
}

function activateTempChatInPage() {
  const SELECTORS = [
    '[data-test-id="temp-chat-button"]',
    '[aria-label="임시 채팅"]',
    '[aria-label="Temporary chat"]',
    ".temp-chat-button",
  ];

  for (const selector of SELECTORS) {
    const btn = document.querySelector(selector);
    if (btn) {
      if (!btn.classList.contains("temp-chat-on")) btn.click();
      return;
    }
  }

  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    if (
      btn.getAttribute("mattooltip") === "임시 채팅" ||
      btn.getAttribute("mattooltip") === "Temporary chat"
    ) {
      if (!btn.classList.contains("temp-chat-on")) btn.click();
      return;
    }
  }
}
