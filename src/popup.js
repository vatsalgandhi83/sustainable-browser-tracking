// Function to update the UI with data from storage
function updateUI(data) {
  document.getElementById("co2-emissions").textContent = (
    data.co2 || 0
  ).toFixed(2);
  document.getElementById("green-sites").textContent = `${
    data.greenVisits || 0
  } / ${data.totalVisits || 0}`;
  document.getElementById("points").textContent = data.points || 0;

  // Determine badge based on points
  let badge = "Newbie";
  if (data.points >= 100) badge = "Eco Warrior";
  else if (data.points >= 50) badge = "Eco Starter";
  document.getElementById("badge").textContent = badge;
}

// Function to check the status of the currently active tab
async function checkCurrentTabStatus() {
  const tabInfoDiv = document.getElementById("current-tab-info");

  // 1. Get the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 2. Check if it's a valid web page
  if (tab && tab.url && tab.url.startsWith("http")) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      // 3. Fetch its green status from the API
      const response = await fetch(
        `https://api.thegreenwebfoundation.org/api/v3/greencheck/${domain}`
      );
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const data = await response.json();

      // 4. Update the UI with the result
      updateTabStatusUI(data.green, tabInfoDiv);
    } catch (error) {
      console.error("Error checking current tab:", error);
      tabInfoDiv.innerHTML = `<p class="font-bold text-red-500">Could not check status.</p>`;
      tabInfoDiv.className = "text-center p-2 rounded-md bg-red-100";
    }
  } else {
    tabInfoDiv.innerHTML = `<p class="font-bold text-gray-500">Not a valid web page.</p>`;
    tabInfoDiv.className = "text-center p-2 rounded-md bg-gray-100";
  }
}

// Helper function to update the "Current Tab Status" UI
function updateTabStatusUI(isGreen, element) {
  element.innerHTML = ""; // Clear the "Checking..." text
  if (isGreen) {
    element.className =
      "text-center p-2 rounded-md bg-green-100 text-green-800";
    element.innerHTML = `<p class="font-bold">This site is Green Hosted!</p>`;
  } else {
    element.className =
      "text-center p-2 rounded-md bg-yellow-100 text-yellow-800";
    element.innerHTML = `<p class="font-bold">Not on renewable energy.</p><p class="text-xs">Consider using Low Power Mode.</p>`;
  }
}

// Listen for when the popup is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get the latest data from storage and update the UI for overall stats
  chrome.storage.sync.get(["dailyStats", "points"], (result) => {
    const data = {
      co2: result.dailyStats?.co2 || 0,
      greenVisits: result.dailyStats?.greenVisits || 0,
      totalVisits: result.dailyStats?.totalVisits || 0,
      points: result.points || 0,
    };
    console.log("Popup data:", data);
    updateUI(data);
  });

  // Check the status of the current tab as soon as the popup opens
  checkCurrentTabStatus();

  // Handle the grayscale toggle button click
  const grayscaleBtn = document.getElementById("toggle-grayscale");
  grayscaleBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleGrayscale" });
      }
    });
  });
});

// Listen for real-time updates from the background script for the overall stats
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    chrome.storage.sync.get(["dailyStats", "points"], (result) => {
      const data = {
        co2: result.dailyStats?.co2 || 0,
        greenVisits: result.dailyStats?.greenVisits || 0,
        totalVisits: result.dailyStats?.totalVisits || 0,
        points: result.points || 0,
      };
      console.log("Updated data:", data);
      updateUI(data);
    });
  }
});
