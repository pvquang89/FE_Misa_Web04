(function () {
  "use strict";

  
  const ConfirmModal = (function () {
    const SEL = {
      root: "#confirmModal",
      overlay: "#confirmModal .modal-overlay",
      title: "#confirmModalTitle",
      body: "#confirmModalBody",
      btnCancel: "#confirmModalCancel",
      btnOk: "#confirmModalOk",
      btnClose: "#confirmModalClose",
    };

    let pending = null;

    function qs(sel, root = document) {
      return root.querySelector(sel);
    }

    function ensureDom() {
      if (qs(SEL.root)) return;

      const wrap = document.createElement("div");
      wrap.innerHTML = `
        <div id="confirmModal" class="modal hidden" aria-hidden="true">
          <div class="modal-overlay" data-close="1"></div>

          <div class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirmModalTitle">
            <div class="confirm-header">
              <div id="confirmModalTitle" class="confirm-title">Xác nhận</div>
              <button id="confirmModalClose" type="button" class="confirm-close" aria-label="Đóng">×</button>
            </div>

            <div id="confirmModalBody" class="confirm-body"></div>

            <div class="confirm-footer">
              <button id="confirmModalCancel" type="button" class="confirm-btn confirm-btn--ghost">Không</button>
              <button id="confirmModalOk" type="button" class="confirm-btn confirm-btn--danger">Có</button>
            </div>
          </div>
        </div>
      `.trim();

      document.body.appendChild(wrap.firstElementChild);

      qs(SEL.overlay)?.addEventListener("click", () => close(false));
      qs(SEL.btnClose)?.addEventListener("click", () => close(false));
      qs(SEL.btnCancel)?.addEventListener("click", () => close(false));
      qs(SEL.btnOk)?.addEventListener("click", () => close(true));

      document.addEventListener("keydown", (e) => {
        const root = qs(SEL.root);
        if (!root || root.classList.contains("hidden")) return;
        if (e.key === "Escape") close(false);
      });
    }

    function open(opts) {
      ensureDom();

      const root = qs(SEL.root);
      const titleEl = qs(SEL.title);
      const bodyEl = qs(SEL.body);
      const btnCancel = qs(SEL.btnCancel);
      const btnOk = qs(SEL.btnOk);

      if (!root || !titleEl || !bodyEl || !btnCancel || !btnOk) {
        return Promise.resolve(false);
      }

      titleEl.textContent = (opts?.title ?? "Xác nhận").toString();
      bodyEl.innerHTML = (opts?.messageHtml ?? "").toString();

      btnCancel.textContent = (opts?.cancelText ?? "Không").toString();
      btnOk.textContent = (opts?.confirmText ?? "Có").toString();

      const type = (opts?.confirmType ?? "danger").toString();
      btnOk.classList.toggle("confirm-btn--danger", type === "danger");
      btnOk.classList.toggle("confirm-btn--primary", type === "primary");

      root.classList.remove("hidden");
      root.setAttribute("aria-hidden", "false");

      window.setTimeout(() => btnOk.focus(), 0);

      return new Promise((resolve) => {
        pending = { resolve };
      });
    }

    function close(result) {
      const root = qs(SEL.root);
      if (!root) return;

      root.classList.add("hidden");
      root.setAttribute("aria-hidden", "true");

      if (pending?.resolve) pending.resolve(!!result);
      pending = null;
    }

    return {
      confirm: open,
      close,
    };
  })();

  window.ConfirmModal = ConfirmModal;
})();