# Hướng dẫn bật portal quản trị (Supabase)

Giao diện Supabase thỉnh thoảng đổi tên menu; nếu không thấy đúng chữ, tìm mục có ý nghĩa tương tự.

1. **Tạo tài khoản**: vào supabase.com → Sign in → đăng nhập bằng GitHub (hoặc email).
2. **Tạo dự án**: New project → tên `handmadebyhnhi` → đặt **Database password** mạnh (lưu vào trình quản lý mật khẩu, **không gửi cho ai**) → Region **Southeast Asia (Singapore)** → Create. Chờ ~2 phút.
3. **Tạo bảng**: menu **SQL Editor** → New query → dán toàn bộ [schema.sql](schema.sql) → **Run**. Kết quả phải là “Success”.
4. **Tạo tài khoản đăng nhập admin**: **Authentication → Users → Add user → Create new user** → nhập email + mật khẩu của bạn → bật “Auto Confirm User” → Create.
5. **Khóa đăng ký mới** (quan trọng): **Authentication → Sign In / Providers** (hoặc Settings) → tắt **Allow new users to sign up**. Như vậy chỉ tài khoản bạn tạo ở bước 4 đăng nhập được.
6. **Cấp quyền admin**: mở [make-admin.sql](make-admin.sql), đổi email thành email ở bước 4, dán vào SQL Editor → Run. Kết quả phải hiện đúng 1 dòng.
7. **Lấy 2 giá trị kết nối**: **Project Settings → API** (hoặc nút Connect): copy **Project URL** và khóa **anon / publishable**.
   - Hai giá trị này được thiết kế để công khai, gửi cho Claude được.
   - **Không** gửi `service_role` / `secret` key và **không** gửi Database password.
8. Điền hai giá trị vào [../config.js](../config.js) (hoặc gửi cho Claude điền), đẩy lên web, rồi mở `.../handmadebyhnhi/admin.html`, đăng nhập và bấm **Nhập sản phẩm mẫu**.
