import { co2 as CO2 } from "@tgwf/co2";
import { calculateNewScore, checkBadgeUnlocks } from "./gamification.js";

const co2 = new CO2();

const notificationData = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.startsWith("http")
  ) {
    analyzeUrlAndNotify(tab.url);
  }
});

async function analyzeUrlAndNotify(urlString) {
  let isGreen = false;
  const url = new URL(urlString);
  const domain = url.hostname;

  try {
    const data = await fetchWithRetry(
      `https://api.thegreenwebfoundation.org/api/v3/greencheck/${domain}`
    );
    isGreen = data.green;
  } catch (error) {
    console.error(
      `Could not analyze URL after multiple retries: ${urlString}`,
      error
    );
  }

  if (!isGreen) {
    chrome.storage.sync.get(["suggestionCache"], (result) => {
      const cache = result.suggestionCache || {};
      if (cache[domain]) {
        showCachedSuggestion(domain, cache[domain]);
      } else {
        showInitialPrompt(domain);
      }
    });
  }

  updateStats(isGreen);
}

chrome.notifications.onButtonClicked.addListener(
  async (notificationId, buttonIndex) => {
    if (notificationId.startsWith("ai-prompt-")) {
      const { domain } = notificationData[notificationId];
      console.log(
        `User wants an AI alternative for: ${domain}. Calling backend...`
      );
      const suggestion = await getAISuggestion(domain);
      if (suggestion) {
        showAISuggestion(domain, suggestion);
      } else {
        console.error("AI suggestion failed, not showing notification.");
      }
      chrome.notifications.clear(notificationId);
    }
  }
);

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith("ai-suggestion-")) {
    const { originalDomain, suggestionUrl } = notificationData[notificationId];
    chrome.tabs.create({ url: `http://${suggestionUrl}` });
    console.log(
      `User accepted suggestion. Caching: ${originalDomain} -> ${suggestionUrl}`
    );
    cacheSuggestion(originalDomain, suggestionUrl);
    chrome.notifications.clear(notificationId);
    delete notificationData[notificationId];
  } else if (notificationId.startsWith("cached-suggestion-")) {
    const { cachedUrl } = notificationData[notificationId];
    chrome.tabs.create({ url: `http://${cachedUrl}` });
    chrome.notifications.clear(notificationId);
    delete notificationData[notificationId];
  }
});


function showInitialPrompt(domain) {
  const notificationId = `ai-prompt-${domain}`;
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("images/icon128.png"),
    title: "🤔 Sustainable Browsing",
    message: `This site isn't green. Find an alternative with AI?`,
    buttons: [{ title: "Yes, find an alternative" }],
  });
  notificationData[notificationId] = { domain };
}

function showAISuggestion(originalDomain, suggestionUrl) {
  const notificationId = `ai-suggestion-${originalDomain}`;
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("images/icon128.png"),
    title: "💡 AI Suggestion Found!",
    message: `AI suggests trying: ${suggestionUrl}. Click to go now.`,
    isClickable: true,
  });
  notificationData[notificationId] = { originalDomain, suggestionUrl };
}

function showCachedSuggestion(domain, cachedUrl) {
  const notificationId = `cached-suggestion-${domain}`;
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("images/icon128.png"),
    title: "🧠 Greener Choice Found!",
    message: `Remember, this site isn't green. A greener choice is: ${cachedUrl}`,
    isClickable: true,
  });

  notificationData[notificationId] = { cachedUrl };
}


async function getAISuggestion(domain) {
  try {
    const response = await fetch("http://127.0.0.1:5000/find-alternative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.alternative;
  } catch (error) {
    console.error("Failed to fetch AI suggestion:", error);
    return null;
  }
}

async function cacheSuggestion(originalDomain, suggestedDomain) {
  chrome.storage.sync.get(["suggestionCache"], (result) => {
    const cache = result.suggestionCache || {};
    cache[originalDomain] = suggestedDomain;
    chrome.storage.sync.set({ suggestionCache: cache });
  });
}

function updateStats(isGreen) {
  const bytes = 2000000;
  const estimatedCO2 = co2.perByte(bytes, isGreen);

  chrome.storage.sync.get(["dailyStats"], (result) => {
    const today = new Date().toISOString().split("T")[0];
    let stats = result.dailyStats || {};
    if (!stats.date || stats.date !== today) {
      stats = {
        date: today,
        co2: 0,
        greenVisits: 0,
        totalVisits: 0,
        points: 0,
        badges: [],
      };
    }
    const currentPoints = stats.points || 0;
    const currentBadges = stats.badges || [];
    const newPoints = calculateNewScore(currentPoints, isGreen);
    const newBadges = checkBadgeUnlocks(newPoints, currentBadges);
    stats.co2 = (stats.co2 || 0) + estimatedCO2;
    stats.totalVisits += 1;
    stats.points = newPoints;
    stats.badges = newBadges;
    if (isGreen) {
      stats.greenVisits += 1;
    }
    chrome.storage.sync.set({ dailyStats: stats });
    console.log("Saved updated stats:", stats);
  });
}

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed for ${url}. Retrying...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}
