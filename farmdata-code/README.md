# FarmData — Figma to Code

Bộ source chuyển từ file Figma **FARMDATA** sang HTML/CSS/JavaScript thuần, không cần cài package.

## Chạy dự án

Cách nhanh nhất:

```bash
python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

Bạn cũng có thể mở trực tiếp `index.html`, nhưng local server giúp các asset và điều hướng hoạt động ổn định hơn.

## Phạm vi đã dựng

- Login: mặc định, lỗi, loading, thành công.
- Capture: form nhập phiên chụp, tổng hợp dữ liệu, lỗi validation, dữ liệu trạm, trạng thái lưu, mất kết nối và toàn bộ bottom sheet chọn dữ liệu.
- Post List: danh sách nông dân/admin, trạng thái trống, bộ lọc, loading, lỗi kết nối, sắp xếp, trình xem ảnh.
- Management Dashboard: sidebar, quản lý mã luống, loại cây, tài khoản, thêm mới, import CSV, action menu, confirm dialog, snackbar và kết quả import.

Tổng cộng: **37 screen/state** được ánh xạ theo node Figma trong `FIGMA_SCREEN_MAP.md`.

## Cấu trúc

```text
farmdata-code/
├── index.html
├── styles.css
├── app.js
├── FIGMA_SCREEN_MAP.md
├── README.md
└── assets/
    ├── logo.svg
    └── login-background.svg
```

## Ghi chú asset

`logo.svg` và `login-background.svg` đã được lưu cục bộ. Các ảnh cây trồng/icon lấy trực tiếp từ endpoint asset của Figma để giữ đúng thiết kế. Endpoint Figma có thời hạn; khi đưa vào production nên export các asset đó vào thư mục `assets/` và đổi URL trong hằng `FIGMA` ở đầu `app.js`.
