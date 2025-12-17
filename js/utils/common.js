(function () {
  "use strict";


  const Common = {
    safeText(v) {
      const s = (v ?? "").toString().trim();
      return s.length ? s : "—";
    },
  /**
   * Chuẩn hoá text để so sánh/tìm kiếm (trim + lowercase).
   */
    normalizeText(s) {
      return (s ?? "").toString().trim().toLowerCase();
    },

  /**
   * Chuẩn hoá số điện thoại (chỉ giữ chữ số).
   */
    normalizePhone(phone) {
      return (phone ?? "").toString().replace(/\D+/g, "");
    },
  /**
   * Giới hạn một số trong khoảng [min, max].
   */
    clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    },

  /**
   * Lấy chữ viết tắt từ họ tên để hiển thị avatar.
   */
    initials(fullName) {
      const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return "--";
      const a = parts[0][0] ?? "";
      const b = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
      return (a + b).toUpperCase();
    },

  /**
   * Đổi đánh giá về số sao 0..5 tương ứng với tốt...khá
   */
    rateToNumber(rate) {
      if (rate == null) return 0;

      const asNumber = Number(rate);
      if (Number.isFinite(asNumber)) return Common.clamp(Math.round(asNumber), 0, 5);

      const s = Common.normalizeText(rate);
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
    },

  };

  window.Common = Common;
})();