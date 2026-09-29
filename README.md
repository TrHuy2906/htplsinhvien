# Hệ Thống Quản Lý Sinh Viên

Dự án Hệ thống Quản lý Sinh viên được xây dựng dựa trên kiến trúc Microservices cơ bản với Docker, nhằm mục đích quản lý sinh viên, giảng viên, khoa, bộ môn, chuyên ngành, niên khóa và lớp.

## 1. Mục tiêu
- Cung cấp giải pháp quản lý sinh viên toàn diện.
- Trình diễn khả năng triển khai, bảo mật và quản trị hệ thống phần mềm.
- Đảm bảo tính sẵn sàng cao, dễ dàng mở rộng và giám sát.

## 2. Công nghệ
- **Backend:** Python, Flask, Gunicorn
- **Database:** MySQL 8.0, SQLAlchemy (ORM)
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Web Server / Proxy:** Nginx
- **Monitoring & Logging:** Prometheus, Grafana, Loki, Promtail
- **Deployment:** Docker & Docker Compose

## 3. Kiến trúc Hệ thống
Hệ thống tuân theo mô hình Client-Server. Client giao tiếp với Backend thông qua Nginx Reverse Proxy. Nginx định tuyến các API và web requests tới Flask Backend chạy Gunicorn. Backend lưu trữ dữ liệu vào MySQL. Toàn bộ các service được giám sát bởi hệ thống Prometheus và Grafana, cùng với Loki/Promtail để quản lý log tập trung.

## 4. Cấu trúc thư mục
```
.
├── app/                  # Mã nguồn Backend Flask
│   ├── static/           # CSS, JS
│   ├── templates/        # HTML templates
│   ├── bomon/, khoa/, ...# Các Blueprint module (Domain-driven)
│   ├── models.py         # SQLAlchemy Models
│   ├── app.py            # Flask App entrypoint
│   └── Dockerfile        # Backend Docker image config
├── nginx/                # Cấu hình Nginx
├── prometheus/           # Cấu hình Prometheus
├── promtail/             # Cấu hình Promtail
├── scripts/              # Các script backup / restore
├── .env.example          # Mẫu biến môi trường
├── docker-compose.yml    # File triển khai toàn bộ hệ thống
└── README.md
```

## 5. Docker Architecture
Các container (tất cả nằm trong network `htpl-network`):
- `htpl_web`: Chạy ứng dụng Flask bằng Gunicorn.
- `htpl_db`: Cơ sở dữ liệu MySQL 8.0.
- `htpl_phpmyadmin`: Trình quản lý DB qua web.
- `htpl_nginx`: Reverse Proxy định tuyến traffic.
- `htpl_prometheus`: Server giám sát metrics.
- `htpl_grafana`: Dashboard theo dõi hệ thống.
- `htpl_loki` & `htpl_promtail`: Thu thập và lưu trữ log.

## 6. Cách Cài Đặt & Chạy Production

**Bước 1: Clone repo và tạo file .env**
```bash
cp .env.example .env
```
*(Sửa nội dung file .env cho phù hợp môi trường production. Bắt buộc thay đổi `SECRET_KEY` và `DB_PASSWORD`)*

**Bước 2: Triển khai với Docker Compose**
```bash
docker-compose up -d --build
```

Hệ thống sẽ tự động khởi tạo cơ sở dữ liệu và dữ liệu demo khi chạy lần đầu.

## 7. Các Port Mặc Định
| Service | Port ngoài | Ghi chú |
|---------|------------|---------|
| Web App (qua Nginx) | 8081 | Truy cập chính cho User |
| phpMyAdmin | 8082 | Quản trị viên CSDL |
| MySQL | 3308 | Kết nối CSDL từ ngoài (Dev) |
| Grafana | 3001 | Dashboard Monitor |
| Prometheus | 9091 | Prometheus Metrics |
| Loki | 3101 | Log Server API |

## 8. Tài Khoản Demo
- **Username:** admin
- **Password:** admin123
- **Role:** Quản trị viên (Admin - Role 2)

## 9. Phân Quyền (Roles)
- `0`: Sinh viên (Giới hạn quyền xem)
- `1`: Giảng viên (Có quyền quản lý nhất định)
- `2`: Quản trị viên (Toàn quyền hệ thống)

## 10. API Chính
- `/login`, `/logout`, `/change_password`: Xác thực và bảo mật.
- `/students`, `/giangvien`, `/khoa_bomon`, `/chuyennganh`, `/nienkhoa`, `/lop`: Các module RESTful.
- `/health`: API health check (kiểm tra trạng thái app và DB).
- `/metrics`: Endpoint Prometheus scrape metrics.

## 11. Security Notes (Bảo mật)
- Mật khẩu người dùng được hash 100% bằng `werkzeug.security`.
- Sử dụng Session dựa trên Flask (được ký mã hóa bằng `SECRET_KEY` lấy từ biến môi trường).
- Cookie bảo mật với cờ `HttpOnly` và `SameSite=Lax`.
- API giới hạn phân quyền chặt chẽ (`@login_required`, `@role_required`).
- API `/health` không leak lỗi stack trace.
- Chạy với Gunicorn worker environment, không dùng chế độ debug.
- Nginx chặn access trực tiếp và thêm các security headers chống XSS, sniffing.

## 12. Backup & Restore
Các script có sẵn trong thư mục `scripts/`:

**Backup:**
```bash
./scripts/backup.sh
```
File backup SQL sẽ được tạo trong thư mục `backups/` có đánh dấu thời gian.

**Restore:**
```bash
./scripts/restore.sh backups/student_db_YYYYMMDD_HHMMSS.sql
```
*Lưu ý: Phải chạy lệnh này cẩn thận vì nó ghi đè cơ sở dữ liệu hiện tại.*

## 13. Testing
Đã thực hiện kiểm tra thủ công cho các case:
- Login hợp lệ / sai thông tin.
- Role chặn đúng các tính năng khi không phải admin.
- Kiểm tra trùng lặp khóa (Mã SV, Mã Lớp, v.v.).
- Rollback thành công khi lỗi Database Foreign Key.
- Khởi động hệ thống an toàn, tự động thử kết nối DB nếu MySQL khởi động chậm.

## 14. Troubleshooting
- **Lỗi kết nối CSDL khi khởi động:** Backend đã được cài đặt chế độ tự động retry 20 lần nếu DB chưa sẵn sàng.
- **Không cập nhật giao diện/tính năng:** Hãy chạy lệnh build lại: `docker-compose up -d --build --force-recreate`.
- **Xem logs hệ thống:** Truy cập Grafana -> Explore -> Chọn data source Loki hoặc dùng lệnh `docker logs htpl_web`.

---
*Lưu ý: Các module "Thực tập", "Đồ án", "Hội đồng" chưa được triển khai mã nguồn do không có đủ căn cứ thiết kế từ tài liệu mô tả chính thức, nhằm đảm bảo tuân thủ nguyên tắc không tự đoán cấu trúc nghiệp vụ.*
