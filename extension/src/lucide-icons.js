// Lucide Icons for local use
// This file provides SVG-based icon components without external dependencies

const iconNames = [
  "leaf",
  "activity",
  "cloud",
  "check-circle",
  "globe",
  "loader-circle",
  "trophy",
  "star",
  "award",
  "power",
  "info",
  "alert-circle",
];

// Cache for loaded SVG content
const iconCache = {};

// Function to load an SVG file
async function loadSvg(name) {
  if (iconCache[name]) {
    return iconCache[name];
  }

  try {
    const response = await fetch(`/icons/lucide/${name}.svg`);
    if (!response.ok) throw new Error(`Failed to load icon: ${name}`);
    const svgText = await response.text();
    iconCache[name] = svgText;
    return svgText;
  } catch (error) {
    console.error(`Error loading icon ${name}:`, error);
    return null;
  }
}

// Function to create icons
async function createIcons(options = {}) {
  const selector = options.selector || "[data-lucide]";
  const elements = document.querySelectorAll(selector);

  for (const element of elements) {
    const name = element.getAttribute("data-lucide");
    if (!name || !iconNames.includes(name)) continue;

    const svgContent = await loadSvg(name);
    if (svgContent) {
      element.innerHTML = svgContent;

      // Apply any custom class or attributes
      const svg = element.querySelector("svg");
      if (svg) {
        // Ensure SVG inherits colors and size
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        // Get computed styles of parent
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.color) {
          svg.setAttribute("stroke", "currentColor");
        }

        // Apply custom attributes if provided
        if (options.attrs) {
          Object.entries(options.attrs).forEach(([attr, value]) => {
            svg.setAttribute(attr, value);
          });
        }
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => createIcons());
} else {
  createIcons();
}

// Export for use in other scripts
window.lucide = {
  createIcons,
  iconNames,
};
