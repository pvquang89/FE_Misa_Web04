(function () {
  "use strict";


  const CandidatesSelection = (function () {
    const selectedIds = new Set();

    
    const cfg = {
      toolbarSelector: ".toolbar-grid",
      tbodySelector: "#candidateTbody",
      headerCheckboxSelector: "#checkAllCandidates",
      rowCheckboxSelector: "input.row-checkbox",
      clearBtnSelector: "#btnClearSelection",
      countSelector: "#selectedCount",
    };

  
    const qs = (sel, root = document) => root.querySelector(sel);

    /**
     * Lấy danh sách id của các row đang hiển thị trong tbody (tr[data-id]).
     */
    function getVisibleRowIds() {
      const tbody = qs(cfg.tbodySelector);
      if (!tbody) return [];
      return Array.from(tbody.querySelectorAll("tr[data-id]"))
        .map((tr) => (tr.getAttribute("data-id") ?? "").trim())
        .filter(Boolean);
    }

    /**
     * Cập nhật toolbar:
     */
    function updateToolbar() {
      const toolbar = qs(cfg.toolbarSelector);
      if (!toolbar) return;

      const count = selectedIds.size;
      toolbar.classList.toggle("has-selection", count > 0);

      const countEl = qs(cfg.countSelector);
      if (countEl) countEl.textContent = String(count);
    }

    /**
     * Đồng bộ checkbox header (check-all) theo selection hiện tại:
     */
    function syncHeaderCheckbox() {
      const headerCb = qs(cfg.headerCheckboxSelector);
      if (!headerCb) return;

      const ids = getVisibleRowIds();
      if (!ids.length) {
        headerCb.checked = false;
        headerCb.indeterminate = false;
        return;
      }

      const checkedCount = ids.filter((id) => selectedIds.has(id)).length;
      headerCb.checked = checkedCount === ids.length;
      headerCb.indeterminate = checkedCount > 0 && checkedCount < ids.length;
    }

    /**
     * Tick/untick checkbox từng row theo selectedIds.
     */
    function applyCheckedToRows() {
      const tbody = qs(cfg.tbodySelector);
      if (!tbody) return;

      tbody.querySelectorAll("tr[data-id]").forEach((tr) => {
        const id = (tr.getAttribute("data-id") ?? "").trim();
        const cb = tr.querySelector(cfg.rowCheckboxSelector);
        if (cb) cb.checked = !!id && selectedIds.has(id);
      });
    }

    /**
     * Xoá toàn bộ selection và cập nhật UI 
     */
    function clearSelection() {
      selectedIds.clear();

      applyCheckedToRows();

      const headerCb = qs(cfg.headerCheckboxSelector);
      if (headerCb) {
        headerCb.checked = false;
        headerCb.indeterminate = false;
      }

      updateToolbar();
      syncHeaderCheckbox();
    }

    /**
     * Gắn event listeners 
     */
    function bindEventsOnce() {
      const tbody = qs(cfg.tbodySelector);
      if (!tbody) return;

      // Tick từng dòng (event delegation)
      tbody.addEventListener("change", (e) => {
        const cb = e.target?.closest?.(cfg.rowCheckboxSelector);
        if (!cb) return;

        const tr = cb.closest("tr[data-id]");
        const id = (tr?.getAttribute("data-id") ?? "").trim();
        if (!id) return;

        if (cb.checked) selectedIds.add(id);
        else selectedIds.delete(id);

        updateToolbar();
        syncHeaderCheckbox();
      });

      // Check all (trang hiện tại)
      const headerCb = qs(cfg.headerCheckboxSelector);
      headerCb?.addEventListener("change", () => {
        const ids = getVisibleRowIds();

        if (headerCb.checked) ids.forEach((id) => selectedIds.add(id));
        else ids.forEach((id) => selectedIds.delete(id));

        applyCheckedToRows();
        updateToolbar();
        syncHeaderCheckbox();
      });

      // Bỏ chọn
      const btnClear = qs(cfg.clearBtnSelector);
      btnClear?.addEventListener("click", clearSelection);
    }

    /**
     * Khởi tạo module selection.
     */
    function init(options = {}) {
      Object.assign(cfg, options);
      bindEventsOnce();
      updateToolbar();
      syncHeaderCheckbox();
    }

 
    function afterRender() {
      applyCheckedToRows();
      updateToolbar();
      syncHeaderCheckbox();
    }

    /**
     * Kiểm tra 1 id có đang được chọn không.
     */
    function isSelected(id) {
      const key = (id ?? "").toString().trim();
      return !!key && selectedIds.has(key);
    }

    /**
     * Public API
     */
    return {
      init,
      afterRender,
      isSelected,
      clear: clearSelection,
      getSelectedIds: () => Array.from(selectedIds),
    };
  })();

  window.CandidatesSelection = CandidatesSelection;
})();