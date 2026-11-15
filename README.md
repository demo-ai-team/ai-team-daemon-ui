# AI Local Daemon Desktop UI

Ứng dụng Desktop UI dành cho AI Local Daemon, được xây dựng bằng **Electron**.

## Tính năng
- Cửa sổ native desktop cho AI Local Daemon, tự tìm daemon đang chạy qua loopback API.
- Bốn màn hình trên thanh bên: **Tổng quan** (slot, token, kết quả, task đang chạy, hoạt động), **Giao việc**, **Lượt chạy** (danh sách và nhật ký sự kiện), **Cài đặt** (chia nhóm, chỉ gửi những trường đã đổi).
- Giao diện sáng, tối hoặc theo hệ thống.
- Thông báo native khi có lỗi lúc cửa sổ đang ẩn.
- Phím tắt: `Ctrl+1`…`Ctrl+4` chuyển màn hình, `Ctrl+N` giao việc, `Ctrl+P` tạm dừng hoặc tiếp tục, `F5` làm mới. Thanh menu ẩn, nhấn `Alt` để hiện.

## Một trang, hai nơi chạy
`src/renderer/index.html` cũng là trang mà daemon tự phục vụ (`ai-team-daemon view --web`, bản sao ở `ai-team-daemon/src/ui/index.html`). Daemon gửi trang kèm content security policy chỉ cho phép `<style>` và `<script>` có nonce, nên trang:
- giữ nguyên các chỗ thế `__TOKEN__`, `__NONCE__`, `__VERSION__`;
- không dùng thuộc tính `style="…"` (kể cả trong chuỗi gán cho `innerHTML`) và không tải tài nguyên ngoài.

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

