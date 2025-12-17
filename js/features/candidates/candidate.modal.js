window.CandidateModal = (function () {
  "use strict";

  const LS_KEY = "misa_candidates";

  const SEL = {
    modal: "#candidateModal",
    title: "#candidateModalTitle",
    openBtn: "#btnAddCandidate",
    closeBtn: "[data-close='1']",
    firstFocus: "#candidateForm input[name='fullName']",
    form: "#candidateForm",
  };

  /**
   * Lấy danh sách ứng viên từ localStorage.
   * @returns {Array<object>} 
   */
  function getCandidates() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu danh sách ứng viên vào localStorage.
   * @param {Array<object>} list 
   */
  function saveCandidates(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  }


  function notifyChanged() {
    document.dispatchEvent(new CustomEvent("candidates:changed"));
  }



  /**
   * @param {string} text - Tiêu đề.
   */
  function setTitle(text) {
    const titleEl = document.querySelector(SEL.title);
    if (titleEl) titleEl.textContent = text;
  }

  /**
   * Mở modal.
   */
  function open() {
    const modal = document.querySelector(SEL.modal);
    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.querySelector(SEL.firstFocus)?.focus?.();
  }

  /**
   * Đóng modal.
   */
  function close() {
    const modal = document.querySelector(SEL.modal);
    if (!modal) return;

    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  /**
   * Bind dữ liệu ứng viên lên form.
   * @param {object} candidate 
   */
  function fillForm(candidate) {
    const form = document.querySelector(SEL.form);
    if (!form) return;

    const set = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (!el) return;

      if (el.type === "checkbox") el.checked = Boolean(value);
      else el.value = value ?? "";
    };

    // Các field có trong modal
    set("id", candidate?.id);
    set("fullName", candidate?.fullName);
    set("dob", candidate?.dob);
    set("gender", candidate?.gender);
    set("area", candidate?.area);
    set("phone", candidate?.phone);
    set("email", candidate?.email);
    set("address", candidate?.address);

    set("eduLevel", candidate?.eduLevel);
    set("school", candidate?.school);
    set("major", candidate?.major);

    set("appliedDate", candidate?.appliedDate);
    set("source", candidate?.source);
    set("exploiter", candidate?.exploiter);
    set("collaborator", candidate?.collaborator);
    set("quickAddRefToTalentPool", candidate?.quickAddRefToTalentPool);

    set("referrer", candidate?.referrer);
    set("recentWork", candidate?.recentWork);

    set("workplace", candidate?.workplace);
    set("workFrom", candidate?.workFrom);
    set("workTo", candidate?.workTo);
    set("workTitle", candidate?.workTitle);
    set("workDescription", candidate?.workDescription);
  }

  /**
   * Reset form về trạng thái tạo mới.
   */
  function resetForm() {
    const form = document.querySelector(SEL.form);
    if (!form) return;
    form.reset();

    const idInput = form.querySelector(`[name="id"]`);
    if (idInput) idInput.value = "";
  }

  /**
   * Lấy data từ form.
   * @returns {object} - Candidate payload.
   */
  function readFormData() {
    const form = document.querySelector(SEL.form);
    const fd = new FormData(form);

    const obj = {};
    fd.forEach((v, k) => (obj[k] = v));

    // checkbox không có trong FormData khi unchecked → đọc trực tiếp
    const cb = form.querySelector(`[name="quickAddRefToTalentPool"]`);
    obj.quickAddRefToTalentPool = cb ? cb.checked : false;

    // trim
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === "string") obj[k] = obj[k].trim();
    }

    return obj;
  }

  /**
   * Validate input cơ bản cho popup.
   */
  function validate(payload) {
    if (!payload.fullName) return { ok: false, message: "Vui lòng nhập Họ và tên." };
    if (!payload.appliedDate) return { ok: false, message: "Vui lòng chọn Ngày ứng tuyển." };

    if (payload.email) {
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
      if (!okEmail) return { ok: false, message: "Email không hợp lệ." };
    }

    if (payload.phone) {
      const digits = payload.phone.replace(/\D+/g, "");
      if (digits.length < 9 || digits.length > 11) {
        return { ok: false, message: "Số điện thoại không hợp lệ." };
      }
    }

    return { ok: true };
  }

  /**
   * Tạo mới ứng viên: lưu vào đầu danh sách localStorage.
   * @param {object} payload - Dữ liệu từ form.
   */
  function createCandidate(payload) {
    const list = getCandidates();

    const candidate = {
      // payload từ modal
      ...payload,

      campaign: payload.campaign ?? "",
      position: payload.position ?? "Nhân viên",
      jobPost: payload.jobPost ?? "",
      recruitStage: payload.recruitStage ?? "Mới",
      rate: payload.rate ?? "",
      unit: payload.unit ?? "",
      personaFit: payload.personaFit ?? "",
      receptionInfo: payload.receptionInfo ?? "",
      talentPool: payload.talentPool ?? "",
    };

    list.unshift(candidate);
    saveCandidates(list);
  }

  /**
   * Cập nhật ứng viên theo id trong localStorage.
   * @param {string} id - Id ứng viên.
   * @param {object} payload - Dữ liệu từ form.
   * @returns {boolean} - true nếu update thành công.
   */
  function updateCandidate(id, payload) {
    const list = getCandidates();
    const idx = list.findIndex((x) => String(x.id) === String(id));
    if (idx < 0) return false;

    list[idx] = { ...list[idx], ...payload, id: list[idx].id };
    saveCandidates(list);
    return true;
  }

  /**
   * Mở popup để tạo mới.
   */
  function openForCreate() {
    setTitle("Thêm ứng viên");
    resetForm();
    open();
  }

  /**
   * Mở popup để chỉnh sửa và bind dữ liệu.
   * @param {object} candidate - Ứng viên cần sửa.
   */
  function openForEdit(candidate) {
    if (!candidate?.id) {
      window.Toast?.show?.({ type: "error", message: "Không tìm thấy ứng viên để chỉnh sửa." });
      return;
    }
    setTitle("Chỉnh sửa thông tin ứng viên");
    resetForm();
    fillForm(candidate);
    open();
  }

  /**
   * Handle submit form: create/update + toast + reload list.
   * @param {SubmitEvent} e - Event submit.
   */
  function handleSubmit(e) {
    e.preventDefault();

    const payload = readFormData();
    const check = validate(payload);

    if (!check.ok) {
      window.Toast?.show?.({ type: "error", message: check.message || "Dữ liệu không hợp lệ." });
      return;
    }

    try {
      const isEdit = Boolean(payload.id);
      if (isEdit) {
        const ok = updateCandidate(payload.id, payload);
        if (!ok) throw new Error("NOT_FOUND");
        window.Toast?.show?.({ type: "success", message: "Sửa thông tin thành công." });
      } else {
        createCandidate(payload);
        window.Toast?.show?.({ type: "success", message: "Thêm ứng viên thành công." });
      }

      close();
      notifyChanged();
    } catch (err) {
      console.error(err);
      window.Toast?.show?.({ type: "error", message: "Thao tác thất bại. Vui lòng thử lại." });
    }
  }

  /**
   * Init modal events.
   */
  function init() {
    console.log("1. init(): 1.1 modal events");
    
    const modal = document.querySelector(SEL.modal);
    const openBtn = document.querySelector(SEL.openBtn);
    const form = document.querySelector(SEL.form);

    // Mở popup create
    openBtn?.addEventListener("click", openForCreate);

    // Đóng popup khi click overlay / X / Hủy
    modal?.addEventListener("click", (e) => {
      if (e.target?.closest?.(SEL.closeBtn)) close();
    });

    // Đóng popup khi nhấn Esc
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Submit form
    form?.addEventListener("submit", handleSubmit);
  }

  return { init, open, close, openForCreate, openForEdit };
})();