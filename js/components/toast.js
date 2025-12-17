(function () {
  "use strict";

  const CONTAINER_ID = "misaToastContainer";

  function ensureContainer() {
    let el = document.getElementById(CONTAINER_ID);
    if (el) return el;

    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.className = "misa-toast-container";
    document.body.appendChild(el);
    return el;
  }

  /**
   * Hiển thị toast.
   * @param {{type?:'success'|'error'|'info'|'warning', message:string, duration?:number}} opts
   */
  function show(opts) {
    const type = opts?.type || "info";
    const message = String(opts?.message || "").trim();
    const duration = Number.isFinite(opts?.duration) ? opts.duration : 2500;

    if (!message) return;

    const container = ensureContainer();

    const toast = document.createElement("div");
    toast.className = `misa-toast misa-toast--${type}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    //  icon
    const icon = document.createElement("div");
    icon.className = "misa-toast__icon";
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("div");
    text.className = "misa-toast__message";
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    if (duration > 0) {
      window.setTimeout(() => toast.remove(), duration);
    }
  }

  window.Toast = { show };
})();