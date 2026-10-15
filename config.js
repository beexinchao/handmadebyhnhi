// Cấu hình kết nối Supabase. Điền sau khi tạo dự án (Project Settings > API).
// Project URL và khoá "anon public" được thiết kế để công khai (dữ liệu được bảo vệ bằng Row Level Security).
// TUYỆT ĐỐI KHÔNG dán khoá "service_role" vào đây.
const SUPABASE = {
  url: "",      // ví dụ: https://abcdxyzcompany.supabase.co
  anonKey: "",  // chuỗi dài bắt đầu bằng eyJ... hoặc sb_publishable_...
};
