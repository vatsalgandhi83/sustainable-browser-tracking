chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleGrayscale") {
    toggleGrayscale();
  }
});

function toggleGrayscale() {
  const body = document.body;
  if (body.style.filter.includes("grayscale(1)")) {
    body.style.filter = "";
  } else {
    body.style.filter = "grayscale(1)";
  }
}
