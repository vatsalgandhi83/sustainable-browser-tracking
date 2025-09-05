let previousBadge = null;

function updateUI(data) {
  document.getElementById("co2-emissions").textContent = (
    data.co2 || 0
  ).toFixed(2);
  document.getElementById("green-sites").textContent = `${
    data.greenVisits || 0
  } / ${data.totalVisits || 0}`;

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

  let badge = "Newbie";
  if (data.points >= 100) badge = "Eco Warrior";
  else if (data.points >= 50) badge = "Eco Starter";

  const badgeElement = document.getElementById("badge");
  const badgeContainer = badgeElement.parentElement;

  if (previousBadge !== null && previousBadge !== badge) {
    badgeElement.style.opacity = "0";
    badgeElement.style.transform = "translateY(-10px)";
    badgeElement.style.transition = "all 0.3s ease";

    badgeContainer.classList.add("badge-celebrating");

    createConfetti(badgeContainer);

    playBadgeSound();

    setTimeout(() => {
      badgeElement.textContent = badge;
      badgeElement.style.opacity = "1";
      badgeElement.style.transform = "translateY(0)";

      if (badge === "Eco Warrior") {
        badgeElement.className = "text-lg font-bold text-green-600";
      } else if (badge === "Eco Starter") {
        badgeElement.className = "text-lg font-bold text-blue-600";
      } else {
        badgeElement.className = "text-lg font-bold text-yellow-600";
      }

      setTimeout(() => {
        badgeContainer.classList.remove("badge-celebrating");
      }, 1000);
    }, 300);
  } else {
    badgeElement.textContent = badge;
  }

  previousBadge = badge;
}

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

      setTimeout(() => {
        particle.remove();
      }, 1000);
    }, i * 50);
  }
}

function playBadgeSound() {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

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

function showTabStatusLoading(element) {
  element.className = "text-center p-2 rounded-md flex flex-col items-center";
  element.innerHTML =
    '<div class="mb-1"><i data-lucide="loader-circle" class="w-6 h-6 text-gray-500 animate-spin"></i></div><p class="font-bold">Checking...</p>';
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

async function checkCurrentTabStatus() {
  const tabInfoDiv = document.getElementById("current-tab-info");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab && tab.url && tab.url.startsWith("http")) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      showTabStatusLoading(tabInfoDiv);

      const response = await fetch(
        `https://api.thegreenwebfoundation.org/api/v3/greencheck/${domain}`
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }
      const data = await response.json();
      console.log("Data:", data);
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

function updateTabStatusUI(isGreen, element) {
  element.innerHTML = "";
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

document.addEventListener("DOMContentLoaded", () => {
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

  checkCurrentTabStatus();

  const grayscaleBtn = document.getElementById("toggle-grayscale");
  grayscaleBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleGrayscale" });
      }
    });
  });
});

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
