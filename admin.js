// Portal quản trị handmadebyhnhi – một trang, đăng nhập bằng Supabase Auth. Dữ liệu được bảo vệ bằng RLS (xem supabase/schema.sql).
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => Math.round(n || 0).toLocaleString("vi-VN") + "₫";
const fmtDate = d => d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
const ST = { pending_payment: "Chờ thanh toán", paid: "Đã thanh toán", making: "Đang làm", shipped: "Đã gửi", done: "Hoàn tất", expired: "Hết hạn", cancelled: "Đã hủy" };
const PST = { active: "Đang bán", sold_out: "Tạm hết slot", hidden: "Ẩn" };
const chip = (k, map) => `<span class="chip s-${k}">${esc(map[k] || k)}</span>`;
let sb, me;

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800); }
const must = r => { if (r.error) throw r.error; return r.data; };
const slugify = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------- Khởi động & đăng nhập ----------
async function boot() {
  if (typeof SUPABASE === "undefined" || !SUPABASE.url || !SUPABASE.anonKey) {
    $("#app").innerHTML = `<div class="login card"><h1>Chưa kết nối Supabase</h1><p class="muted">Mở file <b>config.js</b> và điền <b>url</b> + <b>anonKey</b> của dự án Supabase, rồi tải lại trang.</p></div>`; return;
  }
  sb = supabase.createClient(SUPABASE.url, SUPABASE.anonKey);
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return loginView();
  me = session.user;
  const adm = await sb.from("admins").select("user_id").eq("user_id", me.id).maybeSingle();
  if (!adm.data) return noAccessView();
  addEventListener("hashchange", route); route();
}
function loginView(msg = "") {
  $("#app").innerHTML = `<form class="login card stack" id="lf"><h1>🧶 Quản trị</h1><p class="muted">Đăng nhập để quản lý shop.</p>
  <label>Email<input name="email" type="email" autocomplete="username" required></label>
  <label>Mật khẩu<input name="pw" type="password" autocomplete="current-password" required></label>
  <p class="err" id="le">${esc(msg)}</p><button class="btn pri" type="submit">Đăng nhập</button></form>`;
  $("#lf").onsubmit = async e => {
    e.preventDefault(); const f = e.target; $("#le").textContent = "";
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.pw.value });
    if (error) { $("#le").textContent = "Email hoặc mật khẩu chưa đúng."; return; }
    location.hash = "#/"; boot();
  };
}
function noAccessView() {
  $("#app").innerHTML = `<div class="login card stack"><h1>Chưa có quyền admin</h1><p class="muted">Tài khoản <b>${esc(me.email)}</b> đăng nhập được nhưng chưa được cấp quyền quản trị. Hãy chạy file <b>supabase/make-admin.sql</b> với email này.</p><button class="btn soft" id="so">Đăng xuất</button></div>`;
  $("#so").onclick = async () => { await sb.auth.signOut(); location.reload(); };
}

// ---------- Khung & router ----------
const NAV = [["", "📊", "Tổng quan"], ["orders", "🧾", "Đơn hàng"], ["products", "🛍️", "Sản phẩm"], ["payments", "💳", "Thanh toán"], ["settings", "⚙️", "Cài đặt"]];
function shell(inner, active) {
  $("#app").innerHTML = `<div class="shell"><aside class="side"><div class="brand">🧶 handmadebyhnhi</div>${NAV.map(([h, i, l]) => `<a class="nav-i ${h === active ? "on" : ""}" href="#/${h}">${i} ${l}</a>`).join("")}<div class="spacer"></div><a class="nav-i" href="./" target="_blank">↗ Xem website</a><button class="nav-i btn soft" id="out">Đăng xuất</button><small class="muted" style="padding:6px 10px">${esc(me.email)}</small></aside>
  <main class="main">${inner}</main></div><nav class="bottom">${NAV.map(([h, i, l]) => `<a class="${h === active ? "on" : ""}" href="#/${h}"><b>${i}</b>${l}</a>`).join("")}</nav>`;
  $("#out").onclick = async () => { await sb.auth.signOut(); location.reload(); };
}
async function route() {
  const [a = "", b] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  try {
    if (a === "orders") return b ? await orderDetail(b) : await ordersList();
    if (a === "products") return b ? await productEdit(b) : await productsList();
    if (a === "payments") return await paymentsView();
    if (a === "settings") return await settingsView();
    return await dashboard();
  } catch (e) { shell(`<div class="card"><h2>Có lỗi</h2><p class="err">${esc(e.message || e)}</p></div>`, a); }
}

// ---------- Tổng quan ----------
async function dashboard() {
  shell(`<h1>Tổng quan</h1><p class="muted">Đang tải…</p>`, "");
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [orders, quiz] = await Promise.all([sb.from("orders").select("code,status,total,customer,item,created_at").order("created_at", { ascending: false }).limit(500), sb.from("quiz_sessions").select("id", { count: "exact", head: true }).gte("created_at", since)]);
  const o = must(orders), cnt = s => o.filter(x => x.status === s).length;
  const rev = o.filter(x => ["paid", "making", "shipped", "done"].includes(x.status) && x.created_at >= since).reduce((s, x) => s + x.total, 0);
  const todo = o.filter(x => ["pending_payment", "paid", "making"].includes(x.status)).slice(0, 12);
  shell(`<div class="top"><h1>Tổng quan</h1></div>
  <div class="stats"><a class="stat" href="#/orders"><b>${cnt("pending_payment")}</b><span>Đơn chờ thanh toán</span></a><a class="stat" href="#/orders"><b>${cnt("paid") + cnt("making")}</b><span>Đơn cần làm</span></a><div class="stat"><b>${money(rev)}</b><span>Doanh thu 30 ngày</span></div><div class="stat"><b>${quiz.count ?? 0}</b><span>Lượt làm quiz 30 ngày</span></div></div>
  <div class="card"><h2>Cần xử lý</h2>${todo.length ? `<table class="resp"><thead><tr><th>Mã</th><th>Khách</th><th>Món</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>${todo.map(orderRow).join("")}</tbody></table>` : `<p class="muted">Không có đơn nào cần xử lý 🎉</p>`}</div>`, "");
  bindRows();
}
const orderRow = x => `<tr class="click" data-go="#/orders/${x.code}"><td><b>${esc(x.code)}</b><br><small class="muted">${fmtDate(x.created_at)}</small></td><td>${esc(x.customer.name)}<br><small class="muted">${esc(x.customer.phone)}</small></td><td>${esc(x.item.name_vi)}</td><td>${money(x.total)}</td><td>${chip(x.status, ST)}</td></tr>`;
const bindRows = () => document.querySelectorAll("[data-go]").forEach(r => r.onclick = () => location.hash = r.dataset.go);

// ---------- Đơn hàng ----------
let oFilter = "all", oQ = "";
async function ordersList() {
  const rows = must(await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(300));
  const q = oQ.trim().toLowerCase();
  const list = rows.filter(x => (oFilter === "all" || x.status === oFilter) && (!q || [x.code, x.customer.name, x.customer.phone].join(" ").toLowerCase().includes(q)));
  shell(`<div class="top"><h1>Đơn hàng</h1><input id="oq" placeholder="Tìm mã đơn, tên, số điện thoại" value="${esc(oQ)}" style="max-width:300px"></div>
  <div class="tabs">${[["all", "Tất cả"], ...Object.entries(ST)].map(([k, l]) => `<button class="tab ${oFilter === k ? "on" : ""}" data-f="${k}">${l}${k !== "all" ? " (" + rows.filter(x => x.status === k).length + ")" : ""}</button>`).join("")}</div>
  <div class="card">${list.length ? `<table class="resp"><thead><tr><th>Mã</th><th>Khách</th><th>Món</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>${list.map(orderRow).join("")}</tbody></table>` : `<p class="muted">Chưa có đơn nào.</p>`}</div>`, "orders");
  bindRows(); document.querySelectorAll(".tab").forEach(t => t.onclick = () => { oFilter = t.dataset.f; ordersList(); });
  const qi = $("#oq"); qi.oninput = () => { oQ = qi.value; clearTimeout(qi.t); qi.t = setTimeout(() => { ordersList().then(() => { const n = $("#oq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); }, 300); };
}
async function orderDetail(code) {
  const o = must(await sb.from("orders").select("*").eq("code", code).maybeSingle());
  if (!o) return shell(`<div class="card"><p>Không tìm thấy đơn ${esc(code)}.</p></div>`, "orders");
  const pays = must(await sb.from("payments").select("*").eq("order_id", o.id).order("created_at"));
  const it = o.item, c = o.customer;
  shell(`<div class="top"><div><a class="muted" href="#/orders">← Đơn hàng</a><h1>${esc(o.code)} ${chip(o.status, ST)}</h1></div></div>
  <div class="grid2"><div class="stack">
    <div class="card"><h2>Món hàng</h2><dl class="kv"><dt>Sản phẩm</dt><dd><b>${esc(it.name_vi)}</b></dd><dt>Màu len</dt><dd>${esc(it.color)}</dd><dt>Kích thước</dt><dd>${esc(it.size_vi || it.size)}</dd>${it.text ? `<dt>Thêu tên</dt><dd style="background:#fff8e1;padding:2px 8px;border-radius:6px"><b>${esc(it.text)}</b></dd>` : ""}${it.note ? `<dt>Ghi chú</dt><dd style="background:#fff8e1;padding:2px 8px;border-radius:6px">${esc(it.note)}</dd>` : ""}<dt>Tiền hàng</dt><dd>${money(o.subtotal)}</dd><dt>Ship</dt><dd>${money(o.shipping)}</dd><dt>Tổng</dt><dd><b>${money(o.total)}</b></dd></dl></div>
    <div class="card"><h2>Thanh toán</h2>${pays.length ? pays.map(p => `<p>✅ ${money(p.amount)} · ${esc(p.provider)} · ${fmtDate(p.created_at)}</p>`).join("") : `<p class="muted">Chưa ghi nhận khoản thanh toán.</p>`}<p class="muted sm">Nội dung chuyển khoản mong đợi: <b class="mono">${esc(o.code.replace("-", ""))} ${esc(c.phone.replace(/\s/g, ""))}</b></p>${o.status === "pending_payment" ? `<button class="btn pri" id="markPaid">✅ Đánh dấu đã nhận ${money(o.total)}</button>` : ""}</div>
  </div><div class="stack">
    <div class="card"><h2>Khách hàng</h2><dl class="kv"><dt>Họ tên</dt><dd>${esc(c.name)}</dd><dt>Điện thoại</dt><dd><a href="tel:${esc(c.phone)}"><b>${esc(c.phone)}</b></a></dd>${c.email ? `<dt>Email</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>` : ""}<dt>Địa chỉ</dt><dd>${esc(c.address)} <button class="btn soft sm" id="cpAddr">Sao chép</button></dd><dt>Đặt lúc</dt><dd>${fmtDate(o.created_at)}</dd>${o.quiz_ref ? `<dt>Mã quiz</dt><dd>${esc(o.quiz_ref)}</dd>` : ""}</dl></div>
    <div class="card stack"><h2>Xử lý</h2><label>Trạng thái<select id="st">${Object.entries(ST).map(([k, l]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>Mã vận đơn<input id="trk" value="${esc(o.tracking_no || "")}" placeholder="Nhập khi chuyển sang Đã gửi"></label>
      <label>Ghi chú nội bộ<textarea id="an">${esc(o.admin_note || "")}</textarea></label><button class="btn" id="save">Lưu</button><p class="err" id="e"></p></div>
  </div></div>`, "orders");
  $("#cpAddr").onclick = async () => { await navigator.clipboard.writeText(c.address); toast("Đã sao chép địa chỉ"); };
  const mp = $("#markPaid"); if (mp) mp.onclick = async () => {
    mp.disabled = true;
    try {
      must(await sb.from("payments").insert({ order_id: o.id, provider: "manual", provider_ref: "manual-" + o.code, amount: o.total }));
      must(await sb.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", o.id));
      toast("Đã ghi nhận thanh toán"); orderDetail(code);
    } catch (e) { mp.disabled = false; $("#e").textContent = e.message; }
  };
  $("#save").onclick = async () => {
    const st = $("#st").value, trk = $("#trk").value.trim();
    if (st === "shipped" && !trk) { $("#e").textContent = "Cần nhập mã vận đơn khi chuyển sang Đã gửi."; return; }
    try { must(await sb.from("orders").update({ status: st, tracking_no: trk || null, admin_note: $("#an").value || null, ...(st === "paid" && !o.paid_at ? { paid_at: new Date().toISOString() } : {}) }).eq("id", o.id)); toast("Đã lưu"); orderDetail(code); }
    catch (e) { $("#e").textContent = e.message; }
  };
}

// ---------- Thanh toán ----------
async function paymentsView() {
  const [pays, pend] = await Promise.all([sb.from("payments").select("*, orders(code,customer)").order("created_at", { ascending: false }).limit(200), sb.from("orders").select("code,total,customer,created_at").eq("status", "pending_payment").order("created_at")]);
  const p = must(pays), o = must(pend);
  shell(`<div class="top"><h1>Thanh toán</h1></div>
  <div class="card"><h2>Đơn đang chờ tiền (${o.length})</h2>${o.length ? `<table class="resp"><thead><tr><th>Mã</th><th>Khách</th><th>Cần nhận</th><th>Nội dung chuyển khoản</th></tr></thead><tbody>${o.map(x => `<tr class="click" data-go="#/orders/${x.code}"><td><b>${esc(x.code)}</b></td><td>${esc(x.customer.name)}</td><td>${money(x.total)}</td><td class="mono">${esc(x.code.replace("-", ""))} ${esc(x.customer.phone.replace(/\s/g, ""))}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Không có đơn nào đang chờ.</p>`}<p class="muted sm">Đối chiếu với biến động số dư rồi mở đơn bấm “Đánh dấu đã nhận”.</p></div>
  <div class="card"><h2>Lịch sử đã nhận</h2>${p.length ? `<table class="resp"><thead><tr><th>Thời gian</th><th>Đơn</th><th>Số tiền</th><th>Nguồn</th></tr></thead><tbody>${p.map(x => `<tr><td>${fmtDate(x.created_at)}</td><td>${x.orders ? `<a href="#/orders/${esc(x.orders.code)}"><b>${esc(x.orders.code)}</b></a>` : "—"}</td><td>${money(x.amount)}</td><td>${esc(x.provider)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Chưa có.</p>`}</div>`, "payments");
  bindRows();
}

// ---------- Sản phẩm ----------
async function productsList() {
  const rows = must(await sb.from("products").select("slug,status,featured,sort,data").order("sort"));
  const nm = r => r.data.vi?.[0] || r.slug;
  shell(`<div class="top"><h1>Sản phẩm (${rows.length})</h1><div class="row"><a class="btn pri" href="#/products/new">+ Thêm sản phẩm</a>${rows.length ? "" : `<button class="btn soft" id="seed">Nhập ${PRODUCTS.length} sản phẩm mẫu từ website</button>`}</div></div>
  <div class="card">${rows.length ? `<table class="resp"><thead><tr><th></th><th>Tên</th><th>Giá</th><th>Ngày làm</th><th>Trạng thái</th></tr></thead><tbody>${rows.map(r => `<tr class="click" data-go="#/products/${r.slug}"><td>${r.data.images?.[0] ? `<img class="thumb-s" src="${esc(r.data.images[0])}" alt="">` : `<div class="thumb-s" style="background:${esc(r.data.bg || "#f4f2ff")}">${esc(r.data.emoji || "🧶")}</div>`}</td><td><b>${esc(nm(r))}</b>${r.featured ? " ⭐" : ""}<br><small class="muted">${esc(r.slug)}</small></td><td>${money(r.data.price)}</td><td>${r.data.days} ngày</td><td>${chip(r.status, PST)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Chưa có sản phẩm trong kho dữ liệu. Bấm “Nhập sản phẩm mẫu” để đưa các sản phẩm hiện có của website vào, sau đó bạn sửa tự do.</p>`}</div>`, "products");
  bindRows();
  const sd = $("#seed"); if (sd) sd.onclick = async () => {
    sd.disabled = true;
    try { must(await sb.from("products").insert(PRODUCTS.map((p, i) => { const { slug, featured, ...data } = p; return { slug, featured: !!featured, sort: (i + 1) * 10, status: "active", data }; }))); toast("Đã nhập sản phẩm mẫu"); productsList(); }
    catch (e) { sd.disabled = false; toast("Lỗi: " + e.message); }
  };
}
const GROUPS = [["recipient", "Người nhận"], ["occasion", "Dịp tặng"], ["style", "Phong cách"], ["palette", "Tông màu"], ["personalization", "Cá nhân hoá"]];
async function productEdit(slug) {
  const isNew = slug === "new";
  const row = isNew ? { slug: "", status: "active", featured: false, sort: 100, data: { vi: ["", "", ""], en: ["", "", ""], tag: ["", ""], emoji: "🧶", bg: "#fde8ee", price: 0, days: 3, images: [], specs: [["Kích thước", "", ""], ["Chất liệu sợi", "", ""], ["Bảo quản", "Giặt tay nước mát", "Phơi ngang trong bóng râm"]], tags: {}, sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: null } } : must(await sb.from("products").select("*").eq("slug", slug).maybeSingle());
  if (!row) return shell(`<div class="card"><p>Không tìm thấy sản phẩm.</p></div>`, "products");
  const d = JSON.parse(JSON.stringify(row.data)); let images = d.images || [];
  const tags = d.tags || {};
  shell(`<div class="top"><div><a class="muted" href="#/products">← Sản phẩm</a><h1>${isNew ? "Thêm sản phẩm" : esc(d.vi[0])}</h1></div></div>
  <div class="card stack"><h2>Thông tin</h2>
    <div class="grid2"><label>Tên (tiếng Việt)<input id="nvi" value="${esc(d.vi[0])}"></label><label>Tên (English) <small class="muted">${d.en[0] ? "" : "⚠ thiếu bản dịch"}</small><input id="nen" value="${esc(d.en[0])}"></label></div>
    <div class="grid2"><label>Mô tả (VI)<textarea id="dvi">${esc(d.vi[1])}</textarea></label><label>Mô tả (EN)<textarea id="den">${esc(d.en[1])}</textarea></label></div>
    <div class="grid2"><label>Dòng ngắn (VI)<input id="lvi" value="${esc(d.vi[2])}"></label><label>Dòng ngắn (EN)<input id="len" value="${esc(d.en[2])}"></label></div>
    <div class="grid3"><label>Giá (VND)<input id="price" type="number" min="0" step="1000" value="${d.price || 0}"></label><label>Giá gốc (để gạch, tuỳ chọn)<input id="old" type="number" min="0" step="1000" value="${d.oldPrice || ""}"></label><label>Số ngày làm<input id="days" type="number" min="1" value="${d.days || 3}"></label></div>
    <div class="grid3"><label>Trạng thái<select id="status">${Object.entries(PST).map(([k, l]) => `<option value="${k}" ${row.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></label><label>Thứ tự hiển thị (nhỏ lên trước)<input id="sort" type="number" value="${row.sort}"></label><label class="chk" style="margin-top:22px"><input id="feat" type="checkbox" ${row.featured ? "checked" : ""}> Ghim nổi bật</label></div>
    <div class="grid3"><label>Nhãn (VI)<input id="tvi" value="${esc(d.tag?.[0] || "")}"></label><label>Nhãn (EN)<input id="ten" value="${esc(d.tag?.[1] || "")}"></label><label>Phụ phí thêu tên (để trống = không thêu; 0 = miễn phí)<input id="nfee" type="number" min="0" step="1000" value="${d.nameFee ?? ""}"></label></div>
    <div class="grid3"><label>Emoji (khi chưa có ảnh)<input id="emo" value="${esc(d.emoji || "")}"></label><label>Màu nền<input id="bg" type="color" value="${esc(d.bg || "#fde8ee")}"></label><label>Mã đường dẫn (slug)<input id="slug" value="${esc(row.slug)}" ${isNew ? "" : "readonly"} placeholder="tự tạo từ tên nếu để trống"></label></div></div>
  <div class="card"><h2>Ảnh</h2><div class="imgs" id="imgs"></div><div class="drop" id="drop">📷 Bấm để chọn ảnh (chụp hoặc từ thư viện) — tự nén, tối đa 8 ảnh<input type="file" id="file" accept="image/*" multiple hidden></div><p class="muted sm">Ảnh đầu tiên là ảnh đại diện. Dùng nút ◀ ▶ đổi thứ tự.</p></div>
  <div class="card stack"><h2>Kích thước &amp; thông số</h2><label>Kích thước (mỗi dòng: mã | tên VI | tên EN | phụ phí)<textarea id="sizes" rows="3">${esc((d.sizes || []).map(s => s.join(" | ")).join("\n"))}</textarea></label>
    <label>Thông số (mỗi dòng: tiêu đề | giá trị | ghi chú) — 3 dòng<textarea id="specs" rows="3">${esc((d.specs || []).map(s => s.join(" | ")).join("\n"))}</textarea></label></div>
  <div class="card"><h2>Thẻ cho quiz gợi ý</h2>${GROUPS.map(([g, l]) => `<p class="sm"><b>${l}</b></p><div class="tags-grid" data-g="${g}">${Object.keys(TAGS[g]).map(k => `<span class="tg ${(tags[g] || []).includes(k) ? "on" : ""}" data-k="${k}">${TAGS[g][k][0]}</span>`).join("")}</div>`).join("")}</div>
  <div class="savebar">${isNew ? "" : `<button class="btn red" id="del">Xóa</button>`}<button class="btn pri" id="save">Lưu sản phẩm</button></div><p class="err" id="e"></p>`, "products");

  const drawImgs = () => { $("#imgs").innerHTML = images.map((u, i) => `<div class="im"><img src="${esc(u)}" alt="">${i === 0 ? `<span class="cov">Đại diện</span>` : ""}<div class="tools"><button data-m="${i}:-1">◀</button><button data-r="${i}">🗑</button><button data-m="${i}:1">▶</button></div></div>`).join("") || `<p class="muted sm">Chưa có ảnh — web sẽ hiện khung “ảnh sắp cập nhật”.</p>`;
    document.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const [i, dd] = b.dataset.m.split(":").map(Number), j = i + dd; if (j < 0 || j >= images.length) return; [images[i], images[j]] = [images[j], images[i]]; drawImgs(); });
    document.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { images.splice(+b.dataset.r, 1); drawImgs(); }); };
  drawImgs();
  document.querySelectorAll(".tg").forEach(t => t.onclick = () => t.classList.toggle("on"));
  $("#drop").onclick = () => $("#file").click();
  $("#file").onchange = async e => {
    const files = [...e.target.files]; if (!files.length) return;
    const base = (isNew ? ($("#slug").value || slugify($("#nvi").value) || "moi") : row.slug);
    for (const f of files) {
      if (images.length >= 8) { toast("Tối đa 8 ảnh"); break; }
      try {
        toast("Đang tải ảnh…"); const blob = await shrink(f, 1200);
        const path = `${base}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
        must(await sb.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg", upsert: false }));
        images.push(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl); drawImgs();
      } catch (err) { toast("Không tải được ảnh: " + (err.message || "định dạng không hỗ trợ")); }
    }
    e.target.value = "";
  };
  $("#save").onclick = async () => {
    const e = $("#e"); e.textContent = "";
    const vi = [$("#nvi").value.trim(), $("#dvi").value.trim(), $("#lvi").value.trim()], en = [$("#nen").value.trim(), $("#den").value.trim(), $("#len").value.trim()];
    if (!vi[0]) { e.textContent = "Cần nhập tên tiếng Việt."; return; }
    const price = +$("#price").value; if (!(price > 0)) { e.textContent = "Giá phải lớn hơn 0."; return; }
    const sl = row.slug || $("#slug").value.trim() || slugify(vi[0]);
    const sizes = $("#sizes").value.split("\n").map(l => l.split("|").map(s => s.trim())).filter(a => a[0]).map(a => [a[0], a[1] || a[0], a[2] || a[1] || a[0], +a[3] || 0]);
    if (!sizes.length) { e.textContent = "Cần ít nhất một kích thước."; return; }
    const specs = $("#specs").value.split("\n").map(l => l.split("|").map(s => s.trim())).filter(a => a[0]).map(a => [a[0], a[1] || "", a[2] || ""]);
    const tg = {}; document.querySelectorAll(".tags-grid").forEach(g => { tg[g.dataset.g] = [...g.querySelectorAll(".tg.on")].map(x => x.dataset.k); });
    const nf = $("#nfee").value.trim();
    const data = { ...d, vi, en: en.map((v, i) => v || (i === 0 ? vi[0] : v)), tag: [$("#tvi").value.trim(), $("#ten").value.trim() || $("#tvi").value.trim()], price, days: +$("#days").value || 3, emoji: $("#emo").value || "🧶", bg: $("#bg").value, images, sizes, specs, tags: tg, nameFee: nf === "" ? null : +nf };
    if ($("#old").value) data.oldPrice = +$("#old").value; else delete data.oldPrice;
    if (!images.length) delete data.images;
    const rec = { slug: sl, status: $("#status").value, featured: $("#feat").checked, sort: +$("#sort").value || 100, data, updated_at: new Date().toISOString() };
    try { must(isNew ? await sb.from("products").insert(rec) : await sb.from("products").update(rec).eq("slug", row.slug)); toast("Đã lưu"); location.hash = "#/products"; }
    catch (err) { e.textContent = err.message.includes("duplicate") ? "Mã đường dẫn (slug) này đã tồn tại." : err.message; }
  };
  const del = $("#del"); if (del) del.onclick = async () => { if (!confirm("Xóa sản phẩm này? Không hoàn tác được. (Muốn tạm ẩn thì đổi trạng thái sang Ẩn.)")) return; try { must(await sb.from("products").delete().eq("slug", row.slug)); toast("Đã xóa"); location.hash = "#/products"; } catch (err) { $("#e").textContent = err.message; } };
}
function shrink(file, max) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error("không nén được")), "image/jpeg", 0.82); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("trình duyệt không đọc được ảnh này (HEIC?). Hãy chọn JPG/PNG.")); };
    im.src = url;
  });
}

// ---------- Cài đặt ----------
async function settingsView() {
  const rows = must(await sb.from("settings").select("*")), g = k => rows.find(r => r.key === k)?.value;
  const shop = g("shop") || {}, zones = g("ship_zones") || [], banks = g("banks") || [];
  const ZN = { hcm: "TP. Hồ Chí Minh", hn: "Hà Nội", other: "Tỉnh/thành khác" };
  shell(`<div class="top"><h1>Cài đặt</h1></div>
  <div class="card stack"><h2>Liên hệ</h2><div class="grid2"><label>Tên Instagram (không có @)<input id="ig" value="${esc(shop.instagram || "")}"></label><label>Email nhận đơn<input id="em" type="email" value="${esc(shop.email || "")}"></label></div></div>
  <div class="card stack"><h2>Phí ship theo khu vực</h2><div class="grid3">${["hcm", "hn", "other"].map(id => `<label>${ZN[id]} (VND)<input type="number" min="0" step="1000" data-z="${id}" value="${zones.find(z => z.id === id)?.fee ?? 35000}"></label>`).join("")}</div></div>
  <div class="card stack"><h2>Tài khoản nhận tiền (hiện QR cho khách)</h2><p class="muted sm">Mã ngân hàng theo VietQR, ví dụ: mb, tcb, vcb, acb, bidv, vpb, tpb.</p>
    <div id="banks" class="stack">${banks.map(bankRow).join("")}</div><button class="btn soft" id="addB">+ Thêm tài khoản</button></div>
  <div class="savebar"><button class="btn pri" id="save">Lưu cài đặt</button></div><p class="err" id="e"></p>`, "settings");
  const wire = () => document.querySelectorAll("[data-rmb]").forEach(b => b.onclick = () => b.closest(".bank-r").remove());
  wire(); $("#addB").onclick = () => { $("#banks").insertAdjacentHTML("beforeend", bankRow({ bank: "", code: "", number: "", holder: "" })); wire(); };
  $("#save").onclick = async () => {
    const bl = [...document.querySelectorAll(".bank-r")].map(r => ({ bank: r.querySelector("[data-f=bank]").value.trim(), code: r.querySelector("[data-f=code]").value.trim().toLowerCase(), number: r.querySelector("[data-f=number]").value.trim(), holder: r.querySelector("[data-f=holder]").value.trim().toUpperCase() })).filter(b => b.number);
    const zn = [...document.querySelectorAll("[data-z]")].map(i => ({ id: i.dataset.z, fee: +i.value || 0 }));
    const up = [["shop", { instagram: $("#ig").value.trim().replace(/^@/, ""), email: $("#em").value.trim() }], ["ship_zones", zn], ["banks", bl]].map(([key, value]) => ({ key, value, is_public: true }));
    try { must(await sb.from("settings").upsert(up)); toast("Đã lưu cài đặt"); } catch (e) { $("#e").textContent = e.message; }
  };
}
const bankRow = b => `<div class="card bank-r" style="background:#faf9ff;margin:0"><div class="grid2"><label>Tên ngân hàng<input data-f="bank" value="${esc(b.bank)}"></label><label>Mã VietQR<input data-f="code" value="${esc(b.code)}"></label><label>Số tài khoản<input data-f="number" value="${esc(b.number)}"></label><label>Chủ tài khoản (không dấu)<input data-f="holder" value="${esc(b.holder)}"></label></div><button class="btn red sm" data-rmb style="margin-top:8px">Xóa tài khoản này</button></div>`;

boot();
