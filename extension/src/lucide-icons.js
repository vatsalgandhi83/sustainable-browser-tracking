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

const iconCache = {};

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
    return null;
  }
}

async function createIcons(options = {}) {
  const selector = options.selector || "[data-lucide]";
  const elements = document.querySelectorAll(selector);

  for (const element of elements) {
    const name = element.getAttribute("data-lucide");
    if (!name || !iconNames.includes(name)) continue;

    const svgContent = await loadSvg(name);
    if (svgContent) {
      element.innerHTML = svgContent;

      const svg = element.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.color) {
          svg.setAttribute("stroke", "currentColor");
        }
        if (options.attrs) {
          Object.entries(options.attrs).forEach(([attr, value]) => {
            svg.setAttribute(attr, value);
          });
        }
      }
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => createIcons());
} else {
  createIcons();
}

window.lucide = {
  createIcons,
  iconNames,
};
