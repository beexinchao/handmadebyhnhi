-- Chạy SAU khi đã tạo tài khoản đăng nhập (Authentication > Users > Add user).
-- Đổi email bên dưới thành email bạn dùng để đăng nhập admin.
insert into public.admins (user_id)
select id from auth.users where email = 'DOI-THANH-EMAIL-CUA-BAN@gmail.com'
on conflict do nothing;

-- Kiểm tra: phải ra đúng 1 dòng
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
