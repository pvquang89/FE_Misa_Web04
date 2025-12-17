(function () {
  "use strict";

  const LS_KEY = "misa_candidates";
  const DEFAULT_PAGE_SIZE = 25;

  /**
   * Phân trang, tìm kiếm
   */
  const state = {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    query: "",
  };


  
  function safeText(v) {
    const s = (v ?? "").toString().trim();
    return s.length ? s : "—";
  }

  /**
   * Hiển thị avatar tương ứng tên
   */
  function initials(fullName) {
    const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "--";
    const a = parts[0][0] ?? "";
    const b = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
    return (a + b).toUpperCase();
  }


  function normalizeText(s) {
    return (s ?? "").toString().trim().toLowerCase();
  }

 
  function normalizePhone(phone) {
    return (phone ?? "").toString().replace(/\D+/g, "");
  }


  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }


  
  function hashString(str) {
    const s = (str ?? "").toString();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /**
   * Lấy màu nền avatar theo candidate 
   */
  function avatarBg(candidate) {
    const palette = [
      "#22C55E", // green
      "#14B8A6", // teal
      "#06B6D4", // cyan
      "#A3E635", // lime
      "#F59E0B", // amber
      "#F97316", // orange
      "#3B82F6", // blue
      "#6366F1", // indigo
      "#A855F7", // purple
      "#EC4899", // pink
      "#EF4444", // red
      "#10B981", // emerald
    ];
    const key = (candidate?.id ?? candidate?.fullName ?? "").toString();
    const idx = hashString(key) % palette.length;
    return palette[idx];
  }


  /**
   * Đánh giá sao
   */
  function rateToNumber(rate) {
    if (rate == null) return 0;

    const asNumber = Number(rate);
    if (Number.isFinite(asNumber)) return clamp(Math.round(asNumber), 0, 5);

    const s = normalizeText(rate);
    const map = {
      "xuất sắc": 5,
      "xuat sac": 5,
      "tốt": 4,
      tot: 4,
      "khá": 3,
      kha: 3,
      "trung bình": 2,
      "trung binh": 2,
      "kém": 1,
      kem: 1,
      "-": 0,
      "—": 0,
      "": 0,
    };
    return map[s] ?? 0;
  }


  function renderStars(rate) {
    const n = rateToNumber(rate);
    if (!n) return "—";

    let html = `<span class="rating-stars" title="${n}/5" aria-label="${n}/5">`;
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fa ${i <= n ? "fa-star" : "fa-star-o"}"></i>`;
    }
    html += `</span>`;
    return html;
  }


  /**
   * Load danh sách ứng viên từ localStorage.
   */
  function loadCandidates() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  /**
   * Nếu localStorage chưa có, lấy data mặc định.
   */
  function seedIfNeeded() {
    const existing = loadCandidates();
    if (existing.length) return existing;

    const defaults = window.DEFAULT_CANDIDATES;
    if (!Array.isArray(defaults)) return [];

    localStorage.setItem(LS_KEY, JSON.stringify(defaults));
    return defaults;
  }

  /**
   * Lưu danh sách ứng viên vào localStorage.
   */
  function saveCandidates(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  }

  /**
   * Xóa các ứng viên theo danh sách id.
   */
  function deleteCandidatesByIds(ids) {
    const idSet = new Set((ids || []).map((x) => String(x ?? "").trim()).filter(Boolean));
    if (!idSet.size) return 0;

    const current = loadCandidates();
    const before = current.length;
    const next = current.filter((c) => !idSet.has(String(c?.id ?? "").trim()));

    saveCandidates(next);
    return before - next.length;
  }

  /**
   * Bind nút "Xóa" trên toolbar selected.
   */
  function bindDeleteSelectedButton() {
    const btn =
      document.querySelector("#btnDeleteSelected") ||
      document.querySelector("[data-action='delete-selected']");

    if (!btn) return;

    btn.addEventListener("click", async () => {
      const ids = window.CandidatesSelection?.getSelectedIds?.() || [];
      if (!ids.length) return;

      const ok = await window.ConfirmModal?.confirm?.({
        title: "Xóa ứng viên",
        messageHtml:
          "Nếu bạn xóa ứng viên tất cả các dữ liệu liên quan đến ứng viên bao gồm: <b>email trao đổi, quá trình ứng tuyển, đánh giá, các tệp đính kèm,...</b> sẽ bị xóa và <b>không thể phục hồi lại được</b>.<br/><br/>Bạn có chắc chắn muốn xóa ứng viên này không ?",
        cancelText: "Không",
        confirmText: "Có, xóa ứng viên",
        confirmType: "danger",
      });

      if (!ok) return;

      const deleted = deleteCandidatesByIds(ids);

      // clear selection UI
      window.CandidatesSelection?.clear?.();

      // refresh list
      document.dispatchEvent(new CustomEvent("candidates:changed"));

      window.Toast?.show?.({
        type: "success",
        message: deleted ? `Xóa thành công.` : "Không có ứng viên nào được xóa.",
      });
    });
  }

  /**
   * Lọc danh sách ứng viên theo query (tên/email/sđt).
   */
  function getFilteredCandidates(list, query) {
    const q = normalizeText(query);
    if (!q) return list;

    const qPhone = q.replace(/\D+/g, "");
    return list.filter((c) => {
      const name = normalizeText(c.fullName);
      const email = normalizeText(c.email);
      const phone = normalizePhone(c.phone);

      if (name.includes(q)) return true;
      if (email.includes(q)) return true;
      if (qPhone && phone.includes(qPhone)) return true;
      return false;
    });
  }

  /**
   * Phân trang danh sách.
   */
  function paginate(list, page, pageSize) {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = clamp(page, 1, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return {
      total,
      totalPages,
      page: safePage,
      pageItems: list.slice(start, end),
      startIndex: total ? start + 1 : 0,
      endIndex: total ? Math.min(end, total) : 0,
    };
  }


  /**
   * Render tbody danh sách ứng viên 
   */
  function renderCandidatesTable(list) {
    const tbody = document.querySelector("#candidateTbody");
    if (!tbody) return;

    tbody.innerHTML = list
      .map((c) => {
        const id = (c.id ?? "").toString().trim();
        const checked = window.CandidatesSelection?.isSelected?.(id) ? "checked" : "";

        return `
      <tr data-id="${id}">
        <td class="col-checkbox"><input type="checkbox" class="row-checkbox" ${checked}/></td>

        <td class="col-phone">${safeText(c.phone)}</td>
        <td class="col-source">${safeText(c.source)}</td>

        <td class="col-name">
          <span class="avatar" style="background-color:${avatarBg(c)}" title="${safeText(c.fullName)}">${initials(c.fullName)}</span>
          <div class="name-block">
            <div class="name">${safeText(c.fullName)}</div>
            <div class="sub">${safeText(c.position)}</div>
          </div>
        </td>

        <td class="col-email">${safeText(c.email)}</td>
        <td class="col-campaign">${safeText(c.campaign)}</td>
        <td class="col-position">${safeText(c.position)}</td>

        <td class="col-job">${safeText(c.jobPost)}</td>
        <td class="col-recruit-stage">${safeText(c.recruitStage)}</td>
        <td class="col-rate">${renderStars(c.rate)}</td>
        <td class="col-applied-date">${safeText(c.appliedDate)}</td>
        <td class="col-edu-level">${safeText(c.eduLevel)}</td>
        <td class="col-school">${safeText(c.school)}</td>
        <td class="col-major">${safeText(c.major)}</td>
        <td class="col-recent-work">${safeText(c.recentWork)}</td>
        <td class="col-exploit">${safeText(c.exploiter)}</td>
        <td class="col-unit">${safeText(c.unit)}</td>
        <td class="col-persona">${renderPersonaFitBadge(c.personaFit)}</td>
        <td class="col-area">${safeText(c.area)}</td>
        <td class="col-referrer">${safeText(c.referrer)}</td>
        <td class="col-reception-info">${safeText(c.receptionInfo)}</td>
        <td class="col-talent-pool">${safeText(c.talentPool)}</td>

        <!-- NEW: actions (ẩn, hover row mới hiện) -->
        <td class="col-actions">
          <button type="button" class="btn-row-edit" data-action="edit" aria-label="Chỉnh sửa" title="Chỉnh sửa">
            <span class="icon-edit"></span>
          </button>
        </td>
      </tr>
    `;
      })
      .join("");

    window.CandidatesSelection?.afterRender?.();
  }

  /**
   * Cập nhật footer phân trang 
   */
  function updateFooter({ total, startIndex, endIndex, page, totalPages }) {
    const totalEl = document.querySelector("#candidateTotalCount");
    if (totalEl) totalEl.textContent = String(total);

    const pageInfo = document.querySelector("#pageInfo");
    if (pageInfo) pageInfo.textContent = `${startIndex} - ${endIndex} bản ghi`;

    const prevBtn = document.querySelector("#pagePrev");
    const nextBtn = document.querySelector("#pageNext");
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
  }

  /**
   * Render theo state
   */
  function render(allCandidates) {
    const filtered = getFilteredCandidates(allCandidates, state.query);
    const paged = paginate(filtered, state.page, state.pageSize);
    state.page = paged.page;

    renderCandidatesTable(paged.pageItems);
    updateFooter(paged);
  }



  async function loadCandidateModalHtml() {
    const mount = document.querySelector("#modalMount");
    if (!mount) return;

    const res = await fetch("./components/candidate-modal.html");
    if (!res.ok) throw new Error("LOAD_MODAL_FAILED");

    mount.innerHTML = await res.text();
  }

  
  function bindCandidateListEvents(deps) {
    document.addEventListener("candidates:changed", () => {
      const latest = loadCandidates();
      deps.getAll = () => latest; 
      render(latest);
    });

    const tbody = document.querySelector("#candidateTbody");
    if (!tbody) return;


    tbody.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-action='edit']");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const tr = btn.closest("tr[data-id]");
      const id = tr?.getAttribute("data-id");
      if (!id) return;

      const all = deps.getAll();
      const candidate = all.find((x) => String(x.id) === String(id));

      if (!candidate) {
        window.Toast?.show?.({ type: "error", message: "Không tìm thấy ứng viên để chỉnh sửa." });
        return;
      }

      window.CandidateModal?.openForEdit?.(candidate);
    });

   
  }

  /**
   * load modal + init modal + init danh sách (search/paging).
   */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await loadCandidateModalHtml();
      window.CandidateModal?.init();
    } catch (e) {
      console.error(e);
      window.Toast?.show?.({ type: "error", message: "Không tải được popup. Vui lòng thử lại." });
    }

    let allCandidates = seedIfNeeded();

    // bind các event list (reload + edit)
    const deps = { getAll: () => allCandidates };
    bindCandidateListEvents(deps);

    window.CandidatesSelection?.init?.({
      toolbarSelector: ".toolbar-grid",
      tbodySelector: "#candidateTbody",
      headerCheckboxSelector: "#checkAllCandidates",
      clearBtnSelector: "#btnClearSelection",
      countSelector: "#selectedCount",
    });

    bindDeleteSelectedButton();

    // cập nhật allCandidates khi reload (deps.getAll đã trỏ latest),
    document.addEventListener("candidates:changed", () => {
      allCandidates = loadCandidates();
    });

    const perPageSelect = document.querySelector("#perPageSelect");
    if (perPageSelect) {
      const initial = Number(perPageSelect.value);
      if (Number.isFinite(initial) && initial > 0) state.pageSize = initial;

      perPageSelect.addEventListener("change", () => {
        const v = Number(perPageSelect.value);
        state.pageSize = Number.isFinite(v) && v > 0 ? v : DEFAULT_PAGE_SIZE;
        state.page = 1;
        render(allCandidates);
      });
    }

    const searchInput = document.querySelector("#candidateQuickSearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.query = searchInput.value ?? "";
        state.page = 1;
        render(allCandidates);
      });
    }

    const prevBtn = document.querySelector("#pagePrev");
    const nextBtn = document.querySelector("#pageNext");

    prevBtn?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      render(allCandidates);
    });

    nextBtn?.addEventListener("click", () => {
      state.page = state.page + 1;
      render(allCandidates);
    });

    render(allCandidates);
  });
})();




function getPersonaFitClass(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "";
  if (n >= 70) return "compatibility-level--good"; // xanh
  if (n >= 40) return "compatibility-level--medium"; // cam
  return "compatibility-level--bad"; // đỏ
}


function renderPersonaFitBadge(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  const safe = Math.max(1, Math.min(100, Math.round(n)));
  const cls = getPersonaFitClass(safe);
  return `
    <span class="compatibility-level ${cls}" title="Phù hợp với chân dung: ${safe}%">
      ${safe}%
    </span>
  `.trim();
}







