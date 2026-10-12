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
];

export function bindIcons(root = document.body) {
  const enhanced = new WeakSet();
  const enhance = (node) => {
    for (const [selector, icon, label] of controls) {
      const matches = [
        ...(node.matches(selector) ? [node] : []),
        ...node.querySelectorAll(selector),
      ];
      for (const control of matches) {
        if (enhanced.has(control)) continue;
        enhanced.add(control);
        control.setAttribute("aria-label", control.getAttribute("aria-label") || t(label));
        if (!control.hasAttribute("title") && !control.dataset.hint)
          control.dataset.hint = t(label);
        control.classList.add("icon-control");
        control.replaceChildren(createIcon(icon));
      }
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
