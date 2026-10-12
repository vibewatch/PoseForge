import { t } from "../i18n/index.js";
import { createIcon } from "./icons.js";

/** Keep native form semantics and scene bindings, but own the visible menu. */
export function bindCustomSelects(root = document.body) {
  const controls = new Map();
  let active = null;
  let sequence = 0;
  const listeners = new AbortController();
  const { signal } = listeners;

  function enhance(select) {
    if (controls.has(select) || select.multiple || select.size > 1) return;
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    const text = document.createElement("span");
    text.className = "select-value";
    text.setAttribute("aria-hidden", "true");
    const caret = document.createElement("span");
    caret.className = "select-caret";
    caret.setAttribute("aria-hidden", "true");
    const menu = document.createElement("div");
    menu.className = "select-menu";
    menu.classList.toggle("filter-menu", Boolean(select.closest("#catalog-filters")));
    menu.id = `select-menu-${++sequence}`;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("popover", "manual");
    menu.tabIndex = 0;
    menu.addEventListener("pointerdown", (event) => event.preventDefault());
    select.before(wrapper);
    wrapper.append(select, text, caret, menu);
    select.classList.add("select-input");
    select.setAttribute("aria-haspopup", "listbox");
    select.setAttribute("aria-controls", menu.id);
    select.setAttribute("aria-expanded", "false");
    const events = new AbortController();
    let highlighted = -1;
    let items = [];
    let prefix = "";
    let typedAt = 0;

    const enabled = (index) => {
      const option = select.options[index];
      return option && !option.disabled && !option.parentElement.disabled && !option.hidden;
    };
    const label = () =>
      select.getAttribute("aria-label") ||
      [...select.labels].map((node) => node.textContent).join(" ") ||
      select.title;
    function highlight(index) {
      highlighted = index;
      items.forEach((item, i) => {
        item.classList.toggle("highlighted", i === index);
      });
      if (items[index]) {
        select.setAttribute("aria-activedescendant", items[index].id);
        menu.setAttribute("aria-activedescendant", items[index].id);
        const item = items[index];
        const box = menu.getBoundingClientRect();
        const itemBox = item.getBoundingClientRect();
        const heading = menu.querySelector(".select-menu-heading");
        const top = (heading?.getBoundingClientRect().bottom ?? box.top) + 4;
        const bottom = box.bottom - 6;
        if (itemBox.top < top)
          menu.scrollTop -= Math.ceil(top - itemBox.top);
        else if (itemBox.bottom > bottom)
          menu.scrollTop += Math.ceil(itemBox.bottom - bottom);
      } else {
        select.removeAttribute("aria-activedescendant");
        menu.removeAttribute("aria-activedescendant");
      }
    }
    function position() {
      const box = wrapper.getBoundingClientRect();
      const margin = 8;
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0;
      const top = viewport?.offsetTop || 0;
      const viewportWidth = viewport?.width || innerWidth;
      const viewportHeight = viewport?.height || innerHeight;
      const width = Math.min(Math.max(box.width, menu.classList.contains("filter-menu") ? 240 : 208),
        viewportWidth - margin * 2);
      const below = top + viewportHeight - box.bottom - margin;
      const above = box.top - top - margin;
      const upwards = below < Math.min(menu.scrollHeight, 240) && above > below;
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${Math.max(0, Math.min(320, (upwards ? above : below) - 6))}px`;
      menu.style.left = `${Math.max(left + margin,
        Math.min(box.left, left + viewportWidth - width - margin))}px`;
      menu.style.top = upwards
        ? `${Math.max(top + margin, box.top - menu.offsetHeight - 6)}px`
        : `${box.bottom + 6}px`;
      menu.style.bottom = "auto";
    }
    function renderOptions() {
      const name = label();
      if (name) menu.setAttribute("aria-label", t("Options for {label}", { label: name }));
      const heading = document.createElement("div");
      heading.className = "select-menu-heading";
      heading.setAttribute("aria-hidden", "true");
      heading.append(
        createIcon(menu.classList.contains("filter-menu") ? "filter" : "edit"),
        document.createTextNode(name || ""),
      );
      items = [...select.options].map((option, index) => {
        const item = document.createElement("div");
        item.id = `${menu.id}-${index}`;
        item.className = "select-option";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(index === select.selectedIndex));
        item.setAttribute("aria-disabled", String(!enabled(index)));
        item.textContent = option.label;
        item.hidden = option.hidden;
        item.addEventListener("pointermove", () => {
          if (enabled(index)) highlight(index);
        });
        item.addEventListener("click", () => choose(index));
        return item;
      });
      menu.replaceChildren(heading, ...items);
    }
    function sync() {
      text.textContent = select.selectedOptions[0]?.label ?? "";
      wrapper.classList.toggle("disabled", select.disabled);
      if (active !== control) return;
      if (select.disabled || !select.checkVisibility()) {
        close();
        return;
      }
      const index = enabled(highlighted) ? highlighted : select.selectedIndex;
      renderOptions();
      position();
      highlight(index);
    }
    function close() {
      if (active !== control) return;
      active = null;
      if (menu.contains(document.activeElement)) select.focus({ preventScroll: true });
      menu.hidePopover();
      select.setAttribute("aria-expanded", "false");
      select.removeAttribute("aria-activedescendant");
      menu.removeAttribute("aria-activedescendant");
      prefix = "";
    }
    function open() {
      if (select.disabled || !select.options.length) return;
      active?.close();
      active = control;
      renderOptions();
      menu.showPopover();
      select.setAttribute("aria-expanded", "true");
      position();
      highlight(
        enabled(select.selectedIndex)
          ? select.selectedIndex
          : [...select.options].findIndex((_, i) => enabled(i)),
      );
    }
    function choose(index) {
      if (!enabled(index)) return;
      const changed = select.selectedIndex !== index;
      select.selectedIndex = index;
      close();
      select.focus({ preventScroll: true });
      if (changed) {
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    function move(direction) {
      let index = highlighted;
      do {
        index += direction;
      } while (index >= 0 && index < select.options.length && !enabled(index));
      if (enabled(index)) highlight(index);
    }
    const on = (name, callback) =>
      select.addEventListener(name, callback, { signal: events.signal });
    // Prevent the browser's pointer and keyboard paths into its system popup.
    on("pointerdown", (event) => {
      event.preventDefault();
      select.focus({ preventScroll: true });
    });
    on("mousedown", (event) => event.preventDefault());
    on("click", (event) => {
      event.preventDefault();
      active === control ? close() : open();
    });
    on("blur", (event) => {
      if (!menu.contains(event.relatedTarget)) close();
    });
    menu.addEventListener("focusout", (event) => {
      if (!wrapper.contains(event.relatedTarget)) close();
    });
    on("input", sync);
    on("change", sync);
    const keydown = (event) => {
      if (event.key === "Tab") {
        close();
        return;
      }
      if (event.key === "Escape") {
        if (active === control) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        return;
      }
      if (event.key === "F4") {
        event.preventDefault();
        active === control ? close() : open();
        return;
      }
      if (["Enter", " ", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
        event.preventDefault();
        if (active !== control) {
          open();
          if (!["Home", "End", "PageDown", "PageUp"].includes(event.key)) return;
        } else if (event.key === "Enter" || event.key === " ") {
          choose(highlighted);
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowRight") move(1);
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") move(-1);
        if (event.key === "PageDown" || event.key === "PageUp")
          for (let i = 0; i < 8; i++) move(event.key === "PageDown" ? 1 : -1);
        if (event.key === "Home")
          highlight([...select.options].findIndex((_, i) => enabled(i)));
        if (event.key === "End") {
          for (let i = select.options.length - 1; i >= 0; i--)
            if (enabled(i)) {
              highlight(i);
              break;
            }
        }
        return;
      }
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      if (active !== control) open();
      const now = performance.now();
      prefix = now - typedAt < 700 ? prefix + event.key : event.key;
      typedAt = now;
      const query = [...prefix].every((letter) => letter === prefix[0]) ? prefix[0] : prefix;
      const options = [...select.options];
      for (let step = 1; step <= options.length; step++) {
        const index = (highlighted + step) % options.length;
        if (enabled(index) && options[index].label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase())) {
          highlight(index);
          break;
        }
      }
    };
    on("keydown", keydown);
    menu.addEventListener("keydown", keydown);
    // Programmatic scene sync does not emit change/input events.
    for (const name of ["value", "selectedIndex"]) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, name);
      Object.defineProperty(select, name, {
        configurable: true,
        get() { return descriptor.get.call(this); },
        set(value) {
          descriptor.set.call(this, value);
          sync();
        },
      });
    }
    const observer = new MutationObserver(sync);
    observer.observe(select, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["disabled", "label", "value", "selected", "hidden"],
      characterData: true,
    });
    const control = {
      select, wrapper, menu, close, position,
      dispose() {
        close();
        events.abort();
        observer.disconnect();
        delete select.value;
        delete select.selectedIndex;
        select.classList.remove("select-input");
        for (const name of ["aria-haspopup", "aria-controls", "aria-expanded", "aria-activedescendant"])
          select.removeAttribute(name);
        wrapper.replaceWith(select);
      },
    };
    controls.set(select, control);
    sync();
  }
  function scan(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches("select")) enhance(node);
    node.querySelectorAll("select").forEach(enhance);
  }
  scan(root);
  const observer = new MutationObserver((records) => {
    for (const record of records)
      record.addedNodes.forEach((node) => {
        if (root.contains(node)) scan(node);
      });
    for (const [select, control] of controls)
      if (!root.contains(select)) {
        control.dispose();
        controls.delete(select);
      }
  });
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener("pointerdown", (event) => {
    if (active && !active.wrapper.contains(event.target)) active.close();
  }, { capture: true, signal });
  root.addEventListener("toggle", () => {
    if (active && !active.select.checkVisibility()) active.close();
  }, { capture: true, signal });
  window.addEventListener("resize", () => active?.close(), { signal });
  window.visualViewport?.addEventListener("resize", () => active?.close(), { signal });
  window.visualViewport?.addEventListener("scroll", () => active?.position(), { signal });
  document.addEventListener("scroll", () => active?.position(), { capture: true, signal });
  return () => {
    listeners.abort();
    observer.disconnect();
    controls.forEach((control) => control.dispose());
    controls.clear();
  };
}
