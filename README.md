# AI Local Daemon Desktop UI

Ứng dụng Desktop UI dành cho AI Local Daemon, được xây dựng bằng **Electron**.

## Tính năng
- Cửa sổ native desktop cho AI Local Daemon.
- Tự động phát hiện và kết nối tới daemon đang chạy qua loopback API.
- Hỗ trợ Dark Mode / Light Mode theo hệ thống.
- Hỗ trợ thông báo native khi task hoàn thành hoặc gặp lỗi.
- Tích hợp phím tắt tiêu chuẩn (Reload, DevTools, Zoom).

## Cài đặt & Khởi chạy

```bash
# Cài đặt dependencies (Electron)
npm install

# Khởi chạy ứng dụng
npm start

# Hoặc khởi chạy trỏ đến URL cụ thể của daemon
npx electron . --url http://127.0.0.1:7471/
```

## Tích hợp với CLI của daemon

Khi người dùng thực thi lệnh:
```bash
ai-team-daemon view --ui
# hoặc
ai-team-daemon ui
```
Daemon CLI sẽ tự động tìm kiếm và khởi chạy ứng dụng Electron này.
