export function bindCustomHints(root = document.body) {
  const doc = root.ownerDocument;
  const tooltip = doc.createElement("div");
  tooltip.id = "poseforge-hint";
  tooltip.className = "custom-hint";
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("popover", "manual");
  tooltip.hidden = true;
  root.append(tooltip);
  const events = new AbortController();
  const automatic = new WeakSet();
  const iconSelector = "button.icon-button[aria-label]";
  let owner, pending, dismissed, showTimer, hideTimer, pressTimer, press, suppress;
  let escaping = false, escapeTimer;
  let focusFrame;

  const migrate = (node) => {
    for (const target of [
      ...(node.hasAttribute("title") ? [node] : []),
      ...node.querySelectorAll("[title]"),
    ]) {
      const text = target.getAttribute("title");
      if (target.matches("input,select,textarea") &&
          !target.getAttribute("aria-label") && !target.labels?.length)
        target.setAttribute("aria-label", text);
      target.dataset.hint = text;
      automatic.delete(target);
      target.removeAttribute("title");
    }
    for (const target of [
      ...(node.matches(iconSelector) ? [node] : []),
      ...node.querySelectorAll(iconSelector),
    ]) {
      if (target.hasAttribute("data-hint")) continue;
      automatic.add(target);
      target.dataset.hint = target.getAttribute("aria-label");
    }
  };
  const candidate = (target) => {
    const node = target?.closest?.(`[data-hint],[title],${iconSelector}`);
    if (!node || !root.contains(node)) return null;
    migrate(node);
    return node.dataset.hint ? node : null;
  };
  const cancelTimers = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    doc.defaultView.cancelAnimationFrame(focusFrame);
    focusFrame = null;
    pending = null;
  };
  const hide = () => {
    cancelTimers();
    if (owner) {
      const ids = (owner.getAttribute("aria-describedby") || "")
        .split(/\s+/).filter((id) => id && id !== tooltip.id);
      if (ids.length) owner.setAttribute("aria-describedby", ids.join(" "));
      else owner.removeAttribute("aria-describedby");
    }
    owner = null;
    if (tooltip.hidePopover && tooltip.matches(":popover-open")) tooltip.hidePopover();
    tooltip.hidden = true;
  };
  const position = () => {
    const anchor = owner.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const { width, height, offsetLeft = 0, offsetTop = 0 } =
      doc.defaultView.visualViewport || {
        width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight,
      };
    const top = anchor.top - box.height - 8;
    tooltip.style.left = `${Math.max(offsetLeft + 8,
      Math.min(anchor.left + (anchor.width - box.width) / 2, offsetLeft + width - box.width - 8))}px`;
    tooltip.style.top = `${Math.max(offsetTop + 8,
      Math.min(top >= offsetTop + 8 ? top : anchor.bottom + 8, offsetTop + height - box.height - 8))}px`;
    tooltip.tabIndex = tooltip.scrollHeight > tooltip.clientHeight ? 0 : -1;
  };
  const show = (target) => {
    if (!target.isConnected || !target.dataset.hint || !target.getClientRects().length ||
        dismissed === target) return;
    hide();
    owner = target;
    tooltip.textContent = target.dataset.hint;
    (target.closest("dialog[open]") || root).append(tooltip);
    const ids = new Set((target.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    ids.add(tooltip.id);
    target.setAttribute("aria-describedby", [...ids].join(" "));
    tooltip.hidden = false;
    if (tooltip.showPopover) tooltip.showPopover();
    position();
  };
  const listen = (target, type, handler) =>
    target.addEventListener(type, handler, { capture: true, signal: events.signal });
  migrate(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (tooltip.contains(record.target)) continue;
      if (record.type === "attributes" && record.attributeName === "title")
        migrate(record.target);
      if (record.attributeName === "aria-label" && automatic.has(record.target) &&
          record.target.dataset.hint === record.oldValue)
        record.target.dataset.hint = record.target.getAttribute("aria-label") || "";
      for (const node of record.addedNodes)
        if (node.nodeType === Node.ELEMENT_NODE) migrate(node);
    }
    if (!owner) return;
    const modal = doc.querySelector("dialog[open]");
    if (!owner.isConnected || !owner.dataset.hint || !owner.getClientRects().length ||
        (modal && !modal.contains(owner))) hide();
    else if (tooltip.textContent !== owner.dataset.hint) {
      tooltip.textContent = owner.dataset.hint;
      position();
    }
  });
  observer.observe(root, {
    subtree: true, childList: true, attributes: true, attributeOldValue: true,
    attributeFilter: ["title", "data-hint", "aria-label", "hidden", "open", "class",
      "data-mobile", "data-library", "data-inspector"],
  });
  listen(doc, "pointerover", (event) => {
    if (event.pointerType === "touch") return;
    if (tooltip.contains(event.target)) {
      clearTimeout(hideTimer);
      return;
    }
    const target = candidate(event.target);
    if (target === owner) {
      clearTimeout(hideTimer);
      return;
    }
    if (!target || target === pending) return;
    cancelTimers();
    pending = target;
    showTimer = setTimeout(() => show(target), 350);
  });
  listen(doc, "pointerout", (event) => {
    if (event.pointerType === "touch") return;
    if (dismissed && !dismissed.contains(event.relatedTarget)) dismissed = null;
    if (pending && !pending.contains(event.relatedTarget)) {
      clearTimeout(showTimer);
      pending = null;
    }
    if (!owner ||
        (!owner.contains(event.target) && !tooltip.contains(event.target)) ||
        owner.contains(event.relatedTarget) || tooltip.contains(event.relatedTarget)) return;
    if (tooltip.contains(doc.activeElement)) return;
    hideTimer = setTimeout(hide, 150);
  });
  listen(doc, "focusin", (event) => {
    if (escaping) return;
    if (tooltip.contains(event.target)) {
      clearTimeout(hideTimer);
      return;
    }
    const target = candidate(event.target);
    if (target !== dismissed) dismissed = null;
    hide();
    if (target) {
      pending = target;
      focusFrame = doc.defaultView.requestAnimationFrame(() => {
        focusFrame = null;
        if (pending === target && doc.activeElement === target) show(target);
      });
    }
  });
  listen(doc, "focusout", (event) => {
    if (owner?.contains(event.relatedTarget) || tooltip.contains(event.relatedTarget)) return;
    dismissed = null;
    hide();
  });
  listen(doc, "input", (event) => {
    if (event.target.matches?.('input[type="search"]')) hide();
  });
  listen(doc, "keydown", (event) => {
    if (event.key === "Escape") {
      // Closing a menu/dialog restores focus without asking for another hint.
      escaping = true;
      clearTimeout(escapeTimer);
      escapeTimer = setTimeout(() => { escaping = false; }, 0);
      dismissed = owner || pending;
      hide();
      clearTimeout(pressTimer);
    }
  });
  listen(doc, "pointerdown", (event) => {
    if (tooltip.contains(event.target)) return;
    hide();
    clearTimeout(pressTimer);
    suppress = null;
    dismissed = null;
    const target = candidate(event.target);
    press = event.pointerType === "touch" && target
      ? { target, id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    if (press) pressTimer = setTimeout(() => {
      show(target);
      suppress = target;
    }, 500);
  });
  listen(doc, "pointermove", (event) => {
    if (press?.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) {
      clearTimeout(pressTimer);
      press = null;
      suppress = null;
      hide();
    }
  });
  for (const type of ["pointerup", "pointercancel"])
    listen(doc, type, (event) => {
      if (press?.id !== event.pointerId) return;
      clearTimeout(pressTimer);
      press = null;
      if (type === "pointercancel") {
        suppress = null;
        hide();
      }
    });
  listen(doc, "click", (event) => {
    if (event.detail > 0 && suppress?.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppress = null;
    } else if (event.target.closest?.(".information-button")) {
      const target = candidate(event.target);
      if (target) {
        dismissed = null;
        show(target);
      }
    } else if (!tooltip.contains(event.target)) hide();
  });
  listen(doc, "contextmenu", (event) => {
    if (press?.target.contains(event.target) || suppress?.contains(event.target))
      event.preventDefault();
  });
  listen(doc, "toggle", (event) => {
    if (event.target !== tooltip && event.newState === "open" &&
        !(event.target.matches("dialog") && event.target.contains(owner))) hide();
  });
  listen(doc, "scroll", (event) => {
    // Native focus scrolling precedes the frame that reveals a keyboard hint.
    if (focusFrame != null && pending === doc.activeElement) return;
    if (!tooltip.contains(event.target)) hide();
  });
  listen(doc, "wheel", (event) => {
    if (!tooltip.contains(event.target)) hide();
  });
  listen(doc.defaultView, "resize", hide);
  if (doc.defaultView.visualViewport) {
    listen(doc.defaultView.visualViewport, "resize", hide);
    listen(doc.defaultView.visualViewport, "scroll", hide);
  }
  return () => {
    events.abort();
    observer.disconnect();
    clearTimeout(pressTimer);
    clearTimeout(escapeTimer);
    hide();
    tooltip.remove();
  };
}
