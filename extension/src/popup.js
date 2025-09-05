// Store the previous badge to detect changes
let previousBadge = null;

// Function to update the UI with data from storage
function updateUI(data) {
  document.getElementById("co2-emissions").textContent = (
    data.co2 || 0
  ).toFixed(2);
  document.getElementById("green-sites").textContent = `${
    data.greenVisits || 0
  } / ${data.totalVisits || 0}`;

  // Animate points change
  const pointsElement = document.getElementById("points");
  const newPoints = data.points || 0;
  const currentPoints = parseInt(pointsElement.textContent) || 0;

  if (newPoints !== currentPoints) {
    pointsElement.style.transform = "scale(1.2)";
    pointsElement.style.transition = "transform 0.3s ease";
    setTimeout(() => {
      pointsElement.textContent = newPoints;
      pointsElement.style.transform = "scale(1)";
    }, 150);
  } else {
    pointsElement.textContent = newPoints;
  }

  // Determine badge based on points
  let badge = "Newbie";
  if (data.points >= 100) badge = "Eco Warrior";
  else if (data.points >= 50) badge = "Eco Starter";

  // Animate badge change
  const badgeElement = document.getElementById("badge");
  const badgeContainer = badgeElement.parentElement;

  if (previousBadge !== null && previousBadge !== badge) {
    // Badge has changed - animate it
    badgeElement.style.opacity = "0";
    badgeElement.style.transform = "translateY(-10px)";
    badgeElement.style.transition = "all 0.3s ease";

    // Add a glow effect to the container
    badgeContainer.classList.add("badge-celebrating");

    // Create confetti effect
    createConfetti(badgeContainer);

    // Play a subtle sound effect (optional)
    playBadgeSound();

    setTimeout(() => {
      badgeElement.textContent = badge;
      badgeElement.style.opacity = "1";
      badgeElement.style.transform = "translateY(0)";

      // Update badge color based on level
      if (badge === "Eco Warrior") {
        badgeElement.className = "text-lg font-bold text-green-600";
      } else if (badge === "Eco Starter") {
        badgeElement.className = "text-lg font-bold text-blue-600";
      } else {
        badgeElement.className = "text-lg font-bold text-yellow-600";
      }

      // Remove glow after animation
      setTimeout(() => {
        badgeContainer.classList.remove("badge-celebrating");
      }, 1000);
    }, 300);
  } else {
    badgeElement.textContent = badge;
  }

  previousBadge = badge;
}

// Function to create confetti particles
function createConfetti(container) {
  const colors = ["#fbbf24", "#f59e0b", "#10b981", "#3b82f6"];
  const particles = 8;

  for (let i = 0; i < particles; i++) {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.className = "confetti-particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      particle.style.width = Math.random() * 6 + 4 + "px";
      particle.style.height = particle.style.width;
      particle.style.borderRadius = "50%";

      container.style.position = "relative";
      container.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }, i * 50);
  }
}

// Function to play a subtle celebration sound
function playBadgeSound() {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a pleasant ascending tone
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(
      659.25,
      audioContext.currentTime + 0.1
    ); // E5
    oscillator.frequency.exponentialRampToValueAtTime(
      783.99,
      audioContext.currentTime + 0.2
    ); // G5

    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    // Silently fail if audio is not supported or blocked
    console.log("Could not play sound:", error);
  }
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
      console.log("Data:", data);
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
  chrome.storage.sync.get(["dailyStats"], (result) => {
    const data = {
      co2: result.dailyStats?.co2 || 0,
      greenVisits: result.dailyStats?.greenVisits || 0,
      totalVisits: result.dailyStats?.totalVisits || 0,
      points: result.dailyStats?.points || 0,
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
  if (namespace === "sync" && changes.dailyStats) {
    const data = {
      co2: changes.dailyStats.newValue?.co2 || 0,
      greenVisits: changes.dailyStats.newValue?.greenVisits || 0,
      totalVisits: changes.dailyStats.newValue?.totalVisits || 0,
      points: changes.dailyStats.newValue?.points || 0,
    };
    console.log("Updated data from storage change:", data);
    updateUI(data);
  }
});
