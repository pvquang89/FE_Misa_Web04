(function () {
  "use strict";

  /**
   * Thu gọn / mở rộng sidebar 
   */
  window.collapseSidebar = function collapseSidebar() {
    const sidebar = document.getElementById("sidebar");
    const iconLeft = document.getElementById("icon-left");
    const content = document.querySelector(".recruiment-app-content-container");
    if (!sidebar || !iconLeft || !content) return;

    sidebar.classList.toggle("sidebar-collapse-mode");
    sidebar.classList.toggle("sidebar-expand-mode");
    iconLeft.classList.toggle("icon-right");
    iconLeft.classList.toggle("icon-left");

    const isCollapsed = sidebar.classList.contains("sidebar-collapse-mode");

    content.classList.toggle("width-collapse", isCollapsed);
    content.classList.toggle("width-expanded", !isCollapsed);

    localStorage.setItem("misa_sidebar_collapsed", isCollapsed ? "1" : "0");
  };

  /**
   * Khôi phục trạng thái sidebar + content 
   */
  function applySidebarStateFromStorage() {
    const sidebar = document.getElementById("sidebar");
    const iconLeft = document.getElementById("icon-left");
    const content = document.querySelector(".recruiment-app-content-container");
    if (!sidebar || !iconLeft || !content) return;

    const isCollapsed = localStorage.getItem("misa_sidebar_collapsed") === "1";

    sidebar.classList.toggle("sidebar-collapse-mode", isCollapsed);
    sidebar.classList.toggle("sidebar-expand-mode", !isCollapsed);

    iconLeft.classList.toggle("icon-right", isCollapsed);
    iconLeft.classList.toggle("icon-left", !isCollapsed);

    content.classList.toggle("width-collapse", isCollapsed);
    content.classList.toggle("width-expanded", !isCollapsed);
  }

  document.addEventListener("DOMContentLoaded", applySidebarStateFromStorage);
})();