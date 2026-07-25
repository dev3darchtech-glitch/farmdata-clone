(() => {
  "use strict";

  const FIGMA = {
    crops: [
      "https://www.figma.com/api/mcp/asset/28180119-cd9b-4abd-b7a7-fba8f9397f58",
      "https://www.figma.com/api/mcp/asset/1073a2c2-cfeb-4e12-81c3-034fbf864947",
      "https://www.figma.com/api/mcp/asset/fc95adfe-67d0-40b2-acb3-87b2ef98ae09",
      "https://www.figma.com/api/mcp/asset/c36ebff9-4011-434d-8893-8388404c6282",
      "https://www.figma.com/api/mcp/asset/ab3c8249-d5b0-4ec0-875a-4c757e82b1b3",
      "https://www.figma.com/api/mcp/asset/0ea03705-b086-440e-9e70-52d23449dee2",
      "https://www.figma.com/api/mcp/asset/ac6c7354-5493-4df7-bb8d-a37fdf602df8",
      "https://www.figma.com/api/mcp/asset/8e668595-7d66-40a0-8698-ae1b41b9d264",
    ],
    iconUser:
      "https://www.figma.com/api/mcp/asset/8f2a8db8-82be-4cf8-8ad3-8e42309ffb08",
    iconLock:
      "https://www.figma.com/api/mcp/asset/333b7f53-e8ff-4bbd-afb2-fdfc45547cfd",
    iconEye:
      "https://www.figma.com/api/mcp/asset/981f27f2-a8bc-40a0-b3be-116fb30564cb",
    google:
      "https://www.figma.com/api/mcp/asset/6f3b32a2-7630-4379-94f7-5c57d6d061b1",
    iconSearch:
      "https://www.figma.com/api/mcp/asset/ceec9824-f07f-4b51-9459-d7e5abdf86d0",
    iconFilter:
      "https://www.figma.com/api/mcp/asset/fdd05ac7-040d-43c4-8e04-c349199cce88",
    iconMenu:
      "https://www.figma.com/api/mcp/asset/f2ba7d90-a4d5-4850-968f-46b4d11f3637",
    iconBell:
      "https://www.figma.com/api/mcp/asset/6478eecf-d40c-4d7f-bb74-4da643d33a83",
    iconCamera:
      "https://www.figma.com/api/mcp/asset/12183248-823c-40ea-9f2f-02a377ad1b7d",
    iconChevron:
      "https://www.figma.com/api/mcp/asset/c2fde934-e60a-42aa-966f-738aa89eaee1",
    iconCheck:
      "https://www.figma.com/api/mcp/asset/ea30404b-2c45-4ff7-b09a-1051376fdb10",
    iconInfo:
      "https://www.figma.com/api/mcp/asset/2ef19c7d-1441-4c39-ab87-3269aeb26b85",
    iconUpload:
      "https://www.figma.com/api/mcp/asset/99a6bfa5-1c0e-4693-b216-0edbed07f154",
    iconPlus:
      "https://www.figma.com/api/mcp/asset/62d7003c-e640-483a-b23f-00413dfc48a1",
    iconMore:
      "https://www.figma.com/api/mcp/asset/37299616-04fb-45aa-9f81-050813b0a024",
    iconAdminSearch:
      "https://www.figma.com/api/mcp/asset/da05bdd2-8cfb-47c7-a728-abe92f87a0c3",
  };

  const groups = [
    {
      name: "Login",
      screens: [
        ["login-default", "Login - Mặc định", "2:2"],
        ["login-error", "Login - Lỗi", "7:216"],
        ["login-loading", "Login - Loading", "7:405"],
        ["login-success", "Login success", "8:8"],
      ],
    },
    {
      name: "Capture (Farmer)",
      screens: [
        ["capture-form", "Thông tin phiên chụp", "11:1797"],
        ["capture-review", "Tổng hợp & Kiểm tra dữ liệu", "16:4258"],
        ["capture-review-error", "Tổng hợp: Lỗi", "30:1173"],
        ["capture-outdoor", "Môi trường: Ngoài trời", "16:4846"],
        ["capture-station-detail", "Chi tiết dữ liệu trạm", "14:1993"],
        ["capture-save-success", "Lưu thành công", "16:3559"],
        ["capture-saving", "Đang lưu phiên chụp", "16:4690"],
        ["capture-save-error", "Lỗi lưu dữ liệu", "16:3744"],
        ["capture-offline", "Mất kết nối", "16:3783"],
        ["capture-select-plot", "Chọn mã số luống", "15:2671"],
        ["capture-select-crop", "Chọn loại cây", "15:2841"],
        ["capture-select-stage", "Chọn giai đoạn sinh trưởng", "15:2966"],
        ["capture-measurements", "Số đo tại nơi", "16:3101"],
      ],
    },
    {
      name: "Post List",
      screens: [
        ["post-farmer", "Danh sách post (Nông dân)", "23:707"],
        ["post-empty", "Trạng thái trống", "23:1309"],
        ["post-filter", "Bộ lọc", "23:1482"],
        ["post-loading", "Đang tải dữ liệu", "23:1565"],
        ["post-offline", "Lỗi kết nối", "23:1666"],
        ["post-sort", "Sắp xếp theo", "23:1750"],
        ["post-admin", "Danh sách post (Admin)", "23:877"],
        ["post-viewer", "Trình xem ảnh", "23:1153"],
      ],
    },
    {
      name: "Management Dashboard (Admin)",
      screens: [
        ["admin-sidebar", "Sidebar", "23:2832"],
        ["admin-plots", "Quản lý mã số luồng", "23:3041"],
        ["admin-crops", "Quản lý loại cây", "23:3226"],
        ["admin-accounts", "Quản lý tài khoản", "23:3502"],
        ["admin-add-plot", "Thêm mã số luồng", "23:3809"],
        ["admin-import-select", "Import CSV - Chọn file", "23:4025"],
        ["admin-import-uploading", "Import CSV - Đang tải", "25:28"],
        ["admin-action-menu", "Action Menu", "25:73"],
        ["admin-confirm", "Confirm Dialog", "25:126"],
        ["admin-snackbar", "Snackbar / Notification", "25:182"],
        ["admin-import-result", "Import Result Modal", "25:241"],
      ],
    },
  ];

  const flatScreens = groups.flatMap((group) =>
    group.screens.map((item) => ({
      id: item[0],
      title: item[1],
      node: item[2],
      group: group.name,
    })),
  );

  const posts = [
    {
      plot: "L-001",
      crop: "Cà chua",
      stage: "Giai đoạn 3",
      env: "Nhà kính",
      symptom: "Đốm vàng",
      severity: "Mức độ vừa",
      date: "23/07/2026 - 08:45",
      dot: "#facc15",
      plus: "+2",
      images: [0, 1],
    },
    {
      plot: "L-002",
      crop: "Dưa leo",
      stage: "Giai đoạn 2",
      env: "Ngoài trời",
      symptom: "Phấn trắng",
      severity: "Mức độ nhẹ",
      date: "22/07/2026 - 17:30",
      dot: "#22c55e",
      plus: "+2",
      images: [2, 3],
    },
    {
      plot: "L-003",
      crop: "Ớt",
      stage: "Giai đoạn 4",
      env: "Nhà kính",
      symptom: "Thối trái",
      severity: "Mức độ nặng",
      date: "22/07/2026 - 09:20",
      dot: "#dc2626",
      plus: "+2",
      images: [4, 5],
    },
    {
      plot: "L-004",
      crop: "Cà chua",
      stage: "Giai đoạn 5",
      env: "Ngoài trời",
      symptom: "Đốm lá",
      severity: "Mức độ nhẹ",
      date: "21/07/2026 - 16:15",
      dot: "#22c55e",
      plus: "+3",
      images: [6, 7],
    },
  ];

  const plots = [
    { code: "L-001", meta: "Khu A - 1000 m²", active: true },
    { code: "L-002", meta: "Khu A - 800 m²", active: true },
    { code: "L-003", meta: "Khu B - 1200 m²", active: true },
    { code: "L-004", meta: "Khu B - 900 m²", active: false },
    { code: "L-005", meta: "Khu C - 1100 m²", active: true },
  ];

  const crops = [
    {
      code: "CT-01",
      name: "Cà chua",
      meta: "Solanum lycopersicum",
      active: true,
    },
    { code: "DL-02", name: "Dưa leo", meta: "Cucumis sativus", active: true },
    { code: "OT-03", name: "Ớt", meta: "Capsicum annuum", active: true },
    { code: "LU-04", name: "Lúa", meta: "Oryza sativa", active: false },
    { code: "BD-05", name: "Bí đỏ", meta: "Cucurbita moschata", active: true },
  ];

  const accounts = [
    {
      code: "ND-001",
      name: "Nguyễn Văn An",
      meta: "Nông dân · an.nguyen",
      active: true,
    },
    {
      code: "ND-002",
      name: "Trần Thị Bình",
      meta: "Nông dân · binh.tran",
      active: true,
    },
    {
      code: "AD-001",
      name: "FarmData Admin",
      meta: "Quản trị viên · admin",
      active: true,
    },
    {
      code: "ND-003",
      name: "Lê Văn Cường",
      meta: "Nông dân · cuong.le",
      active: false,
    },
    {
      code: "ND-004",
      name: "Phạm Thị Dung",
      meta: "Nông dân · dung.pham",
      active: true,
    },
  ];

  const app = document.getElementById("app");
  const navigation = document.getElementById("screen-navigation");
  const title = document.getElementById("workspace-title");
  const search = document.getElementById("screen-search");
  const deviceFrame = document.getElementById("device-frame");
  const deviceToggle = document.getElementById("toggle-device");

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  }

  function icon(src, fallback, label = "") {
    return `<span class="icon-wrap" aria-hidden="${label ? "false" : "true"}">
      <img src="${src}" alt="${escapeHtml(label)}" onload="this.nextElementSibling.hidden=true" onerror="this.hidden=true" />
      <span class="icon-fallback">${fallback}</span>
    </span>`;
  }

  function route(id) {
    window.location.hash = id;
  }

  function appHeader(label = "FarmData", options = {}) {
    const leftButton = options.back
      ? `<button class="icon-button" type="button" data-route="${options.back}">‹</button>`
      : `<button class="icon-button" type="button" data-route="${options.menuRoute || "admin-sidebar"}">${icon(FIGMA.iconMenu, "☰", "Menu")}</button>`;
    const searchButton = options.search
      ? `<button class="icon-button" type="button">${icon(FIGMA.iconAdminSearch, "⌕", "Tìm kiếm")}</button>`
      : "";
    const bell = options.hideBell
      ? ""
      : `<button class="icon-button" type="button">${icon(FIGMA.iconBell, "♧", "Thông báo")}</button>`;
    return `<header class="app-header ${options.bordered ? "bordered" : ""}">
      <div class="header-left">${leftButton}<h1>${escapeHtml(label)}</h1></div>
      <div class="header-right">${searchButton}${bell}</div>
    </header>`;
  }

  function bottomNav(active = "capture", admin = false) {
    if (admin) {
      return `<nav class="app-bottom-nav" aria-label="Điều hướng chính">
        <button class="bottom-link ${active === "post" ? "active" : ""}" data-route="post-admin"><span class="nav-glyph">▱</span><span>Bài đăng</span></button>
        <button class="bottom-link ${active === "admin" ? "active" : ""}" data-route="admin-plots"><span class="nav-glyph">⌘</span><span>Quản lý</span></button>
        <button class="bottom-link ${active === "profile" ? "active" : ""}"><span class="nav-glyph">♙</span><span>Cá nhân</span></button>
      </nav>`;
    }
    return `<nav class="app-bottom-nav" aria-label="Điều hướng chính">
      <button class="bottom-link ${active === "capture" ? "active" : ""}" data-route="capture-form"><span class="nav-glyph">▣</span><span>Capture</span></button>
      <button class="bottom-link ${active === "post" ? "active" : ""}" data-route="post-farmer"><span class="nav-glyph">≡</span><span>Post</span></button>
    </nav>`;
  }

  function loginScreen(state) {
    const isError = state === "error";
    const isLoading = state === "loading";
    if (state === "success") {
      return `<section class="app-screen">
        <div class="success-splash">
          <img src="./assets/logo.svg" alt="FarmData" width="110" height="104" />
          <div class="success-ring">✓</div>
          <h2>Đăng nhập thành công</h2>
          <p>Chào mừng bạn quay lại FarmData.<br/>Dữ liệu đang được đồng bộ.</p>
          <button class="primary-button full-width" data-route="capture-form">Tiếp tục</button>
        </div>
      </section>`;
    }
    return `<section class="app-screen login-screen">
      <img class="login-background" src="./assets/login-background.svg" alt="Phong cảnh nông trại" />
      <div class="login-inner">
        <div class="login-brand">
          <img src="./assets/logo.svg" alt="FarmData" />
          <h1>FarmData</h1>
          <p>Quản lý dữ liệu nông nghiệp</p>
        </div>
        <form class="login-form" id="login-form">
          <div class="login-field">
            <label for="username">Tên đăng nhập</label>
            <div class="input-shell">
              <span class="leading-icon">${icon(FIGMA.iconUser, "♙")}</span>
              <input class="field-control" id="username" value="${isError ? "nông_dân_01" : ""}" placeholder="Nhập tên đăng nhập" autocomplete="username" />
            </div>
          </div>
          <div class="login-field">
            <label for="password">Mật khẩu</label>
            <div class="input-shell">
              <span class="leading-icon">${icon(FIGMA.iconLock, "▣")}</span>
              <input class="field-control" id="password" type="password" value="${isError ? "123456" : ""}" placeholder="Nhập mật khẩu" autocomplete="current-password" />
              <button class="trailing-icon" id="toggle-password" type="button">${icon(FIGMA.iconEye, "◉")}</button>
            </div>
            ${isError ? `<p class="login-error">Tên đăng nhập hoặc mật khẩu không đúng.</p>` : ""}
          </div>
          <div class="login-actions">
            <button class="primary-button full-width" type="submit">Đăng nhập</button>
            <button class="google-button" type="button">
              <img src="${FIGMA.google}" alt="Google" onerror="this.outerHTML='<strong style=&quot;color:#4285f4;font-size:22px&quot;>G</strong>'" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </form>
      </div>
      ${isLoading ? `<div class="loading-overlay"><div class="loading-card"><span class="spinner"></span><strong>Đang đăng nhập...</strong><span class="small muted">Vui lòng chờ trong giây lát</span></div></div>` : ""}
    </section>`;
  }

  function stationCard(expanded = false) {
    return `<article class="station-card">
      <div class="station-weather">☀</div>
      <div class="station-main">
        <div class="station-head"><span>Trạm DN-01</span><span>Cập nhật 08:30</span></div>
        <div class="station-metrics">
          <div><small>NHIỆT ĐỘ</small><strong>29°C</strong></div>
          <div><small>ĐỘ ẨM</small><strong>74%</strong></div>
          <div><small>GIÓ</small><strong>3.2 m/s</strong></div>
        </div>
        ${expanded ? `<div class="station-metrics" style="margin-top:10px"><div><small>LƯỢNG MƯA</small><strong>0 mm</strong></div><div><small>ÁP SUẤT</small><strong>1008 hPa</strong></div><div><small>UV</small><strong>6</strong></div></div>` : ""}
        <button class="station-link" type="button" data-route="capture-station-detail">Xem thêm chi tiết ›</button>
      </div>
    </article>`;
  }

  function severityList() {
    const items = [
      ["#facc15", "Chớm (1 - 10%)"],
      ["#fb923c", "Nhẹ (>10 - 25%)"],
      ["#ea580c", "Vừa (>25 - 50%)"],
      ["#ef4444", "Nặng (>50 - 75%)"],
      ["#991b1b", "Rất nặng (>75%)"],
    ];
    return `<div class="severity-list">${items.map((item, index) => `<button type="button" class="severity-option ${index === 2 ? "active" : ""}" data-severity="${index}"><span class="severity-dot" style="background:${item[0]}"></span><span>${item[1]}</span><span class="radio-mark"></span></button>`).join("")}</div>`;
  }

  function captureBase(options = {}) {
    const photos = options.photos !== false;
    const outdoor = options.outdoor !== false;
    return `<section class="app-screen">
      ${appHeader("FarmData", { menuRoute: "admin-sidebar" })}
      <div class="app-scroll">
        <main class="capture-content">
          <h2>Phiên chụp mới</h2>
          <section class="capture-section">
            <h3 class="capture-section-title">1. Ảnh cây trồng <span class="required">*</span></h3>
            <span class="field-help">Chụp ít nhất 1 ảnh</span>
            <div class="photo-row">
              <button class="capture-tile" type="button" id="capture-photo">${icon(FIGMA.iconCamera, "▣", "Chụp ảnh")}<span>Chụp ảnh</span></button>
              ${photos ? `<div class="photo-thumb"><img src="${FIGMA.crops[0]}" alt="Ảnh cây trồng"/><button class="photo-remove" type="button">×</button></div><div class="photo-thumb"><img src="${FIGMA.crops[1]}" alt="Ảnh cây trồng"/><button class="photo-remove" type="button">×</button></div>` : `<span class="small" style="color:#ba1a1a">Chưa có ảnh</span>`}
            </div>
          </section>

          <section class="capture-section">
            <h3 class="capture-section-title">2. Thông tin cây trồng <span class="required">*</span></h3>
            <div class="field-grid">
              <label class="field-stack"><span class="field-label">Mã số luống (không bắt buộc)</span><select class="select-control" id="plot-select"><option>Chọn mã số luống</option><option selected>L-001</option><option>L-002</option><option>L-003</option></select></label>
              <label class="field-stack"><span class="field-label">Loại cây <span class="required">*</span></span><select class="select-control"><option>Chọn loại cây</option><option selected>Cà chua</option><option>Dưa leo</option><option>Ớt</option></select></label>
              <label class="field-stack"><span class="field-label">Giai đoạn sinh trưởng <span class="required">*</span></span><select class="select-control"><option>Chọn giai đoạn sinh trưởng</option><option>Giai đoạn 1</option><option>Giai đoạn 2</option><option selected>Giai đoạn 3</option></select></label>
            </div>
          </section>

          <section class="capture-section">
            <h3 class="capture-section-title">3. Môi trường <span class="required">*</span></h3>
            <div class="environment-toggle"><button class="${outdoor ? "active" : ""}" type="button">Ngoài trời</button><button class="${outdoor ? "" : "active"}" type="button">Nhà kính</button></div>
            ${outdoor ? stationCard(options.expandedStation) : `<div class="context-hint"><span>ⓘ</span><span>Dữ liệu môi trường nhà kính được nhập từ thiết bị cảm biến hoặc số đo tại nơi.</span></div>`}
          </section>

          <section class="capture-section">
            <h3 class="capture-section-title">5. Số đo tại nơi (không bắt buộc)</h3>
            <div class="measurement-card"><span>♨ Chưa nhập</span><button type="button" data-route="capture-measurements">Nhập / Chỉnh sửa ›</button></div>
          </section>

          <section class="capture-section">
            <h3 class="capture-section-title">6. Triệu chứng <span class="required">*</span></h3>
            <textarea class="textarea-control" maxlength="300" id="symptom" placeholder="Nhập triệu chứng quan sát được...">Đốm vàng xuất hiện rải rác trên lá, mép lá hơi khô.</textarea>
            <span class="char-counter" id="char-counter">62/300</span>
            <span class="field-label">Mức độ <span class="required">*</span></span>
            ${severityList()}
            <div class="context-hint"><span>ⓘ</span><span>Mức độ được tính theo tổng diện tích lá bị ảnh hưởng và tăng dần theo tỷ lệ phần trăm.</span></div>
          </section>

          <div class="capture-submit"><button class="primary-button full-width" type="button" data-route="capture-review">Hoàn tất phiên chụp</button></div>
        </main>
      </div>
      ${bottomNav("capture")}
    </section>`;
  }

  function stationDetail() {
    const metrics = [
      ["Nhiệt độ", "29°C", "Ổn định"],
      ["Độ ẩm không khí", "74%", "Cao"],
      ["Tốc độ gió", "3.2 m/s", "Nhẹ"],
      ["Lượng mưa", "0 mm", "Không mưa"],
      ["Áp suất", "1008 hPa", "Bình thường"],
      ["Chỉ số UV", "6", "Cao"],
    ];
    return `<section class="app-screen">
      ${appHeader("Chi tiết dữ liệu trạm", { back: "capture-form", bordered: true, hideBell: true })}
      <div class="app-scroll"><main class="screen-content compact">
        <div style="padding:18px 0">${stationCard(true)}</div>
        <h2 class="screen-title" style="font-size:16px;margin-top:8px">Dữ liệu môi trường</h2>
        <div class="review-section">${metrics.map((item) => `<div class="summary-row"><span>${item[0]}</span><strong>${item[1]} · ${item[2]}</strong></div>`).join("")}</div>
        <div class="context-hint" style="margin-top:16px"><span>ⓘ</span><span>Dữ liệu được đồng bộ tự động từ trạm DN-01, cập nhật gần nhất lúc 08:30.</span></div>
      </main></div>
    </section>`;
  }

  function captureReview(error = false) {
    return `<section class="app-screen">
      ${appHeader("Tổng hợp & Kiểm tra", { back: "capture-form", bordered: true, hideBell: true })}
      <div class="app-scroll"><main class="review-content">
        ${error ? `<div class="validation-banner"><strong>Không thể hoàn tất</strong><br/>Vui lòng bổ sung ảnh cây trồng và kiểm tra lại trường “Loại cây”.</div>` : `<div class="context-hint"><span>✓</span><span>Kiểm tra lại thông tin trước khi lưu phiên chụp.</span></div>`}
        <section class="review-section"><h3>Ảnh cây trồng (4)</h3><div class="review-gallery">${[0, 1, 2, 3].map((i) => `<img src="${FIGMA.crops[i]}" alt="Ảnh cây trồng ${i + 1}"/>`).join("")}</div></section>
        <section class="review-section"><h3>Thông tin cây trồng</h3>
          <div class="summary-row"><span>Mã số luống</span><strong>L-001</strong></div>
          <div class="summary-row"><span>Loại cây</span><strong>Cà chua</strong></div>
          <div class="summary-row"><span>Giai đoạn</span><strong>Giai đoạn 3</strong></div>
          <div class="summary-row"><span>Môi trường</span><strong>Ngoài trời</strong></div>
        </section>
        <section class="review-section"><h3>Quan sát</h3>
          <div class="summary-row"><span>Triệu chứng</span><strong>Đốm vàng, mép lá hơi khô</strong></div>
          <div class="summary-row"><span>Mức độ</span><strong>Vừa (&gt;25 - 50%)</strong></div>
          <div class="summary-row"><span>Trạm</span><strong>DN-01 · 29°C · 74%</strong></div>
        </section>
      </main></div>
      <div class="sticky-action"><button class="primary-button full-width ${error ? "disabled-button" : ""}" ${error ? "disabled" : ""} data-route="capture-saving">Lưu phiên chụp</button></div>
      ${bottomNav("capture")}
    </section>`;
  }

  function modalOverlay(base, config) {
    return `${base}<div class="scrim"></div><div class="modal-card">
      <div class="modal-icon ${config.danger ? "danger" : ""}">${config.icon || "✓"}</div>
      <h2>${config.title}</h2><p>${config.text}</p>
      <div class="button-row">${config.secondary ? `<button class="ghost-button" type="button" data-route="${config.secondary.route}">${config.secondary.label}</button>` : ""}<button class="primary-button" type="button" data-route="${config.primary.route}">${config.primary.label}</button></div>
    </div>`;
  }

  function captureStatus(type) {
    const base = captureBase();
    if (type === "saving")
      return `${base}<div class="loading-overlay"><div class="loading-card"><span class="spinner"></span><strong>Đang lưu phiên chụp</strong><span class="small muted">Đang tải ảnh và đồng bộ dữ liệu...</span></div></div>`;
    if (type === "success")
      return modalOverlay(base, {
        icon: "✓",
        title: "Lưu thành công",
        text: "Phiên chụp đã được lưu và tự động tạo thành một bài đăng mới.",
        primary: { label: "Xem bài đăng", route: "post-farmer" },
        secondary: { label: "Chụp tiếp", route: "capture-form" },
      });
    if (type === "error")
      return modalOverlay(base, {
        icon: "!",
        danger: true,
        title: "Không thể lưu dữ liệu",
        text: "Đã xảy ra lỗi khi tải ảnh lên. Dữ liệu nháp vẫn được giữ trên thiết bị.",
        primary: { label: "Thử lại", route: "capture-saving" },
        secondary: { label: "Để sau", route: "capture-form" },
      });
    return modalOverlay(base, {
      icon: "⌁",
      danger: true,
      title: "Mất kết nối",
      text: "Thiết bị đang ngoại tuyến. Phiên chụp sẽ được lưu cục bộ và đồng bộ khi có mạng.",
      primary: { label: "Lưu ngoại tuyến", route: "capture-form" },
      secondary: { label: "Hủy", route: "capture-form" },
    });
  }

  function bottomSheet(
    base,
    titleText,
    items,
    selected,
    confirmRoute = "capture-form",
  ) {
    return `${base}<div class="scrim" data-route="${confirmRoute}"></div><section class="bottom-sheet">
      <div class="sheet-handle"></div><div class="sheet-header"><h2>${titleText}</h2><button class="sheet-close" type="button" data-route="${confirmRoute}">×</button></div>
      <div class="option-list">${items.map((item) => `<button class="option-item ${item === selected ? "active" : ""}" type="button" data-route="${confirmRoute}"><span>${item}</span><span>${item === selected ? "✓" : ""}</span></button>`).join("")}</div>
    </section>`;
  }

  function measurementSheet() {
    const base = captureBase();
    return `${base}<div class="scrim" data-route="capture-form"></div><section class="bottom-sheet">
      <div class="sheet-handle"></div><div class="sheet-header"><h2>Số đo tại nơi</h2><button class="sheet-close" type="button" data-route="capture-form">×</button></div>
      <div class="field-grid">
        <label class="field-stack"><span class="field-label">Nhiệt độ (°C)</span><input class="field-control" type="number" value="29"/></label>
        <label class="field-stack"><span class="field-label">Độ ẩm (%)</span><input class="field-control" type="number" value="74"/></label>
        <label class="field-stack"><span class="field-label">Tốc độ gió (m/s)</span><input class="field-control" type="number" value="3.2" step="0.1"/></label>
        <button class="primary-button full-width" type="button" data-route="capture-form">Lưu số đo</button>
      </div>
    </section>`;
  }

  function postCard(post, admin = false) {
    return `<article class="post-card" data-post="${post.plot} ${post.crop} ${post.env}">
      <div class="post-images">
        <div class="post-image"><img src="${FIGMA.crops[post.images[0]]}" alt="${escapeHtml(post.crop)}"/></div>
        <button class="post-image" style="border:0;padding:0" type="button" data-route="post-viewer"><img src="${FIGMA.crops[post.images[1]]}" alt="${escapeHtml(post.crop)}"/><span class="image-count">${post.plus}</span></button>
      </div>
      <div class="post-body">
        <div class="post-head"><span class="plot-tag">${post.plot}</span><strong>${post.crop} - ${post.stage}</strong></div>
        <div class="post-meta">${post.env}</div>
        <div class="symptom-line"><span class="symptom-dot" style="background:${post.dot}"></span><span>${post.symptom} - ${post.severity}</span></div>
        <div class="post-date">▧ ${post.date}</div>
        ${admin ? `<div style="display:flex;gap:8px;margin-top:8px"><button class="secondary-button" style="min-height:30px;padding:0 9px;font-size:11px" type="button">Xem</button><button class="ghost-button" style="min-height:30px;padding:0 9px;font-size:11px" type="button">Gắn nhãn</button></div>` : ""}
      </div>
    </article>`;
  }

  function postListScreen(options = {}) {
    const admin = Boolean(options.admin);
    const base = `<section class="app-screen">
      ${appHeader("FarmData", { menuRoute: "admin-sidebar" })}
      <div class="app-scroll"><main class="screen-content">
        <h2 class="screen-title">Post</h2>
        <div class="search-row"><label class="search-control"><span class="search-icon">${icon(FIGMA.iconSearch, "⌕")}</span><input id="post-search" placeholder="Tìm mã luống hoặc loại cây" /></label><button class="filter-button" type="button" data-route="post-filter">${icon(FIGMA.iconFilter, "☷")}<span>Bộ lọc</span></button></div>
        <div class="chip-row"><button class="chip active" data-env="all">Tất cả</button><button class="chip" data-env="Ngoài trời">Ngoài trời</button><button class="chip" data-env="Nhà kính">Nhà kính</button><button class="chip sort-square" type="button" data-route="post-sort">≡↑</button></div>
        ${options.empty ? `<div class="empty-state"><div class="empty-illustration">▱</div><h3>Chưa có bài đăng</h3><p>Hoàn tất một phiên chụp để bài đăng đầu tiên xuất hiện tại đây.</p><button class="primary-button" data-route="capture-form">Tạo phiên chụp</button></div>` : options.loading ? `<div class="post-list">${Array.from({ length: 4 }, () => `<div class="skeleton-card"></div>`).join("")}</div>` : options.offline ? `<div class="empty-state"><div class="empty-illustration" style="background:#fff0f0;color:#ba1a1a">⌁</div><h3>Không thể tải dữ liệu</h3><p>Kiểm tra kết nối mạng và thử lại.</p><button class="primary-button" data-route="post-farmer">Thử lại</button></div>` : `<div class="post-list" id="post-list">${posts.map((post) => postCard(post, admin)).join("")}</div>`}
      </main></div>
      ${bottomNav(admin ? "post" : "post", admin)}
    </section>`;
    return base;
  }

  function filterSheet() {
    const base = postListScreen();
    return `${base}<div class="scrim" data-route="post-farmer"></div><section class="bottom-sheet">
      <div class="sheet-handle"></div><div class="sheet-header"><h2>Bộ lọc</h2><button class="sheet-close" type="button" data-route="post-farmer">×</button></div>
      <div class="field-grid">
        <label class="field-stack"><span class="field-label">Mã số luống</span><select class="select-control"><option>Tất cả</option><option>L-001</option><option>L-002</option></select></label>
        <label class="field-stack"><span class="field-label">Loại cây</span><select class="select-control"><option>Tất cả</option><option>Cà chua</option><option>Dưa leo</option><option>Ớt</option></select></label>
        <label class="field-stack"><span class="field-label">Môi trường</span><select class="select-control"><option>Tất cả</option><option>Ngoài trời</option><option>Nhà kính</option></select></label>
        <div class="button-row"><button class="ghost-button" type="button" data-route="post-farmer">Đặt lại</button><button class="primary-button" type="button" data-route="post-farmer">Áp dụng</button></div>
      </div>
    </section>`;
  }

  function sortSheet() {
    return bottomSheet(
      postListScreen(),
      "Sắp xếp theo",
      ["Mới nhất", "Cũ nhất", "Mức độ nặng nhất", "Mã luống A → Z"],
      "Mới nhất",
      "post-farmer",
    );
  }

  function imageViewer() {
    return `<section class="app-screen"><div class="viewer"><div class="viewer-header"><button class="icon-button" style="color:white" data-route="post-farmer">×</button><strong>Ảnh cây trồng</strong><button class="icon-button" style="color:white">⋮</button></div><img class="viewer-image" src="${FIGMA.crops[0]}" alt="Ảnh cây trồng toàn màn hình"/><span class="viewer-count">1 / 4</span></div></section>`;
  }

  function dataTableRows(items, type) {
    return items
      .map(
        (item) => `<tr>
      <td><div class="table-main"><strong>${type === "accounts" ? item.name : item.code}</strong><span>${type === "accounts" ? item.meta : item.meta}</span></div></td>
      <td><span class="status ${item.active ? "active" : "inactive"}">${item.active ? "Đang sử dụng" : "Ngừng sử dụng"}</span></td>
      <td><button class="more-button" type="button" data-route="admin-action-menu">⋮</button></td>
    </tr>`,
      )
      .join("");
  }

  function adminScreen(type = "plots") {
    const config = {
      plots: {
        title: "Mã số luồng",
        placeholder: "Tìm mã luống",
        total: "128",
        items: plots,
        first: "Mã số luồng",
      },
      crops: {
        title: "Loại cây",
        placeholder: "Tìm loại cây",
        total: "24",
        items: crops,
        first: "Loại cây",
      },
      accounts: {
        title: "Tài khoản",
        placeholder: "Tìm tài khoản",
        total: "86",
        items: accounts,
        first: "Tài khoản",
      },
    }[type];
    return `<section class="app-screen">
      ${appHeader(config.title, { menuRoute: "admin-sidebar", bordered: true, search: true })}
      <div class="app-scroll"><main class="admin-content">
        <div class="admin-actions">
          <label class="search-control"><span class="search-icon">${icon(FIGMA.iconAdminSearch, "⌕")}</span><input placeholder="${config.placeholder}"/></label>
          <div class="admin-button-row"><button class="admin-small-button outline" type="button" data-route="admin-import-select">${icon(FIGMA.iconUpload, "⇩")}<span>Import CSV</span></button><button class="admin-small-button filled" type="button" data-route="admin-add-plot">${icon(FIGMA.iconPlus, "+")}<span>Thêm mới</span></button></div>
        </div>
        <div class="total-label">TỔNG SỐ: ${config.total}</div>
        <table class="data-table"><thead><tr><th>${config.first}</th><th>Trạng thái</th><th></th></tr></thead><tbody>${dataTableRows(config.items, type)}</tbody></table>
      </main></div>
      <nav class="pagination"><button class="page-dot active">1</button><button class="page-dot">2</button><button class="page-dot">3</button><button class="page-dot">4</button><button class="page-dot">5</button><span>...</span><button class="page-dot">6</button><button class="page-dot">›</button></nav>
      ${bottomNav("admin", true)}
    </section>`;
  }

  function adminDrawer() {
    const base = adminScreen("plots");
    return `${base}<div class="scrim" data-route="admin-plots"></div><aside class="drawer">
      <div class="drawer-brand"><img src="./assets/logo.svg" alt="FarmData"/><div><strong>FarmData</strong><div class="small muted">Management Dashboard</div></div></div>
      <nav class="drawer-menu">
        <button class="drawer-link" data-route="post-admin"><span>▱</span><span>Danh sách bài đăng</span></button>
        <button class="drawer-link active" data-route="admin-plots"><span>▦</span><span>Quản lý mã số luồng</span></button>
        <button class="drawer-link" data-route="admin-crops"><span>♧</span><span>Quản lý loại cây</span></button>
        <button class="drawer-link" data-route="admin-accounts"><span>♙</span><span>Quản lý tài khoản</span></button>
        <button class="drawer-link" data-route="login-default"><span>↪</span><span>Đăng xuất</span></button>
      </nav>
    </aside>`;
  }

  function addPlotScreen() {
    return `<section class="app-screen">
      ${appHeader("Thêm mã số luồng", { back: "admin-plots", bordered: true, hideBell: true })}
      <div class="app-scroll"><main class="screen-content compact">
        <div class="field-grid" style="padding-top:20px">
          <label class="field-stack"><span class="field-label">Mã số luồng <span class="required">*</span></span><input class="field-control" placeholder="Ví dụ: L-006"/></label>
          <label class="field-stack"><span class="field-label">Khu vực <span class="required">*</span></span><input class="field-control" placeholder="Ví dụ: Khu C"/></label>
          <label class="field-stack"><span class="field-label">Diện tích (m²)</span><input class="field-control" type="number" placeholder="Nhập diện tích"/></label>
          <label class="field-stack"><span class="field-label">Trạng thái</span><select class="select-control"><option>Đang sử dụng</option><option>Ngừng sử dụng</option></select></label>
          <label class="field-stack"><span class="field-label">Ghi chú</span><textarea class="textarea-control" placeholder="Nhập ghi chú..."></textarea></label>
          <button class="primary-button full-width" data-route="admin-snackbar">Thêm mã số luồng</button>
        </div>
      </main></div>
      ${bottomNav("admin", true)}
    </section>`;
  }

  function importScreen(uploading = false) {
    return `<section class="app-screen">
      ${appHeader("Import CSV", { back: "admin-plots", bordered: true, hideBell: true })}
      <div class="app-scroll"><main class="screen-content compact">
        <div style="padding-top:20px;display:flex;flex-direction:column;gap:18px">
          <div class="drop-zone"><div style="font-size:36px">⇩</div><strong>${uploading ? "Đang tải dữ liệu..." : "Chọn file CSV"}</strong><span class="small">Kéo thả file vào đây hoặc nhấn để chọn<br/>Tối đa 10 MB</span>${uploading ? `<div style="width:100%;margin-top:12px"><div class="progress-track"><div class="progress-bar"></div></div><div class="small muted" style="margin-top:8px">farm_plots_2026.csv · 68%</div></div>` : `<input type="file" accept=".csv" aria-label="Chọn file CSV"/>`}</div>
          <section class="review-section"><h3>Định dạng dữ liệu</h3><div class="summary-row"><span>Cột bắt buộc</span><strong>plot_code, area, status</strong></div><div class="summary-row"><span>Mã hóa</span><strong>UTF-8</strong></div><div class="summary-row"><span>Dòng tiêu đề</span><strong>Có</strong></div></section>
          <button class="primary-button full-width ${uploading ? "disabled-button" : ""}" ${uploading ? "disabled" : ""} data-route="admin-import-uploading">${uploading ? "Đang xử lý..." : "Tiếp tục"}</button>
        </div>
      </main></div>
      ${bottomNav("admin", true)}
    </section>`;
  }

  function adminOverlay(type) {
    const base = adminScreen("plots");
    if (type === "actions")
      return `${base}<div class="scrim" data-route="admin-plots"></div><div class="action-popover"><button type="button">Chỉnh sửa</button><button type="button">Xem chi tiết</button><button class="danger" type="button" data-route="admin-confirm">Ngừng sử dụng</button></div>`;
    if (type === "confirm")
      return modalOverlay(base, {
        icon: "!",
        danger: true,
        title: "Ngừng sử dụng mã L-004?",
        text: "Mã số luồng này sẽ không còn xuất hiện trong màn hình nhập phiên chụp.",
        primary: { label: "Xác nhận", route: "admin-snackbar" },
        secondary: { label: "Hủy", route: "admin-plots" },
      });
    if (type === "snackbar")
      return `${base}<div class="snackbar"><span>✓</span><span>Đã cập nhật dữ liệu thành công.</span></div>`;
    return `${base}<div class="scrim" data-route="admin-plots"></div><div class="modal-card"><div class="modal-icon">✓</div><h2>Import hoàn tất</h2><p>Đã xử lý 128 dòng dữ liệu.</p><section class="review-section"><div class="summary-row"><span>Thành công</span><strong style="color:#2ecc71">124</strong></div><div class="summary-row"><span>Bỏ qua</span><strong style="color:#f59e0b">3</strong></div><div class="summary-row"><span>Lỗi</span><strong style="color:#ba1a1a">1</strong></div></section><div class="button-row" style="margin-top:16px"><button class="ghost-button" data-route="admin-import-select">Xem lỗi</button><button class="primary-button" data-route="admin-plots">Hoàn tất</button></div></div>`;
  }

  const renderers = {
    "login-default": () => loginScreen("default"),
    "login-error": () => loginScreen("error"),
    "login-loading": () => loginScreen("loading"),
    "login-success": () => loginScreen("success"),
    "capture-form": () => captureBase(),
    "capture-review": () => captureReview(false),
    "capture-review-error": () => captureReview(true),
    "capture-outdoor": () => captureBase({ expandedStation: true }),
    "capture-station-detail": stationDetail,
    "capture-save-success": () => captureStatus("success"),
    "capture-saving": () => captureStatus("saving"),
    "capture-save-error": () => captureStatus("error"),
    "capture-offline": () => captureStatus("offline"),
    "capture-select-plot": () =>
      bottomSheet(
        captureBase(),
        "Chọn mã số luống",
        [
          "Không chọn",
          "L-001 · Khu A",
          "L-002 · Khu A",
          "L-003 · Khu B",
          "L-004 · Khu B",
        ],
        "L-001 · Khu A",
      ),
    "capture-select-crop": () =>
      bottomSheet(
        captureBase(),
        "Chọn loại cây",
        ["Cà chua", "Dưa leo", "Ớt", "Lúa", "Bí đỏ"],
        "Cà chua",
      ),
    "capture-select-stage": () =>
      bottomSheet(
        captureBase(),
        "Chọn giai đoạn sinh trưởng",
        [
          "Giai đoạn 1 · Nảy mầm",
          "Giai đoạn 2 · Sinh trưởng",
          "Giai đoạn 3 · Ra hoa",
          "Giai đoạn 4 · Đậu quả",
          "Giai đoạn 5 · Thu hoạch",
        ],
        "Giai đoạn 3 · Ra hoa",
      ),
    "capture-measurements": measurementSheet,
    "post-farmer": () => postListScreen(),
    "post-empty": () => postListScreen({ empty: true }),
    "post-filter": filterSheet,
    "post-loading": () => postListScreen({ loading: true }),
    "post-offline": () => postListScreen({ offline: true }),
    "post-sort": sortSheet,
    "post-admin": () => postListScreen({ admin: true }),
    "post-viewer": imageViewer,
    "admin-sidebar": adminDrawer,
    "admin-plots": () => adminScreen("plots"),
    "admin-crops": () => adminScreen("crops"),
    "admin-accounts": () => adminScreen("accounts"),
    "admin-add-plot": addPlotScreen,
    "admin-import-select": () => importScreen(false),
    "admin-import-uploading": () => importScreen(true),
    "admin-action-menu": () => adminOverlay("actions"),
    "admin-confirm": () => adminOverlay("confirm"),
    "admin-snackbar": () => adminOverlay("snackbar"),
    "admin-import-result": () => adminOverlay("result"),
  };

  function buildNavigation(filter = "") {
    const needle = filter.trim().toLowerCase();
    navigation.innerHTML = groups
      .map((group) => {
        const links = group.screens.filter(
          (item) =>
            !needle ||
            `${item[1]} ${item[2]} ${group.name}`
              .toLowerCase()
              .includes(needle),
        );
        if (!links.length) return "";
        return `<section class="nav-group"><span class="nav-group-title">${group.name}</span>${links.map((item) => `<button class="screen-link" type="button" data-route="${item[0]}"><span>${item[1]}</span><span class="node-id">${item[2]}</span></button>`).join("")}</section>`;
      })
      .join("");
  }

  function render() {
    const id = window.location.hash.replace(/^#/, "") || "login-default";
    const screen = flatScreens.find((item) => item.id === id) || flatScreens[0];
    const renderer = renderers[screen.id] || renderers["login-default"];
    app.innerHTML = renderer();
    title.textContent = `${screen.group} · ${screen.title}`;
    document.title = `${screen.title} — FarmData`;
    document
      .querySelectorAll(".screen-link")
      .forEach((link) =>
        link.classList.toggle("active", link.dataset.route === screen.id),
      );
    bindScreenEvents(screen.id);
  }

  function bindScreenEvents(screenId) {
    app.querySelectorAll("[data-route]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        route(element.dataset.route);
      });
    });

    const loginForm = app.querySelector("#login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const username = app.querySelector("#username").value.trim();
        const password = app.querySelector("#password").value;
        if (!username || !password) route("login-error");
        else {
          route("login-loading");
          window.setTimeout(() => route("login-success"), 850);
        }
      });
      const toggle = app.querySelector("#toggle-password");
      toggle?.addEventListener("click", () => {
        const input = app.querySelector("#password");
        input.type = input.type === "password" ? "text" : "password";
      });
    }

    const symptom = app.querySelector("#symptom");
    symptom?.addEventListener("input", () => {
      const counter = app.querySelector("#char-counter");
      if (counter) counter.textContent = `${symptom.value.length}/300`;
    });

    app.querySelectorAll("[data-severity]").forEach((option) =>
      option.addEventListener("click", () => {
        app
          .querySelectorAll("[data-severity]")
          .forEach((item) => item.classList.remove("active"));
        option.classList.add("active");
      }),
    );

    const postSearch = app.querySelector("#post-search");
    postSearch?.addEventListener("input", () =>
      filterPosts(postSearch.value, null),
    );
    app.querySelectorAll("[data-env]").forEach((chip) =>
      chip.addEventListener("click", () => {
        app
          .querySelectorAll("[data-env]")
          .forEach((item) => item.classList.remove("active"));
        chip.classList.add("active");
        filterPosts(postSearch?.value || "", chip.dataset.env);
      }),
    );

    if (screenId === "capture-saving") {
      window.setTimeout(() => route("capture-save-success"), 1200);
    }
    if (screenId === "admin-import-uploading") {
      window.setTimeout(() => route("admin-import-result"), 1400);
    }
  }

  function filterPosts(query, env) {
    const text = String(query || "")
      .trim()
      .toLowerCase();
    app.querySelectorAll("[data-post]").forEach((card) => {
      const matchesText =
        !text || card.dataset.post.toLowerCase().includes(text);
      const matchesEnv =
        !env || env === "all" || card.dataset.post.includes(env);
      card.hidden = !(matchesText && matchesEnv);
    });
  }

  navigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-route]");
    if (button) route(button.dataset.route);
  });
  search.addEventListener("input", () => {
    buildNavigation(search.value);
    render();
  });
  deviceToggle.addEventListener("click", () => {
    deviceFrame.classList.toggle("full");
    deviceToggle.textContent = deviceFrame.classList.contains("full")
      ? "Canvas rộng"
      : "Mobile 390 × 844";
  });
  window.addEventListener("hashchange", render);

  buildNavigation();
  render();
})();
