// This script runs on every page
// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleGrayscale") {
    toggleGrayscale();
  }
});

function toggleGrayscale() {
  const body = document.body;
  // Check if the grayscale filter is already applied
  if (body.style.filter.includes("grayscale(1)")) {
    // If it is, remove it
    body.style.filter = "";
  } else {
    // If not, apply it
    body.style.filter = "grayscale(1)";
  }
}
