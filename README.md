# Hệ thống Quản lý Sinh viên - Triển khai và Quản trị Hệ thống Phần mềm

Dự án này là Đề tài số 2 (Hệ thống Quản lý Sinh viên) thuộc môn học Triển khai và Quản trị Hệ thống Phần mềm. Dự án bao gồm ứng dụng Web viết bằng Python (Flask), cơ sở dữ liệu MySQL, và các hệ thống giám sát, log tập trung hoàn chỉnh được triển khai 100% qua Docker Compose.

## 📋 Kiến trúc Hệ thống
Hệ thống sử dụng các thành phần sau:
- **Ứng dụng Web:** Python (Flask) + SQLAlchemy (tự động xuất metrics).
- **Cơ sở dữ liệu:** MySQL 8.0 & phpMyAdmin.
- **Reverse Proxy:** Nginx (Có cấu hình Security Headers bảo mật cơ bản).
- **Giám sát (Monitoring):** Prometheus (Scrape metrics) & Grafana (Dashboard).
- **Quản lý Log tập trung:** Loki & Promtail (Truy vấn bằng LogQL).

## 🚀 Các tiêu chí đã đáp ứng
1. **Quản lý mã nguồn:** File thiết lập Docker Compose, cấu hình Nginx, Prometheus đầy đủ.
2. **Triển khai ứng dụng:** Chạy ổn định qua Docker, Web kết nối DB MySQL thành công.
3. **Nginx Reverse Proxy:** Ứng dụng web được phân giải qua cổng 80 của Nginx Proxy.
4. **Hệ thống giám sát:** Đã tích hợp thư viện xuất metrics của Flask sang Prometheus, có Grafana.
5. **Hệ thống log (Loki + Promtail):** Promtail mount trực tiếp vào Docker socket để bắt log toàn bộ container gửi về Loki.
6. **Hardening (Bảo mật):**
   - Ứng dụng Flask chạy trên Docker sử dụng tài khoản `non-root user`.
   - Các dịch vụ kết nối với nhau qua `network isolation` (Mạng `app-network` riêng, không expose trực tiếp port DB ra public nếu không cần thiết).
   - Nginx có các thiết lập Security Headers (`X-Frame-Options`, `X-XSS-Protection`).

---

## 🛠 Hướng dẫn Cài đặt & Chạy hệ thống

### 1. Yêu cầu hệ thống
- Máy tính đã cài đặt [Docker](https://www.docker.com/products/docker-desktop) và [Docker Compose](https://docs.docker.com/compose/install/).

### 2. Khởi chạy
Mở Terminal/PowerShell tại thư mục chứa file `docker-compose.yml` và chạy lệnh sau:
```bash
docker-compose up -d --build
```
*Lệnh này sẽ tự động tải các images cần thiết, build mã nguồn ứng dụng Web và khởi động toàn bộ 8 services.*

### 3. Hướng dẫn truy cập và Demo
Sau khi tất cả container chuyển sang trạng thái "Running", bạn có thể truy cập các thành phần của hệ thống qua trình duyệt:

| Thành phần | Đường dẫn | Tài khoản mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| **Ứng dụng Web (Giao diện UI)** | `http://localhost/` | Không có | Trang Dashboard quản lý sinh viên trực quan |
| **API Sinh viên (JSON)** | `http://localhost/students` | Không có | API lấy/thêm/sửa/xoá thông tin sinh viên |
| **Kiểm tra sức khỏe (Health)** | `http://localhost/health` | Không có | Test đường dẫn API trạng thái hệ thống |
| **phpMyAdmin** | `http://localhost:8080` | `root` / `rootpassword` | Quản trị CSDL MySQL |
| **Grafana** | `http://localhost:3000` | `admin` / `admin` | Xem Dashboard giám sát hệ thống |
| **Prometheus** | `http://localhost:9090` | Không có | Kiểm tra Metrics và Targets |
| **MySQL (Host)** | `localhost:3307` | `root` / `rootpassword` | Kết nối CSDL từ host (nếu dùng Workbench) |

### 4. Hướng dẫn xem Log bằng LogQL (Loki)
1. Đăng nhập vào **Grafana** (`http://localhost:3000`).
2. Vào **Connections > Data Sources** -> Add data source -> Chọn **Loki**.
3. Tại ô URL điền: `http://loki:3100` và nhấn **Save & Test**.
4. Vào thẻ **Explore** (Thanh menu bên trái).
5. Chạy các truy vấn LogQL mẫu sau để lọc log:
   - *Xem log của ứng dụng web:* `{container="student_web"}`
   - *Xem log của proxy nginx:* `{container="student_nginx"}`
   - *Tìm lỗi (error):* `{container="student_web"} |= "error"`

---

## 🛑 Dừng hệ thống
Để tắt toàn bộ hệ thống và xoá các container:
```bash
docker-compose down
```
*(Thêm cờ `-v` nếu bạn muốn xoá luôn dữ liệu Database).*
