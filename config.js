// Cấu hình kết nối Supabase. Điền sau khi tạo dự án (Project Settings > API).
// Project URL và khoá "anon public" được thiết kế để công khai (dữ liệu được bảo vệ bằng Row Level Security).
// TUYỆT ĐỐI KHÔNG dán khoá "service_role" vào đây.
const SUPABASE = {
  url: "https://ttcjmowdizqkvtgfwgfh.supabase.co",
  anonKey: "sb_publishable_kG6c2wNbO_7iXqf8k3k5Xw_DbXUXVrT", // khoá publishable: được phép công khai
};
