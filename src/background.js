import { co2 as CO2 } from "@tgwf/co2";
import { calculateNewScore, checkBadgeUnlocks } from "./gamification.js";

const co2 = new CO2();

console.log("=== Tracker service worker started. ===");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.startsWith("http")
  ) {
    analyzeUrl(tab.url);
  }
});

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(
        `Attempt ${i + 1} failed for ${url}. Retrying in ${delay}ms...`
      );
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

async function analyzeUrl(urlString) {
  let isGreen = false;
  try {
    const url = new URL(urlString);
    const domain = url.hostname;

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
    console.log("Saved updated stats with correct CO2:", stats);
  });
}

const notificationData = {};

function showInitialPrompt(domain) {
  const notificationId = `ai-prompt-${domain}`;
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'images/icon128.png', 
    title: 'Sustainable Browsing Tracker',
    message: `This site isn't green. Find a sustainable alternative with AI?`,
    buttons: [{ title: 'Yes, find an alternative' }]
  });
  notificationData[notificationId] = { domain };
}

function showAISuggestion(originalDomain, suggestionUrl) {
  const notificationId = `ai-suggestion-${originalDomain}`;
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: 'AI Suggestion Found!',
    message: `AI suggests trying: ${suggestionUrl}. Click here to go now.`,
  });
  notificationData[notificationId] = { originalDomain, suggestionUrl };
}


chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('ai-prompt-')) {
    const { domain } = notificationData[notificationId];
    console.log(`User wants an AI alternative for: ${domain}. Calling backend...`);
    setTimeout(() => {
        const fakeSuggestion = `https://www.ecosia.org/search?q=${domain}%20alternative`;
        showAISuggestion(domain, fakeSuggestion);
    }, 2000);
    
    chrome.notifications.clear(notificationId);
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('ai-suggestion-')) {
    const { originalDomain, suggestionUrl } = notificationData[notificationId];
    
    chrome.tabs.create({ url: suggestionUrl });
    
    console.log(`User accepted suggestion. Caching: ${originalDomain} -> ${suggestionUrl}`);

    chrome.notifications.clear(notificationId);
    delete notificationData[notificationId]; 
  }
});
