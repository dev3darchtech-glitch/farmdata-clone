# Hướng dẫn Build Android bằng EAS Build (Expo v54)

Dự án đã được cấu hình sẵn file [eas.json](file:///home/khovan/Workplaces/capture-data/frontend/eas.json) với 2 profile chính cho Android:
- **`preview`**: Tạo file cài đặt trực tiếp **`.apk`** để cài thử nghiệm trên điện thoại Android.
- **`production`**: Tạo file gói ứng dụng **`.aab`** (Android App Bundle) để tải lên Google Play Store.

---

## 1. Cài đặt EAS CLI (Nếu chưa có)

Cài đặt EAS CLI toàn cục hoặc chạy qua `npx`:

```sh
npm install -g eas-cli
```

---

## 2. Đăng nhập tài khoản Expo

Bạn có thể chạy trực tiếp bằng `npx` mà không cần cài global:

```sh
npx eas-cli login
```

---

## 3. Khởi tạo EAS Project (Nếu chưa liên kết)

Lần đầu tiên thiết lập dự án trên Expo, chạy lệnh sau ở thư mục `frontend`:

```sh
cd frontend
eas project:init
```

Lệnh này sẽ tự động sinh mã `projectId` và cập nhật vào `app.config.ts` hoặc tạo dự án mới trên Expo Dashboard.

---

## 4. Các lệnh Build Android

Chạy các lệnh sau từ thư mục `frontend`:

### 🚀 Build file APK cài thử nghiệm (Profile `preview`):
```sh
npm run build:android:apk
```
Hoặc:
```sh
eas build --platform android --profile preview
```

> **Kết quả**: Khi build xong trên Cloud Expo, bạn sẽ nhận được đường dẫn tải trực tiếp file **`.apk`** về điện thoại để cài đặt.

---

### 📦 Build file AAB đẩy lên Google Play Store (Profile `production`):
```sh
npm run build:android:prod
```
Hoặc:
```sh
eas build --platform android --profile production
```

---

## 5. Build Local (Build trực tiếp trên máy thay vì cloud Expo)

Nếu muốn build Android APK ngay trên máy tính local (cần cài đặt sẵn Android SDK & Java JDK):

```sh
eas build --platform android --profile preview --local
```

---

## 6. Tự động Build CI/CD khi Push Code (GitHub Actions)

Dự án đã được cấu hình file GitHub Actions tự động build tại [.github/workflows/eas-build.yml](file:///home/khovan/Workplaces/capture-data/.github/workflows/eas-build.yml).

### Các bước thiết lập trên GitHub:

1. **Lấy Expo Access Token**:
   - Đăng nhập vào [Expo Account Settings](https://expo.dev/settings/access-tokens).
   - Bấm **Create Token** (đặt tên ví dụ `github-actions-token`) và sao chép mã Token.

2. **Thêm Secret vào GitHub Repository**:
   - Truy cập kho mã nguồn trên GitHub ──> **Settings** ──> **Secrets and variables** ──> **Actions**.
   - Bấm **New repository secret**.
   - **Name**: `EXPO_TOKEN`
   - **Secret**: Dán mã Expo Access Token vừa lấy ở bước 1.

3. **Hoạt động**:
   - Mỗi khi bạn `git push` code lên nhánh `main` (có thay đổi trong thư mục `frontend/`), GitHub Actions sẽ tự động kích hoạt EAS Build và tạo file `.apk` trên Cloud Expo.

