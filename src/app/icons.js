import { t } from "../i18n/index.js";

const paths = {
  library: "M4 5h16v14H4z M9 5v14 M12 9h5 M12 13h5",
  edit: "M4 7h6 M14 7h6 M4 17h10 M18 17h2 M10 4v6 M14 14v6",
  undo: "M9 4 4 9l5 5 M4 9h9a7 7 0 0 1 0 14",
  redo: "m15 4 5 5-5 5 M20 9h-9a7 7 0 0 0 0 14",
  save: "M5 3h12l4 4v14H3V3z M7 3v6h9V3 M7 21v-8h10v8",
  export: "M12 15V3 M7 8l5-5 5 5 M5 13v8h14v-8",
  tour: "M18 5a9 9 0 1 0 3 7 M18 2v5h-5 M10 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  "zoom-out": "M5 12h14",
  "zoom-in": "M5 12h14 M12 5v14",
  fit: "M9 4H4v5 M15 4h5v5 M4 15v5h5 M20 15v5h-5 M10 12h4 M12 10v4",
  display: "M3 5h18v14H3z M7 19v3 M17 19v3 M7 22h10 M7 14l4-4 4 4 3-3",
  plus: "M5 12h14 M12 5v14",
  info: "M12 8h.01 M11 12h1v5 M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18",
  tools: "M14 3a6 6 0 0 0-7 7L3 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 7-7l-4 4-3-3z",
  figures: "M9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M3 21v-4a6 6 0 0 1 12 0v4 M16 4a3 3 0 0 1 0 6 M18 12a5 5 0 0 1 3 5v4",
  "add-figure": "M9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M3 21v-4a6 6 0 0 1 12 0v4 M19 6v8 M15 10h8",
  favorite: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z",
  folder: "M3 6h7l2 3h9v12H3z M3 6V3h7l2 3h7v3",
  filter: "M3 5h18l-7 8v7l-4-2v-5z",
  categories: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  close: "m6 6 12 12 M6 18 18 6",
  previous: "m14 5-7 7 7 7",
  next: "m10 5 7 7-7 7",
  apply: "m5 12 4 4L19 6",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  reset: "M3 10a9 9 0 1 1 2 9 M3 4v6h6",
  "reset-all": "M3 10a9 9 0 0 1 15-6 M3 4v6h6 M21 14a9 9 0 0 1-15 6 M21 20v-6h-6",
  capture: "M3 7h4l2-3h6l2 3h4v14H3z M12 10a4 4 0 1 0 0 8 4 4 0 1 0 0-8",
  guide: "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M12 6a6 6 0 1 0 0 12 6 6 0 1 0 0-12 M12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4",
  contact: "M10 4H7a4 4 0 0 0 0 8h3 M14 12h3a4 4 0 0 0 0-8h-3 M8 8h8 M17 15v8 M13 19h8",
  checks: "M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6z M8 12l3 3 5-6",
  standing: "M12 3a2 2 0 1 0 0 4 2 2 0 1 0 0-4 M12 7v7 M6 10l6-2 6 2 M12 14l-4 7 M12 14l4 7",
  seated: "M10 3a2 2 0 1 0 0 4 2 2 0 1 0 0-4 M10 7v7h7v7 M5 10v7h8 M5 17v4 M10 9l6 2",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14 M15 15l6 6",
};

export function createIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": "1.7", "stroke-linecap": "round",
    "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false",
    class: "ui-icon",
  })) svg.setAttribute(key, value);
  const path = (d, className) => {
    const node = document.createElementNS(svg.namespaceURI, "path");
    node.setAttribute("d", d);
    if (className) node.setAttribute("class", className);
    svg.append(node);
  };
  if (name.startsWith("view-")) {
    const faces = {
      "view-three-quarter": "M12 3 21 8v9l-9 5-9-5V8z",
      "view-front": "M3 8l9 5v9l-9-5z",
      "view-side": "M12 13l9-5v9l-9 5z",
      "view-top": "M12 3l9 5-9 5-9-5z",
    };
    path(faces[name], "icon-face");
    path("M12 3 21 8v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9");
  } else {
    path(paths[name]);
  }
  return svg;
}

const controls = [
  ["#toggle-library", "library", "Library"],
  ["#toggle-inspector", "edit", "Edit"],
  ["#undo", "undo", "Undo"],
  ["#redo", "redo", "Redo"],
  ["#save-preset", "save", "Save preset"],
  ["#open-export", "export", "Export"],
  ['[data-view="three_quarter"]', "view-three-quarter", "3D"],
  ['[data-view="front"]', "view-front", "Front"],
  ['[data-view="side"]', "view-side", "Side"],
  ['[data-view="top"]', "view-top", "Top"],
  ["#camera-tour", "tour", "Tour"],
  ["#zoom-out", "zoom-out", "Zoom out"],
  ["#fit-view", "fit", "Fit figures"],
  ["#zoom-in", "zoom-in", "Zoom in"],
  [".display-options > summary", "display", "Display"],
  [".new-study", "plus", "+ New study"],
  [".library-info", "info", "About this library"],
  [".library-bottom > .text-button", "tools", "Library tools"],
  ['[data-scope="positions"]', "library", "Positions"],
  ['[data-scope="saved"]', "folder", "Saved"],
  ['[data-scope="favorites"]', "favorite", "Favorites"],
  ['.inspector-tabs [aria-controls="scene-controls"]', "view-three-quarter", "Scene"],
  ['.inspector-tabs [aria-controls="figure-controls"]', "figures", "Figures"],
  ['[data-region="library"]', "library", "Library"],
  ['[data-region="studio"]', "view-three-quarter", "Studio"],
  ['[data-region="edit"]', "edit", "Edit"],
  ['[data-history="undo"]', "undo", "Undo"],
  ['[data-history="redo"]', "redo", "Redo"],
  [".position-browser > summary", "categories", "Browse position categories"],
  [".reset-filters", "reset", "Reset filters"],
  [".clear-search", "close", "Clear search"],
  [".catalog-pagination button:first-child", "previous", "Previous"],
  [".catalog-pagination button:last-child", "next", "Next"],
  ["#position-edit", "edit", "Edit posture"],
  ["#position-save", "save", "Save position override"],
  ["#show-notes", "checks", "Pose checks"],
  ["#scene-information-toggle", "info", "Scene information"],
  [".dialog-head .icon-button", "close", "Close dialog"],
  [".actor-card > .text-button.danger", "trash", "Remove figure"],
  [".favorite", "favorite", "Favorites"],
  [".position-details", "info", "Details"],
];

export function setControlIcon(control, icon, label =
  control.getAttribute("aria-label") || control.textContent.trim()) {
  control.setAttribute("aria-label", label);
  if (!control.hasAttribute("title") && !control.dataset.hint)
    control.dataset.hint = label;
  control.classList.add("icon-control");
  control.replaceChildren(createIcon(icon));
}

export function setInformationHint(button, text) {
  button.dataset.hint = text;
  button.hidden = !text.trim();
}

export function createInformationHint(label, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button information-button";
  setControlIcon(button, "info", t("Information about {label}", { label }));
  setInformationHint(button, text);
  return button;
}

export function bindIcons(root = document.body) {
  const enhanced = new WeakSet();
  const enhance = (node) => {
    if (node.namespaceURI === "http://www.w3.org/2000/svg") return;
    for (const [selector, icon, label] of controls) {
      const matches = [
        ...(node.matches(selector) ? [node] : []),
        ...node.querySelectorAll(selector),
      ];
      for (const control of matches) {
        if (enhanced.has(control)) continue;
        enhanced.add(control);
        const hint = control.dataset.hint;
        setControlIcon(control, icon, control.getAttribute("aria-label") || t(label));
        if (hint) control.dataset.hint = hint;
      }
    }
    for (const control of [
      ...(node.matches("[data-icon]") ? [node] : []),
      ...node.querySelectorAll("[data-icon]"),
    ]) {
      if (enhanced.has(control)) continue;
      enhanced.add(control);
      setControlIcon(control, control.dataset.icon);
    }
  };
  enhance(root);
  const observer = new MutationObserver((records) => {
    for (const record of records)
      for (const node of record.addedNodes)
        if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
