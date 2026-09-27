# Sử dụng base image nhẹ của Python
FROM python:3.9-slim

# BẢO MẬT (Hardening): Tạo user không phải root
RUN useradd -m appuser
USER appuser

# Chuyển thư mục làm việc sang thư mục của user vừa tạo
WORKDIR /home/appuser/app

# Copy file requirements và cài đặt thư viện
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy toàn bộ mã nguồn (gồm app.py, templates, static)
COPY --chown=appuser:appuser . .

# Đưa biến môi trường PATH để chạy được flask/gunicorn
ENV PATH="/home/appuser/.local/bin:${PATH}"

EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["python", "app.py"]
