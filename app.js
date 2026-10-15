// handmadebyhnhi – ứng dụng một trang (router theo hash), song ngữ VI/EN. Dữ liệu ở data.js. Giao diện theo thiết kế Stitch "Artisanal Warmth".
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => Math.round(n).toLocaleString("vi-VN") + "₫";
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
let lang = "vi";
const x = (vi, en) => (lang === "vi" ? vi : en);
const L = () => (lang === "vi" ? 0 : 1);
const tagLabel = (g, k) => TAGS[g][k][L()];
const pName = p => p[lang][0];
const IG = () => SETTINGS.instagram;

// ---------- Kết nối Supabase (tuỳ chọn; không cấu hình thì web dùng dữ liệu trong data.js) ----------
const REMOTE = () => !!(typeof SUPABASE !== "undefined" && SUPABASE.url && SUPABASE.anonKey);
async function sb(path, opt = {}) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), opt.timeout || 6000);
  try {
    const r = await fetch(SUPABASE.url + "/rest/v1/" + path, { ...opt, signal: ctl.signal, headers: { apikey: SUPABASE.anonKey, Authorization: "Bearer " + SUPABASE.anonKey, "Content-Type": "application/json", ...(opt.headers || {}) } });
    const body = await r.json().catch(() => null);
    if (!r.ok) throw Object.assign(new Error((body && (body.message || body.hint)) || r.statusText), { status: r.status });
    return body;
  } finally { clearTimeout(tm); }
}
let REMOTE_PRODUCTS = false; // chỉ gửi đơn lên Supabase khi sản phẩm cũng đang đọc từ Supabase
async function loadRemote() {
  if (!REMOTE()) return;
  try {
    const [rows, st] = await Promise.all([sb("products?select=slug,status,featured,sort,data&order=sort.asc"), sb("settings?select=key,value&is_public=eq.true")]);
    if (rows.length) REMOTE_PRODUCTS = true;
    if (rows.length) PRODUCTS.splice(0, PRODUCTS.length, ...rows.map(r => ({ ...r.data, slug: r.slug, featured: r.featured, soldOut: r.status === "sold_out" })));
    for (const { key, value } of st) {
      if (key === "shop") { if (value.instagram) SETTINGS.instagram = value.instagram; if (value.email) SETTINGS.email = value.email; }
      if (key === "ship_zones" && value.length) SETTINGS.shipZones = value;
      if (key === "banks" && value.length) SETTINGS.banks = value;
    }
  } catch (e) { console.warn("Supabase không tải được, dùng dữ liệu mặc định:", e.message); }
}

// ---------- Nội dung chính sách (theo thiết kế Stitch; bản nháp) ----------
const POLICY_ORDER = ["doi-tra", "van-chuyen", "bao-mat", "dieu-khoan"];
const POLICIES = {
  vi: {
    "doi-tra": { tab: "Đổi trả hàng", title: "Chính sách Đổi & Trả sản phẩm thủ công", intro: "Mỗi sản phẩm tại handmadebyhnhi đều được đan móc thủ công bằng sự nâng niu và tỉ mỉ. Để mang lại trải nghiệm ưng ý nhất và đảm bảo quyền lợi công bằng cho cả bạn và tiệm len nhỏ, kính mong bạn đọc kỹ các quy định sau:",
      items: [["Hàng cá nhân hóa theo yêu cầu (Custom-made)", "Vì sản phẩm được móc tay và thêu tên/phối màu riêng theo mong muốn của từng bạn, tiệm xin phép không áp dụng đổi trả hay hoàn tiền nếu bạn thay đổi ý thích sau khi đơn hàng đã chính thức bước vào giai đoạn móc len."],
        ["Sản phẩm mẫu có sẵn", "Áp dụng đổi mẫu trong vòng [3 ngày] kể từ ngày nhận hàng thành công theo biên nhận vận chuyển. Điều kiện: sản phẩm còn nguyên tem mác tiệm, sợi len không bị xù lông và không bám mùi lạ/nước hoa."],
        ["Hủy hoặc đổi thiết kế đơn hàng", "Bạn có thể yêu cầu hủy đơn hoặc đổi tông màu sợi len trong vòng 12 giờ kể từ khi gửi xác nhận đặt hàng, trước khi đơn chuyển sang trạng thái “Đang làm”."],
        ["Lỗi do kỹ thuật sản xuất", "Tiệm chịu 100% phí ship 2 chiều và gia công lại nếu kiện hàng bị tuột mũi len, nhầm bảng màu hoặc sai lệch kích thước vượt ngưỡng chuẩn so với thỏa thuận."]],
      tip: "Hãy quay lại video ngắn khi bóc kiện hàng nhé! Điều này giúp Nhi bảo vệ trọn vẹn quyền lợi hoàn tiền hoặc đổi sản phẩm cho bạn nhanh nhất." },
    "van-chuyen": { tab: "Vận chuyển & gói", title: "Chính sách Vận chuyển & Đóng gói", intro: "Mỗi kiện hàng đều được đóng gói cẩn thận như một món quà.",
      items: [["Thời gian nhận hàng", "Thời gian nhận = thời gian làm (2–7 ngày tuỳ mẫu) + khoảng 3 ngày giao hàng. Ngày dự kiến hiển thị trên trang sản phẩm."],
        ["Phí vận chuyển", "Phí ship tính theo khu vực nhận hàng và hiển thị rõ trước khi gửi đơn: TP.HCM 25.000₫; Hà Nội và các tỉnh khác 35.000₫ [chủ shop xác nhận biểu phí]."],
        ["Đóng gói", "Hộp carton bảo vệ, lót giấy, thiệp viết tay cảm ơn. Trách nhiệm khi bưu kiện thất lạc: [chủ shop xác nhận theo đơn vị vận chuyển]."]], tip: "Hãy kiểm tra hàng khi nhận và quay video bóc kiện để được hỗ trợ nhanh nhất." },
    "bao-mat": { tab: "Bảo mật thông tin", title: "Chính sách Bảo mật thông tin", intro: "Chúng mình chỉ dùng thông tin của bạn để tư vấn và xử lý đơn hàng.",
      items: [["Dữ liệu thu thập", "Họ tên, số điện thoại, email, địa chỉ nhận hàng và câu trả lời quiz."], ["Thời gian lưu", "[Chủ shop xác nhận]. Bạn có thể yêu cầu xóa dữ liệu bất cứ lúc nào qua Instagram hoặc email của shop."], ["Bản chạy thử", "Phiên bản này lưu dữ liệu ngay trên trình duyệt của bạn và không gửi lên máy chủ."]], tip: "Chúng mình không bao giờ lưu số thẻ ngân hàng của bạn." },
    "dieu-khoan": { tab: "Điều khoản dịch vụ", title: "Điều khoản dịch vụ", intro: "Bằng việc đặt hàng, bạn đồng ý với các điều khoản dưới đây.",
      items: [["Thanh toán", "Thanh toán 100% sau khi shop xác nhận đơn; đơn bắt đầu làm khi shop nhận được tiền."], ["Màu sắc & sai khác nhỏ", "Màu len thực tế có thể lệch nhẹ so với màn hình; mỗi sản phẩm handmade có sai khác nhỏ là bình thường."], ["Chính sách liên quan", "Bạn đồng ý với chính sách đổi trả, vận chuyển và bảo mật của shop."]], tip: "Có thắc mắc? Nhắn shop qua Instagram, Nhi luôn sẵn lòng." },
  },
  en: {
    "doi-tra": { tab: "Returns", title: "Returns & exchanges", intro: "Every piece is crocheted by hand with care. Please read the rules below.",
      items: [["Personalised items (custom-made)", "Items with custom colours or embroidery are not returnable or refundable once the order has entered the making stage."], ["Ready-made items", "Exchange within [3 days] of delivery. Items must keep their tags, be fuzz-free and free of strong smells."], ["Cancel or change design", "You can cancel or change the colour within 12 hours of confirming the order, before it moves to “In progress”."], ["Production faults", "We cover 100% of two-way shipping and remake the item for dropped stitches, wrong colours or size outside tolerance."]],
      tip: "Please record a short unboxing video – it helps us resolve any claim fastest." },
    "van-chuyen": { tab: "Shipping", title: "Shipping & packaging", intro: "Every parcel is packed like a gift.",
      items: [["Delivery time", "Delivery = making time (2–7 days) + about 3 days shipping."], ["Shipping fees", "By delivery area, shown before you send your order: HCMC 25,000₫; Hanoi and other provinces 35,000₫ [to be confirmed by the shop]."], ["Packaging", "Protective box, paper filling and a handwritten thank-you card. Lost parcels: [to be confirmed]."]], tip: "Please inspect your parcel on arrival and record the unboxing." },
    "bao-mat": { tab: "Privacy", title: "Privacy policy", intro: "We only use your information to advise you and process your order.",
      items: [["Data collected", "Name, phone, email, delivery address and quiz answers."], ["Retention", "[To be confirmed]. You can ask us to delete your data any time via Instagram or email."], ["Preview version", "This version stores data in your browser only and sends nothing to a server."]], tip: "We never store your card details." },
    "dieu-khoan": { tab: "Terms", title: "Terms of service", intro: "By ordering you agree to the terms below.",
      items: [["Payment", "100% payment after we confirm your order; making starts once payment is received."], ["Colour & small variations", "Actual yarn colour may differ slightly from your screen; small variations are normal for handmade pieces."], ["Related policies", "You agree to our returns, shipping and privacy policies."]], tip: "Questions? Message us on Instagram – we're happy to help." },
  },
};

// ---------- Thuật toán đề xuất (tài liệu mục 5) ----------
const minPrice = p => p.price + Math.min(...p.sizes.map(s => s[3]));
function daysLeft(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.ceil((d - n) / 86400000);
}
function scoreProduct(p, a) {
  let sum = 0, wsum = 0; const hits = {};
  for (const [g, { weight }] of Object.entries(TAG_GROUPS)) {
    const chosen = [].concat(a[g] || []);
    if (!chosen.length) continue;
    const match = chosen.filter(v => (p.tags[g] || []).includes(v));
    sum += weight * (match.length / chosen.length); wsum += weight;
    if (match.length) hits[g] = match;
  }
  return { score: wsum ? Math.round(sum / wsum * 100) : 0, hits };
}
function recommend(a) {
  const budget = QUIZ[2].choices[a.budget ?? 3][0], left = daysLeft(a.date);
  const rows = PRODUCTS.map(p => ({ p, ...scoreProduct(p, a), ok: minPrice(p) <= budget && p.days + SETTINGS.shipDays <= left }));
  const pass = rows.filter(r => r.ok);
  const cmp = (u, v) => v.score - u.score || (v.p.featured - u.p.featured) || Math.abs(budget - minPrice(u.p)) - Math.abs(budget - minPrice(v.p));
  const good = pass.filter(r => r.score >= SETTINGS.minScore).sort(cmp).slice(0, 3);
  if (good.length) return { list: good, fallback: false };
  const near = (pass.length ? pass.sort(cmp) : rows.sort((u, v) => minPrice(u.p) - minPrice(v.p)))[0];
  return { list: [near], fallback: true };
}
function reasonFor(r) {
  const h = r.hits;
  const rec = h.recipient && tagLabel("recipient", h.recipient[0]);
  const occ = h.occasion && tagLabel("occasion", h.occasion[0]);
  const parts = [];
  if (rec || occ) parts.push(lang === "vi" ? `Hợp làm quà ${occ ? occ + " " : ""}${rec ? "cho " + rec : ""}`.trim() : `A great ${occ ? occ + " " : ""}gift${rec ? " for " + rec : ""}`);
  if (h.style) parts.push(x(`phong cách ${h.style.map(k => tagLabel("style", k)).join(" / ")} như bạn chọn`, `${h.style.map(k => tagLabel("style", k)).join(" / ")} style, as you chose`));
  if (h.palette) parts.push(x(`tông ${tagLabel("palette", h.palette[0])}`, `${tagLabel("palette", h.palette[0])} tones`));
  if (h.personalization) parts.push(x(`đúng nhu cầu “${tagLabel("personalization", h.personalization[0])}”`, `fits your “${tagLabel("personalization", h.personalization[0])}” wish`));
  if (!parts.length) return x("Một lựa chọn gần với nhu cầu của bạn.", "A close fit for what you need.");
  const txt = parts.join(", ");
  return txt.charAt(0).toUpperCase() + txt.slice(1) + ".";
}

// ---------- Tiện ích ----------
const etaDate = p => { const d = new Date(); d.setDate(d.getDate() + p.days + SETTINGS.shipDays); return d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB"); };
const href = path => `#/${lang}${path ? "/" + path : ""}`;
const nav = path => { location.hash = href(path); };
const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const unb64 = s => JSON.parse(decodeURIComponent(escape(atob(s))));
const igUrl = () => `https://ig.me/m/${IG()}`;
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2800);
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch (e) {}
  try { const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (e) { return false; }
}
// IG-02: sao chép tin mẫu rồi mở Instagram; nếu không sao chép được thì hiện tin để khách tự chép (T-12)
async function messageShop(text) {
  const ok = await copyText(text);
  if (ok) { toast(x("Đã sao chép tin nhắn mẫu – dán vào hộp thoại Instagram nhé 💌", "Sample message copied – paste it into Instagram 💌")); window.open(igUrl(), "_blank", "noopener"); return; }
  const box = document.createElement("div"); box.className = "modal";
  box.innerHTML = `<div class="modal-in"><p>${esc(x("Không sao chép tự động được. Hãy sao chép đoạn tin dưới đây rồi gửi cho shop:", "Couldn't copy automatically. Please copy this message and send it to us:"))}</p><textarea readonly rows="6">${esc(text)}</textarea><p class="row"><a class="btn" href="${igUrl()}" target="_blank" rel="noopener">${esc(x("Nhắn shop trên Instagram", "Message us on Instagram"))}</a> <button class="btn ghost" id="mClose">✕</button></p></div>`;
  document.body.appendChild(box); box.querySelector("textarea").select();
  box.querySelector("#mClose").onclick = () => box.remove();
}
const img = (p, i = 0, cls = "") => `<img class="pimg ${cls}" src="${p.images[i]}" alt="${esc(pName(p))}" loading="lazy" style="object-position:${p.imgPos || "center 25%"}">`;
const thumb = (p, big) => p.images ? `<div class="thumb has-img${big ? " big" : ""}" style="background:${p.bg}">${img(p)}<span class="chip-tag">${esc(p.tag[L()])}</span></div>` : `<div class="thumb${big ? " big" : ""}" style="background:${p.bg}"><span class="chip-tag">${esc(p.tag[L()])}</span><span class="emo">${p.emoji}</span><small class="hand">${x("ảnh sắp cập nhật", "photo coming soon")}</small></div>`;
const eyebrow = (vi, en) => `<span class="hand eyebrow">${x(vi, en)}</span>`;

// ---------- Màn hình ----------
const views = {};

const card = p => `<a class="card" href="${href("san-pham/" + p.slug)}">${thumb(p)}<div class="card-body"><span class="muted time">⏱ ${x("Làm thủ công", "Handmade in")} ${p.days} ${x("ngày", "days")}</span><h3>${esc(pName(p))}</h3><div class="row-price"><span class="price">${x("từ", "from")} ${money(minPrice(p))}</span><span class="hand link">${x("xem chi tiết", "view details")}</span></div></div></a>`;

views.home = () => {
  const feat = PRODUCTS.filter(p => p.featured).concat(PRODUCTS.filter(p => !p.featured)).slice(0, 8);
  const steps = x([["Làm quiz tìm gu", "Trả lời 7 câu hỏi ngắn để gợi ý kiểu dáng và bảng màu len phù hợp với bạn.", "🧠"], ["Tùy chọn & phối màu", "Chọn tone màu ưa thích và yêu cầu thêu tên hoặc charm nhỏ.", "🎨"], ["Gửi đơn đặt hàng", "Gửi đơn qua Instagram hoặc email để xác nhận size, ngày nhận và thanh toán.", "💌"], ["Shop làm & giao tay", "Tiệm hoàn thiện trong 2–7 ngày, đóng gói hộp quà và gửi tận nơi cho bạn.", "🎁"]],
    [["Take the quiz", "Answer 7 short questions to get shapes and colours that suit you.", "🧠"], ["Customise", "Choose your colour tone and ask for an embroidered name or charm.", "🎨"], ["Send your order", "Send via Instagram or email to confirm size, date and payment.", "💌"], ["We make & ship", "Made in 2–7 days, gift-boxed and delivered to you.", "🎁"]]);
  const faq = x([["Thời gian hoàn thiện một sản phẩm len là bao lâu?", "Vì mỗi sản phẩm đều móc tay 100%, thời gian làm dao động từ 2 đến 7 ngày tùy độ phức tạp (lót ly/kẹp tóc 2 ngày, khăn/túi 4–7 ngày). Nếu cần gấp, hãy báo trước với tiệm qua Instagram để được hỗ trợ ưu tiên."],
    ["Hướng dẫn giặt và bảo quản đồ len đúng cách?", "Giặt nhẹ bằng tay với dầu gội hoặc sữa tắm dịu nhẹ trong nước mát (dưới 30°C). Không vắt xoắn mạnh; cuộn trong khăn bông để thấm bớt nước rồi phơi ngang nơi thoáng gió, tránh nắng gắt."],
    ["Chính sách đổi trả hàng cá nhân hóa ra sao?", "Với sản phẩm làm riêng (thêu tên, phối màu độc bản), tiệm chụp ảnh nghiệm thu gửi bạn duyệt trước khi gửi hàng. Nếu lỗi do kỹ thuật của tiệm, chúng mình sẽ làm lại miễn phí. Xem chi tiết ở trang chính sách."],
    ["Phí vận chuyển và quy cách đóng gói quà tặng?", "Mỗi kiện hàng được đóng hộp bảo vệ chỉn chu, lót giấy và kèm thiệp tay cảm ơn. Phí ship theo khu vực nhận hàng, hiển thị rõ trước khi gửi đơn."]],
    [["How long does one piece take?", "Everything is 100% hand-crocheted, so 2 to 7 days depending on complexity. Need it sooner? Tell us on Instagram first."],
    ["How do I wash and store it?", "Hand wash gently in cool water (under 30°C) with mild soap. Don't wring; roll in a towel and dry flat in a breezy spot away from harsh sun."],
    ["What about returns for personalised items?", "For custom pieces we send you a photo to approve before shipping. If the fault is ours we remake it free. See the policy page."],
    ["Shipping and gift packaging?", "Each parcel is boxed with paper filling and a handwritten card. Shipping depends on your area and is shown before you send your order."]]);
  return `
  <section class="hero"><div class="hero-l">
    <span class="pill"><i class="dot"></i>${x("Mỗi sản phẩm là một câu chuyện riêng", "Every piece has its own story")}</span>
    <h1>${x("Món đồ móc dành riêng cho bạn", "A crochet piece made just for you")}</h1>
    <p>${x("Từng cuộn len tuyển chọn, từng mũi móc kiên nhẫn đan cài bằng sự chăm chút và tình yêu thương dịu dàng. Chúng mình biến ý tưởng và cá tính của bạn thành những món đồ ấm áp, độc bản.", "Hand-picked yarn, patient stitches and gentle care. We turn your ideas and personality into warm, one-of-a-kind pieces.")}</p>
    <div class="cta-row"><a class="btn dark big" href="${href("quiz")}">${x("Tìm mẫu hợp với bạn", "Find my match")} →</a><span class="hint hand">${x("Chỉ mất 1 phút để khám phá gu len của bạn ✨", "Just 1 minute to find your yarn style ✨")}</span></div>
    <div class="stats"><div><b>100%</b><span>${x("Thủ công tay", "Handmade")}</span></div><div><b>Custom</b><span>${x("Phối màu & thêu tên", "Colours & names")}</span></div><div><b>Cotton & Milk</b><span>${x("Mềm mịn, không xù", "Soft, no pilling")}</span></div></div>
  </div><div class="hero-r"><div class="hero-card"><div class="hc-top"><span class="chip">Studio Hnhi</span><span class="hand">#madewithlove</span></div><div class="hc-mid"><div class="yarn">🧶</div><b class="serif">${x("Tiệm len nhỏ ấm áp", "A cosy little yarn shop")}</b><small class="muted">${x("Đan dệt từng nốt thăng trầm bình yên", "Stitching calm, one loop at a time")}</small></div><div class="hc-bot muted"><span>✓ ${x("Tỉ mỉ thủ công", "Carefully handmade")}</span><span>🌿 ${x("Len tự nhiên", "Natural yarn")}</span></div></div></div></section>
  <section class="section"><div class="sec-head"><div>${eyebrow("Bộ tuyển tập mùa này", "This season's collection")} <span class="muted">/ SELECTED WORKS</span><h2>${x("Bộ sưu tập nổi bật", "Featured collection")}</h2><p class="muted">${x("Những thiết kế được yêu thích nhất từ đôi tay thợ móc handmadebyhnhi.", "Our most loved pieces, crocheted by hand.")}</p></div><a class="btn soft" href="${href("san-pham")}">${x("Xem tất cả sản phẩm", "See all products")} →</a></div><div class="grid">${feat.map(card).join("")}</div></section>
  <section class="section"><div class="panel"><div class="sec-head"><div>${eyebrow("Quy trình mộc mạc", "Our simple process")}<h2>${x("4 bước đặt hàng theo yêu cầu", "Order in 4 steps")}</h2></div><p class="muted side-note">${x("Để mỗi chiếc khăn, chiếc túi đến tay bạn đều vừa vặn với kích thước và sở thích màu sắc nhất.", "So every piece fits your size and colour taste.")}</p></div><div class="steps">${steps.map(([a, b, i], n) => `<div class="step"><div class="step-top"><b class="serif num">0${n + 1}</b><span>${i}</span></div><h3>${a}</h3><p class="muted">${b}</p></div>`).join("")}</div></div></section>
  <section class="section story">${"<div class='heart'>♡</div>"}${eyebrow("Tâm sự từ bàn móc nhỏ", "Notes from the crochet desk")}<h2>${x("“Mỗi cuộn len là một sợi dây gắn kết giữa người làm và người đón nhận.”", "“Every ball of yarn is a thread between the maker and the one who receives.”")}</h2><p class="lead">${x("Ở handmadebyhnhi, chúng mình tin những món đồ ấm áp nhất không được sản xuất hàng loạt bởi máy móc. Chúng được ấp ủ qua hàng giờ kiên nhẫn bên khung cửa sổ, nơi từng mũi đơn, mũi kép được thắt nút vừa vặn.", "At handmadebyhnhi we believe the warmest things aren't mass-produced. They're nurtured over patient hours by the window, one stitch at a time.")}</p><p class="muted">${x("Sợi len tại tiệm được tuyển chọn từ cotton và milk yarn không kích ứng, an toàn với làn da nhạy cảm. Dù bạn tự thưởng một chiếc mũ ấm hay tặng người thương một chú gấu nhỏ mang tên họ, chúng mình luôn gói trọn sự trân quý vào từng nút thắt.", "Our yarn is non-irritating cotton and milk yarn, safe for sensitive skin. Whether it's a treat for yourself or a tiny bear with a loved one's name, we put all our care into every knot.")}</p><div class="sign"><i></i><span class="hand">${x("Hnhi — Người sáng lập handmadebyhnhi", "Hnhi — founder of handmadebyhnhi")}</span><i></i></div></section>
  <section class="section"><div class="center">${eyebrow("Giải đáp băn khoăn", "Good to know")}<h2>${x("Câu hỏi thường gặp", "Frequently asked questions")}</h2></div><div class="faq">${faq.map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${i + 1}. ${q}</summary><p>${a}</p></details>`).join("")}</div></section>
  <section class="section"><div class="cta-banner"><div>${eyebrow("Bạn đã có ý tưởng riêng chưa?", "Got your own idea?")}<h3 class="serif">${x("Hãy cùng tiệm tạo nên món đồ len mơ ước", "Let's make the yarn piece of your dreams")}</h3><p class="muted">${x("Gửi hình phác thảo, màu sắc yêu thích hoặc thông điệp bạn muốn thêu. Chúng mình sẽ biến nó thành hiện thực.", "Send a sketch, favourite colours or a message to embroider and we'll make it real.")}</p></div><div class="row"><a class="btn dark" href="${href("quiz")}">${x("Làm Quiz Tìm Gu Len", "Take the yarn quiz")}</a><a class="btn white" href="${igUrl()}" target="_blank" rel="noopener">${x("Nhắn qua Instagram", "Message on Instagram")} ↗</a></div></div></section>`;
};

views.products = () => `<section class="section"><div class="sec-head"><div><div class="eyebrow-line"><i></i>${eyebrow("bộ sưu tập thủ công", "handmade collection")}</div><h1>${x("Sản phẩm", "Products")}</h1><p class="muted">${x("Từng mũi len được đan cài tỉ mỉ từ sợi cotton & len sữa tự nhiên, gửi gắm sự an yên và nét duyên dáng vào đời sống hàng ngày của bạn.", "Every stitch is worked from natural cotton and milk yarn, bringing calm and charm to your everyday life.")}</p></div><span class="pill soft-pill"><i class="dot green"></i>${x("Nhận móc theo yêu cầu cá nhân", "Custom orders welcome")}</span></div>
  <div class="warn-bar"><span>⚠️ ${x("Đang chạy thử nghiệm: hình ảnh đại diện, sản phẩm và giá dưới đây là dữ liệu mẫu demo của tiệm.", "Preview mode: images, products and prices below are demo data.")}</span><span class="pill amber">${x("Bản xem trước", "Preview")}</span></div>
  <div class="grid">${PRODUCTS.map(card).join("")}</div>
  <div class="banner-quiz"><div class="bq-l"><span class="round">?</span><div><b class="serif">${x("Chưa biết chọn mẫu nào tặng người thương?", "Not sure what to gift?")}</b><p class="muted">${x("Trả lời vài câu hỏi trắc nghiệm nhanh để tìm thiết kế và màu len hoàn hảo nhất.", "Answer a few quick questions to find the perfect piece and colour.")}</p></div></div><a class="btn primary" href="${href("quiz")}">${x("Thử ngay Quiz tìm mẫu hợp gu", "Try the quiz")} →</a></div>
  <div class="perks"><div><span class="round sm">🎨</span><div><b>${x("Tùy biến bảng màu", "Pick your colours")}</b><small class="muted">${x("Nhiều màu len cao cấp tự chọn", "Many premium yarn colours")}</small></div></div><div><span class="round sm">🌿</span><div><b>${x("Sợi bông an toàn", "Safe cotton yarn")}</b><small class="muted">${x("Sợi cotton mềm dịu với làn da", "Soft on your skin")}</small></div></div><div><span class="round sm">🎁</span><div><b>${x("Hộp quà trang nhã", "Elegant gift box")}</b><small class="muted">${x("Kèm thiệp viết tay xinh xắn", "With a handwritten card")}</small></div></div></div></section>`;

views.product = slug => {
  const p = PRODUCTS.find(z => z.slug === slug); if (!p) return views.notfound();
  const d = (store.get("draft", {}) || {}); const dd = d.slug === slug ? d : {};
  const hasName = p.nameFee !== null;
  return `<section class="section detail"><a class="back" href="${href("san-pham")}">← ${x("Quay lại Sản phẩm", "Back to products")}</a>
  <div class="detail-grid"><div class="col-l">
    ${p.images ? `<div class="gallery"><div class="main-img" style="background:${p.bg}">${img(p, 0, "main")}<span class="status"><i class="dot green"></i>${x("Làm theo đơn (Made-to-order)", "Made to order")}</span></div>${p.images.length > 1 ? `<div class="thumbs">${p.images.map((u, i) => `<button type="button" class="th ${i === 0 ? "on" : ""}" data-i="${i}" aria-label="${x("Ảnh", "Photo")} ${i + 1}"><img src="${u}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}</div>` : `<div class="img-card" style="background:${p.bg}"><span class="badge-hand">🌸 ${x("Ảnh sắp cập nhật (Handmade)", "Photo coming soon (Handmade)")}</span><span class="status"><i class="dot green"></i>${x("Làm theo đơn (Made-to-order)", "Made to order")}</span><div class="emblem"><span class="emo">${p.emoji}</span><b class="serif">${esc(pName(p))}</b><small class="hand">${x("mũi móc hoài niệm & yêu thương", "stitched with love")}</small></div><div class="swatch-strip"><span class="muted">${x("Phối màu hot:", "Popular colours:")} ${YARN_COLORS.slice(0, 4).map(c => `<i class="sw" style="background:${c.hex}"></i>`).join("")}</span><span class="primary-t">${x("Xem 8 màu", "See 8 colours")}</span></div></div>`}
    <div class="card-box spec-card"><h2 class="serif sm">⚙ ${x("Thông số thủ công", "Handmade specs")}</h2><div class="specs">${p.specs.map(s => `<div><small class="muted">${s[0]}</small><b>${s[1]}</b><small class="muted">${s[2]}</small></div>`).join("")}</div><p class="note-green">🌿 ${x("Sản phẩm dùng sợi len không gây kích ứng da, đóng gói cẩn thận.", "Made with skin-friendly yarn and carefully packed.")}</p></div>
  </div><div class="col-r">
    <div class="card-box"><div class="tags">${p.hot ? `<span class="pill rose">${x("Bán chạy nhất", "Bestseller")}</span>` : ""}${hasName ? `<span class="hand">${x("thêu tên theo yêu cầu", "name embroidery available")} 🧶</span>` : ""}</div><h1 class="serif">${esc(pName(p))}</h1><div class="price-row"><b class="serif big-price" id="livePrice"></b>${p.oldPrice ? `<s class="muted">${money(p.oldPrice)}</s><span class="pill green-bg">${p.sale[L()]}</span>` : ""}</div><p class="muted">${esc(p[lang][1])}</p></div>
    <form id="optForm" class="card-box form" novalidate>
      <fieldset><legend>1. ${x("Màu len chủ đạo", "Main yarn colour")} <span class="hand r">${x("chọn màu bạn yêu", "pick your favourite")}</span></legend><div class="swatches">${YARN_COLORS.map(c => `<label title="${esc(c[lang])}"><input type="radio" name="color" value="${c.id}" ${(dd.color || "pink") === c.id ? "checked" : ""}><span style="background:${c.hex}"><em>✓</em></span></label>`).join("")}</div><div class="color-now">🎨 ${x("Đang chọn:", "Selected:")} <b id="colorName"></b></div></fieldset>
      <fieldset><legend>2. ${x("Kích thước", "Size")}</legend><div class="sizes">${p.sizes.map((z, i) => `<label class="size-card"><input type="radio" name="size" value="${z[0]}" ${(dd.size ? dd.size === z[0] : i === 0) ? "checked" : ""}><span><b>${z[lang === "vi" ? 1 : 2]}</b></span><em>${z[3] ? (z[3] > 0 ? "+" : "−") + money(Math.abs(z[3])) : x("Cơ bản", "Standard")}</em></label>`).join("")}</div></fieldset>
      ${hasName ? `<div><label class="lab" for="txt">3. ${x("Thêu tên / lời nhắn theo yêu cầu", "Embroidered name / message")} <span class="pill grey">${p.nameFee ? "+" + money(p.nameFee) : x("Miễn phí", "Free")}</span><span class="cnt" id="cnt">0/20</span></label><input id="txt" name="text" maxlength="20" placeholder="${x("Ví dụ: Nhí 🤍 hoặc My Lily", "e.g. Nhi 🤍 or My Lily")}" value="${esc(dd.text || "")}"><small class="muted it">${x("Chữ thêu bằng sợi len kim tuyến hoặc len cùng tone màu.", "Embroidered in metallic or matching yarn.")}</small></div>` : ""}
      <label class="lab">${x("Ghi chú thêm cho thợ móc", "Notes for the crocheter")}<textarea name="note" rows="2" placeholder="${x("Ví dụ: quai dài/ngắn, cách phối màu riêng theo ý bạn…", "e.g. longer strap, your own colour mix…")}">${esc(dd.note || "")}</textarea></label>
      <div class="eta"><span class="round sm">⏱</span><div><b>${x("Thời gian dự kiến nhận hàng", "Estimated delivery")}: ${etaDate(p)}</b><small class="muted">${x("Hôm nay", "Today")} + ${p.days} ${x("ngày móc", "days making")} + ${SETTINGS.shipDays} ${x("ngày vận chuyển", "days shipping")}</small></div></div>
      <p class="warn"><b>${x("Lưu ý hàng cá nhân hóa:", "Personalised items:")}</b> ${x("sản phẩm đan móc theo yêu cầu riêng nên không hoàn trả, trừ trường hợp có lỗi kỹ thuật từ đường kim mũi chỉ.", "custom-made pieces are non-returnable unless the fault is ours.")}</p>
      <div class="row">${p.soldOut ? `<button class="btn dark big grow" type="button" disabled>${x("Tạm hết slot – nhắn shop để đặt trước", "Fully booked – message us to pre-order")}</button>` : `<button class="btn dark big grow" type="submit">${x("Đặt may ngay", "Order now")} <b class="serif" id="btnPrice"></b> →</button>`}<button class="btn soft" type="button" id="askIg">💬 ${x("Nhắn tin Instagram", "Message on Instagram")}</button></div>
    </form></div></div></section>`;
};
function wireProduct(slug) {
  const p = PRODUCTS.find(z => z.slug === slug); if (!p) return;
  const f = $("#optForm");
  const read = () => {
    const v = Object.fromEntries(new FormData(f)); v.slug = slug;
    const size = p.sizes.find(z => z[0] === v.size) || p.sizes[0];
    v.base = p.price; v.sizeFee = size[3]; v.nameFee = (p.nameFee && v.text && v.text.trim()) ? p.nameFee : 0;
    v.unit = v.base + v.sizeFee + v.nameFee; return v;
  };
  const upd = () => {
    const v = read(); $("#livePrice").textContent = money(v.unit); $("#btnPrice").textContent = money(v.unit);
    const c = YARN_COLORS.find(c => c.id === v.color); $("#colorName").textContent = c ? c[lang] : "";
    const cnt = $("#cnt"); if (cnt) cnt.textContent = `${(v.text || "").length}/20`;
    f.querySelectorAll(".size-card").forEach(l => l.classList.toggle("on", l.querySelector("input").checked));
  };
  f.addEventListener("input", upd); upd();
  document.querySelectorAll(".th").forEach(b => b.onclick = () => { $(".main-img .main").src = p.images[+b.dataset.i]; document.querySelectorAll(".th").forEach(o => o.classList.toggle("on", o === b)); });
  f.addEventListener("submit", e => { e.preventDefault(); store.set("draft", read()); nav("dat-hang"); });
  $("#askIg").onclick = () => { const v = read(); const c = YARN_COLORS.find(c => c.id === v.color); messageShop(x(`Chào shop, mình quan tâm mẫu "${pName(p)}", màu ${c[lang]}, dự tính ${money(v.unit)}. Shop tư vấn giúp mình nhé!`, `Hi! I'm interested in "${pName(p)}" in ${c[lang]} (about ${money(v.unit)}). Could you advise me?`)); };
}

// Quiz
const SECS = [["Người nhận", "Recipient"], ["Dịp tặng", "Occasion"], ["Chi phí & Dự trù", "Budget"], ["Ngày cần", "Deadline"], ["Phong cách", "Style"], ["Tông màu", "Palette"], ["Cá nhân hoá", "Personalise"]];
const HINTS = [["chọn người bạn muốn gửi gắm 💌", "who is it for 💌"], ["dịp nào cũng có món hợp ✨", "every occasion has a match ✨"], ["chọn mức bạn thấy thoải mái 🧶", "pick what feels comfortable 🧶"], ["không gấp cũng không sao 🌿", "no rush is fine 🌿"], ["chọn 1–2 gu bạn mê", "pick 1–2 you love"], ["màu nào làm bạn vui?", "which colour makes you smile?"], ["muốn riêng tư đến đâu?", "how personal?"]];
const BUDGET_NOTE = [["Móc khóa, lót ly, kẹp tóc xinh xắn", "Keychains, coasters, hair clips"], ["Mũ bucket, gấu len mini, túi đựng bình nước", "Bucket hat, mini bear, bottle sling"], ["Túi xách Granny Square, khăn choàng hoa cúc", "Granny Square tote, daisy shawl"], ["Set quà tặng cao cấp làm theo ý tưởng riêng", "Premium custom gift sets"]];
let qState = { i: 0, a: {} };
views.quiz = () => {
  const q = QUIZ[qState.i], a = qState.a, total = QUIZ.length, left = total - qState.i - 1;
  let body = "";
  if (q.kind === "single" || q.kind === "multi") {
    const cur = [].concat(a[q.group] || []);
    body = Object.keys(TAGS[q.group]).map((k, i) => opt(String.fromCharCode(65 + i), tagLabel(q.group, k), "", cur.includes(k), k)).join("") + (q.kind === "multi" ? `<p class="muted">${x("Chọn tối đa 2", "Pick up to 2")}</p>` : "");
  } else if (q.kind === "budget") {
    body = q.choices.map((c, i) => opt(String.fromCharCode(65 + i), c[lang === "vi" ? 1 : 2], BUDGET_NOTE[i][L()], a.budget === i, i)).join("");
  } else {
    const min = new Date().toISOString().slice(0, 10);
    body = opt("A", x("Không gấp", "No rush"), "", a.date === "", "none") + `<label class="dateq">${x("Hoặc chọn ngày cần nhận", "Or pick a date")}<input type="date" id="dateIn" min="${min}" value="${a.date || ""}"></label>`;
  }
  const last = qState.i === total - 1;
  return `<section class="section quiz"><div class="q-top"><span><b>✦</b> ${x("Tìm mẫu len hợp bạn", "Find your yarn match")}</span><span><span class="hand r">${x("bước", "step")} ${qState.i + 1}</span> <small class="muted">${x("Câu", "Question")} ${qState.i + 1} / ${total}</small></span></div>
  <div class="bar"><i style="width:${((qState.i + 1) / total) * 100}%"></i></div>
  <div class="card-box q-head"><div class="tags"><span class="pill grey">${x("Mục", "Part")} 0${qState.i + 1} · ${SECS[qState.i][L()]}</span><span class="hand r">${HINTS[qState.i][L()]}</span></div><h1 class="serif">${q[lang]}</h1></div>
  <div class="opts">${body}</div><p id="qErr" class="err" role="alert"></p>
  <div class="q-nav">${qState.i ? `<button class="btn soft" id="qBack">← ${x("Quay lại", "Back")}</button>` : "<span></span>"}<div class="q-r">${left ? `<span class="hand muted hide-m">${x(`còn ${left} câu nữa thôi ✨`, `${left} more to go ✨`)}</span>` : ""}<button class="btn dark" id="qNext">${last ? x("Xem gợi ý", "See my picks") : x("Tiếp tục", "Continue")} →</button></div></div>
  <div class="card-box roadmap"><div class="rm-head"><b>${x("LỘ TRÌNH 7 BƯỚC TÌM MẪU PHÙ HỢP", "7-STEP ROADMAP")}</b><span class="primary-t">${x("Đang ở bước", "Now on step")} ${qState.i + 1}</span></div><div class="rm">${SECS.map((s, i) => `<div class="rm-i ${i < qState.i ? "done" : i === qState.i ? "now" : ""}"><small>${i < qState.i ? "✓" : i === qState.i ? x("Hiện tại", "Now") : "0" + (i + 1)}</small><span>${s[L()]}</span></div>`).join("")}</div></div>
  <div class="gift"><span class="round">🎁</span><div><b class="serif">${x("Gói quà & Thiệp viết tay miễn phí", "Free gift wrap & handwritten card")}</b><small class="muted">${x("Mọi đơn hàng từ 200k đều được đóng hộp chỉn chu và tặng kèm thiệp viết lời chúc theo yêu cầu.", "Every order from 200k is gift-boxed with a handwritten card.")}</small></div></div></section>`;
};
const opt = (letter, title, sub, on, k) => `<button type="button" class="opt ${on ? "on" : ""}" data-k="${k}"><span class="ltr">${letter}</span><span class="otxt"><b>${title}</b>${sub ? `<small>(${sub})</small>` : ""}</span><span class="tick">${on ? "●" : "○"}</span></button>`;
function rerenderQuiz() { $("#view").innerHTML = views.quiz(); wireQuiz(); }
function wireQuiz() {
  const q = QUIZ[qState.i], a = qState.a;
  document.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (q.kind === "single") a[q.group] = k;
    else if (q.kind === "multi") { let c = [].concat(a[q.group] || []); c = c.includes(k) ? c.filter(v => v !== k) : [...c, k]; if (c.length > q.max) c = c.slice(-q.max); a[q.group] = c; }
    else if (q.kind === "budget") a.budget = +k;
    else a.date = "";
    rerenderQuiz();
  });
  const di = $("#dateIn"); if (di) di.onchange = () => { a.date = di.value; rerenderQuiz(); };
  const bk = $("#qBack"); if (bk) bk.onclick = () => { qState.i--; rerenderQuiz(); };
  $("#qNext").onclick = () => {
    const answered = q.kind === "budget" ? a.budget !== undefined : q.kind === "date" ? a.date !== undefined : [].concat(a[q.group] || []).length > 0;
    if (!answered) { $("#qErr").textContent = x("Hãy chọn một đáp án", "Please pick an answer"); return; }
    if (qState.i < QUIZ.length - 1) { qState.i++; rerenderQuiz(); window.scrollTo(0, 0); return; }
    const ref = "KQ-" + String(Math.floor(1000 + Math.random() * 9000));
    const ss = store.get("quizSessions", []); ss.push({ ref, answers: a, lang, at: Date.now() }); store.set("quizSessions", ss.slice(-50));
    if (REMOTE()) sb("quiz_sessions", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ref, answers: a, lang }) }).catch(() => {});
    location.hash = `#/${lang}/ket-qua/${ref}?a=${encodeURIComponent(b64(a))}`;
  };
}

const parseA = query => { try { return unb64(new URLSearchParams(query).get("a")); } catch (e) { return null; } };
views.result = (ref, query) => {
  const a = parseA(query);
  if (!a) return `<section class="section"><p>${x("Không tìm thấy trang này.", "Page not found.")}</p><a class="btn dark" href="${href("quiz")}">${x("Làm lại quiz", "Retake quiz")}</a></section>`;
  const res = recommend(a), top = res.list[0];
  const sum = [QUIZ[2].choices[a.budget ?? 3][lang === "vi" ? 1 : 2], [].concat(a.style || []).map(k => tagLabel("style", k)).join(" + "), a.recipient ? tagLabel("recipient", a.recipient) : ""].filter(Boolean).join(", ");
  return `<section class="section result"><div class="center"><span class="pill soft-pill">‹ ${x("Mã kết quả", "Result code")}: <b id="codeVal">${esc(ref)}</b> <button class="icon-btn" id="copyCode" aria-label="${x("Sao chép mã", "Copy code")}">⧉</button></span><h1 class="serif">${x("Gợi ý dành cho bạn", "Picks for you")}</h1><span class="hand r big-hand">${x("Được dệt riêng theo phong cách của bạn", "Woven just for your style")} 🧶</span><p class="muted lead-s">${x("Dựa trên câu trả lời của bạn", "Based on your answers")} <b>(${esc(sum)})</b>, ${x("đây là các mẫu len thủ công phù hợp nhất từ tiệm.", "here are the handmade pieces that suit you best.")}</p>${res.fallback ? "" : `<span class="pill soft-pill"><i class="dot"></i> ${x("Mức khớp tối đa", "Top match")}: <b>${top.score}%</b> · ${res.list.length} ${x("mẫu len chọn lọc thủ công", "hand-picked pieces")}</span>`}</div>
  ${res.fallback ? `<p class="warn-bar">${x("Chưa có mẫu nào khớp hoàn toàn với lựa chọn của bạn. Đây là mẫu gần nhất – bạn cũng có thể nhắn shop để đặt làm riêng nhé!", "Nothing matches all your answers exactly. Here's the closest piece – or message us to make something custom!")}</p>` : ""}
  <div class="results">${res.list.map((r, i) => `<article class="rcard">${!res.fallback && i === 0 ? `<span class="ribbon hand">★ ${x("Phù hợp nhất", "Best match")} • ${r.score}%</span>` : ""}<div class="rimg${r.p.images ? " has-img" : ""}" style="background:${r.p.bg}">${r.p.images ? img(r.p) : `<span class="emo">${r.p.emoji}</span><span class="hand tilt">${x("ảnh sắp cập nhật", "photo coming soon")}</span>`}</div><div class="rbody"><div class="tags">${res.fallback ? "" : `<span class="pill ${i === 0 ? "rose" : "grey"}">${x("Độ phù hợp", "Match")} ${r.score}%</span>`}<span class="pill ${i === 0 ? "green-bg" : "grey"}">${esc(r.p.tag[L()])}</span></div><h2 class="serif">${esc(pName(r.p))}</h2><p class="muted">${res.fallback ? esc(r.p[lang][1]) : esc(reasonFor(r)) + " " + esc(r.p[lang][1])}</p><div class="rspec"><div><small class="muted">${x("Giá tham khảo", "From")}</small><b class="primary-t serif">${money(minPrice(r.p))}</b></div><div><small class="muted">${x("Thời gian đan", "Making time")}</small><b>⏱ ${r.p.days} ${x("ngày", "days")}</b></div><div><small class="muted">${r.p.specs[1][0]}</small><b>${r.p.specs[1][1]}</b></div></div><div class="rfoot"><small class="muted">● ${esc(r.p[lang][2])}</small><a class="btn ${i === 0 ? "dark" : "soft"}" href="${href("san-pham/" + r.p.slug)}">${i === 0 ? x("Xem & đặt mẫu này", "View & order") + " →" : x("Xem chi tiết", "View details") + " ›"}</a></div></div></article>`).join("")}</div>
  <div class="panel-s"><div class="bq-l"><span class="round">🎨</span><div><b class="serif">${x("Không thấy mẫu nào thật sự ưng ý?", "Nothing feels right?")}</b><p class="muted">${x("Chúng mình có thể móc riêng mẫu độc bản theo ảnh Pinterest hoặc ý tưởng cá nhân của bạn.", "We can crochet a one-of-a-kind piece from your Pinterest photo or idea.")}</p></div></div><a class="btn white" id="customIg" href="${igUrl()}" target="_blank" rel="noopener">${x("Gửi ảnh mẫu của bạn", "Send your reference")} ↗</a></div>
  <div class="row center-row"><button class="btn primary" id="dmBtn">📷 ${x("Nhắn shop trên Instagram về kết quả này", "Message us about this result")}</button><button class="btn white" id="shareBtn">🔗 ${x("Sao chép link kết quả", "Copy result link")}</button><a class="btn white" href="${href("quiz")}">↻ ${x("Làm lại quiz", "Retake quiz")}</a></div>
  <div class="card-box"><div class="rm-head"><b>💬 ${x("TIN NHẮN SOẠN SẴN CHO SHOP", "READY-MADE MESSAGE")}</b><span class="hand muted">${x("nhấn sao chép rồi gửi cho @", "copy and send to @")}${IG()}</span></div><pre class="msgbox" id="sampleMsg"></pre><button class="btn soft" id="copyMsg">⧉ ${x("Sao chép tin nhắn", "Copy message")}</button></div></section>`;
};
function resultMsg(ref, a) {
  const res = recommend(a), top = res.list[0], bud = QUIZ[2].choices[a.budget ?? 3][lang === "vi" ? 1 : 2];
  return x(`Chào tiệm handmadebyhnhi, mình vừa hoàn thành bài quiz gợi ý mẫu len trên website!\nMã kết quả của mình là: ${ref}\n- Ngân sách: ${bud}\n- Mẫu mình thích nhất: ${pName(top.p)}${res.fallback ? "" : ` (Khớp ${top.score}%)`}\nShop tư vấn thêm giúp mình về thời gian hoàn thành và phối màu len với nhé!`,
    `Hi handmadebyhnhi, I just finished the quiz on your website!\nMy result code: ${ref}\n- Budget: ${bud}\n- My favourite pick: ${pName(top.p)}${res.fallback ? "" : ` (${top.score}% match)`}\nCould you advise on timing and colours?`);
}
function wireResult(ref, query) {
  const a = parseA(query); if (!a) return;
  const msg = resultMsg(ref, a); $("#sampleMsg").textContent = msg;
  $("#dmBtn").onclick = () => { messageShop(msg); const ss = store.get("quizSessions", []); const s = ss.find(z => z.ref === ref); if (s) { s.clickedCta = true; store.set("quizSessions", ss); } };
  $("#shareBtn").onclick = async () => { if (await copyText(location.href)) toast(x("Đã sao chép link ✓", "Link copied ✓")); };
  $("#copyCode").onclick = async () => { if (await copyText(ref)) toast(x("Đã sao chép mã " + ref, "Copied " + ref)); };
  $("#copyMsg").onclick = async () => { if (await copyText(msg)) toast(x("Đã sao chép tin nhắn mẫu!", "Message copied!")); };
}

// Đặt hàng
views.checkout = () => {
  const d = store.get("draft"); const p = d && PRODUCTS.find(z => z.slug === d.slug);
  if (!p) return `<section class="section"><p>${x("Chưa có sản phẩm nào để đặt.", "Nothing to order yet.")}</p><a class="btn dark" href="${href("san-pham")}">${x("Chọn sản phẩm", "Choose a product")}</a></section>`;
  const color = YARN_COLORS.find(c => c.id === d.color), size = p.sizes.find(z => z[0] === d.size) || p.sizes[0];
  return `<section class="section checkout"><a class="back" href="${href("san-pham/" + p.slug)}">← ${x("Quay lại Chi tiết sản phẩm", "Back to product")}</a>${eyebrow("may đo riêng từng mũi len 🧶", "made to measure, stitch by stitch 🧶")}<h1 class="serif">${x("Thông tin đặt hàng thủ công", "Your handmade order")}</h1><p class="muted">${x("Mỗi sản phẩm được thợ móc tỉ mỉ bằng tay theo đúng yêu cầu của bạn.", "Each piece is crocheted by hand to your request.")}</p>
  <div class="card-box"><div class="rm-head"><b>🛍 ${x("TÓM TẮT ĐƠN HÀNG", "ORDER SUMMARY")}</b><span class="hand r pill rose-soft">${x("Đơn đan thủ công", "Handmade order")}</span></div>
  <div class="sum-item"><div class="sum-img" style="background:${p.bg}">${p.images ? img(p) : p.emoji}</div><div><h3 class="serif sm">${esc(pName(p))}</h3><small class="muted">${x("Màu", "Colour")}: ${esc(color[lang])} | ${x("Size", "Size")}: ${esc(size[lang === "vi" ? 1 : 2])}${d.text ? ` | ${x("Thêu tên", "Name")}: ‘${esc(d.text)}’` : ""}</small></div></div>
  ${d.note ? `<div class="note-box"><small class="muted">${x("GHI CHÚ THỢ MÓC:", "NOTE:")}</small><p class="hand big-hand">“${esc(d.note)}”</p></div>` : ""}
  <div class="lines"><div><span>${x("Tiền hàng gốc", "Base price")}</span><b>${money(d.base ?? d.unit)}</b></div>${d.sizeFee ? `<div><span>${x("Phụ phí kích thước", "Size surcharge")}</span><b>${(d.sizeFee > 0 ? "" : "−") + money(Math.abs(d.sizeFee))}</b></div>` : ""}${d.nameFee ? `<div><span>${x("Phí thêu tên cá nhân", "Name embroidery")}</span><b>${money(d.nameFee)}</b></div>` : ""}<div><span>${x("Phí ship dự kiến", "Estimated shipping")}</span><b id="shipFee"></b></div><div class="grand"><div><b class="up">${x("Tổng thanh toán", "Total")}</b><small class="hand r">${x("đã bao gồm phí ship", "shipping included")}</small></div><b class="serif" id="grand"></b></div></div></div>
  <form id="coForm" class="card-box form" novalidate><div class="rm-head"><b>🚚 ${x("THÔNG TIN GIAO HÀNG", "DELIVERY DETAILS")}</b></div>
    <label>${x("Họ và tên người nhận", "Recipient name")} <i class="req">*</i><input name="name" autocomplete="name" placeholder="${x("Nhập họ và tên đầy đủ", "Full name")}"><em class="fe"></em></label>
    <label>${x("Số điện thoại nhận hàng", "Phone number")} <i class="req">*</i><input name="phone" inputmode="tel" autocomplete="tel" placeholder="090x xxx xxx"><em class="fe"></em></label>
    <label>${x("Email nhận xác nhận đơn", "Email for confirmation")}<input name="email" type="email" autocomplete="email" placeholder="tenban@example.com"><em class="fe"></em></label>
    <label>${x("Khu vực nhận hàng", "Delivery area")} <i class="req">*</i><select name="zone">${SETTINGS.shipZones.map(z => `<option value="${z.id}">${{ hcm: x("TP. Hồ Chí Minh", "Ho Chi Minh City"), hn: x("Hà Nội", "Hanoi"), other: x("Các tỉnh thành khác", "Other provinces") }[z.id]} (${money(z.fee)})</option>`).join("")}</select></label>
    <label>${x("Địa chỉ chi tiết", "Full address")} <i class="req">*</i><input name="address" autocomplete="street-address" placeholder="${x("Số nhà, tên ngõ/đường, phường/xã, quận/huyện", "Street, ward, district")}"><em class="fe"></em></label>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <p class="warn">⚠️ <b>${x("Lưu ý:", "Note:")}</b> ${x("vì sản phẩm được đan móc theo màu và chữ thêu riêng cho bạn, tiệm không áp dụng chính sách hoàn trả trừ trường hợp có lỗi kỹ thuật từ đường kim mũi chỉ.", "custom-made items are non-returnable unless the fault is ours.")}</p>
    <label class="check"><input type="checkbox" name="agree"> <span>${x("Tôi đã đọc và đồng ý với", "I agree to the")} <a href="${href("chinh-sach/dieu-khoan")}" target="_blank">${x("Điều khoản mua hàng", "terms")}</a> & <a href="${href("chinh-sach/doi-tra")}" target="_blank">${x("Chính sách đổi trả", "return policy")}</a></span></label><em class="fe" id="agreeErr"></em>
    <button class="btn dark big full" type="submit"><span id="subTxt"></span> →</button>
    <p class="center muted sm">${x("Sau khi gửi đơn, bạn gửi trực tiếp sang Instagram của shop để xác nhận và thanh toán nhanh hơn.", "After sending, message the shop on Instagram to confirm and pay faster.")}</p>
    <div class="trust"><span>✓ ${x("100% sợi len Milk Cotton mềm mịn", "100% soft milk cotton")}</span><span>♡ ${x("Đóng gói hộp quà kèm thiệp", "Gift box with a card")}</span></div>
  </form></section>`;
};
function wireCheckout() {
  const f = $("#coForm"); if (!f) return;
  const d = store.get("draft");
  const fee = () => SETTINGS.shipZones.find(z => z.id === f.zone.value).fee;
  const upd = () => { $("#shipFee").textContent = money(fee()); const t = d.unit + fee(); $("#grand").textContent = money(t); $("#subTxt").textContent = `${x("Gửi đơn hàng", "Send order")} (${money(t)})`; };
  f.zone.onchange = upd; upd();
  f.addEventListener("submit", async e => {
    e.preventDefault();
    if (f.website.value) return; // honeypot chống bot
    const v = Object.fromEntries(new FormData(f)); let bad = false;
    const setErr = (name, msg) => { const el = name === "agree" ? $("#agreeErr") : f[name].parentElement.querySelector(".fe"); el.textContent = msg || ""; if (msg) bad = true; };
    setErr("name", v.name.trim() ? "" : x("Vui lòng điền thông tin này", "Please fill this in"));
    setErr("phone", /^(\+?84|0)\d{9}$/.test(v.phone.replace(/[\s.-]/g, "")) ? "" : x("Số điện thoại chưa hợp lệ", "Invalid phone number"));
    setErr("email", !v.email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) ? "" : x("Email chưa hợp lệ", "Invalid email"));
    setErr("address", v.address.trim().length > 8 ? "" : x("Vui lòng điền thông tin này", "Please fill this in"));
    setErr("agree", v.agree ? "" : x("Bạn cần đồng ý điều khoản trước khi gửi đơn", "Please accept the terms before sending"));
    if (bad) return;
    const order = { code: "DH-" + String(Math.floor(100000 + Math.random() * 900000)), status: "pending_payment", at: Date.now(), draft: d, customer: { name: v.name.trim(), phone: v.phone, email: v.email, address: v.address.trim(), zone: v.zone }, shipping: fee(), subtotal: d.unit, total: d.unit + fee(), lang };
    if (REMOTE() && REMOTE_PRODUCTS) {
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true; $("#subTxt").textContent = x("Đang gửi đơn…", "Sending…");
      try {
        const res = await sb("rpc/create_order", { method: "POST", timeout: 10000, body: JSON.stringify({ payload: { item: { slug: d.slug, size: d.size, color: d.color, text: d.text || "", note: d.note || "" }, customer: { name: order.customer.name, phone: order.customer.phone, email: order.customer.email, address: order.customer.address, zone: order.customer.zone }, lang, quiz_ref: (location.hash.match(/KQ-\d+/) || [""])[0] || null } }) });
        Object.assign(order, { code: res.code, subtotal: res.subtotal, shipping: res.shipping, total: res.total });
      } catch (err) { btn.disabled = false; upd(); toast(x("Chưa gửi được đơn, bạn thử lại hoặc nhắn shop qua Instagram nhé.", "Couldn't send the order. Please retry or message us on Instagram.")); console.warn(err); return; }
    }
    const orders = store.get("orders", []); orders.push(order); store.set("orders", orders);
    store.set("draft", null); nav("don-hang/" + order.code);
  });
}
function orderText(o) {
  const p = PRODUCTS.find(z => z.slug === o.draft.slug), c = YARN_COLORS.find(z => z.id === o.draft.color), z = p.sizes.find(s => s[0] === o.draft.size) || p.sizes[0];
  const eta = (() => { const dd = new Date(o.at); dd.setDate(dd.getDate() + p.days + SETTINGS.shipDays); return dd.toLocaleDateString("vi-VN"); })();
  return x(
    `[ĐƠN HÀNG HANDMADEBYHNHI]\n• Mã đơn: ${o.code}\n• Sản phẩm: ${pName(p)}\n• Chi tiết: ${c.vi} | ${z[1]}${o.draft.text ? ` | Thêu tên '${o.draft.text}'` : ""}${o.draft.note ? `\n• Ghi chú: ${o.draft.note}` : ""}\n• Người nhận: ${o.customer.name} - ${o.customer.phone}${o.customer.email ? " - " + o.customer.email : ""}\n• Địa chỉ: ${o.customer.address}\n• Tiền hàng: ${money(o.subtotal)} | Ship: ${money(o.shipping)} | TỔNG CỘNG: ${money(o.total)}\n• Ngày giao dự kiến: ${eta} (sau ${p.days} ngày làm + ${SETTINGS.shipDays} ngày ship)`,
    `[HANDMADEBYHNHI ORDER]\n• Order: ${o.code}\n• Item: ${pName(p)}\n• Details: ${c.en} | ${z[2]}${o.draft.text ? ` | Name '${o.draft.text}'` : ""}${o.draft.note ? `\n• Note: ${o.draft.note}` : ""}\n• Recipient: ${o.customer.name} - ${o.customer.phone}${o.customer.email ? " - " + o.customer.email : ""}\n• Address: ${o.customer.address}\n• Items: ${money(o.subtotal)} | Shipping: ${money(o.shipping)} | TOTAL: ${money(o.total)}\n• Estimated delivery: ${eta} (${p.days} days making + ${SETTINGS.shipDays} days shipping)`);
}
const qrUrl = (b, amount, note) => `https://img.vietqr.io/image/${b.code}-${b.number}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(b.holder)}`;
views.order = code => {
  const o = store.get("orders", []).find(z => z.code === code);
  if (!o) return views.notfound();
  const syn = o.code.replace("-", "") + " " + o.customer.phone.replace(/\s/g, "");
  return `<section class="section checkout"><div class="card-box hero-ok"><div class="heart-o">♡</div><h1 class="serif">${x("Đã ghi nhận đơn hàng 💗", "Order recorded 💗")}</h1><span class="hand r big-hand">${x("Cảm ơn bạn đã ghé tiệm len nhỏ của Nhi", "Thank you for visiting Nhi's little yarn shop")}</span><div class="row center-row"><span class="pill soft-pill">${x("Mã đơn hàng", "Order code")}: <b class="mono primary-t">${esc(o.code)}</b></span><span class="pill rose"><i class="dot"></i>${x("Đang chờ thanh toán", "Awaiting payment")}</span></div><p class="muted">${x("Quét mã QR bên dưới để thanh toán 100% (số tiền và nội dung đã điền sẵn), rồi bấm “Tôi đã chuyển khoản” để báo shop. Shop bắt đầu đan móc ngay khi nhận được tiền.", "Scan the QR below to pay 100% (amount and note are pre-filled), then tap “I've paid”. We start crocheting as soon as payment arrives.")}</p></div>
  <div class="card-box"><div class="rm-head"><div><b>🏦 ${x("Thông tin chuyển khoản", "Bank transfer details")}</b><small class="muted block">${x("Chuyển khoản 100% sau khi shop xác nhận đơn", "Pay 100% after the shop confirms")}</small></div><b class="primary-t">${money(o.total)}</b></div>
  <div class="qr-box"><div class="qr-tabs" role="tablist">${SETTINGS.banks.map((b, i) => `<button type="button" class="qr-tab ${i ? "" : "on"}" data-bank="${i}">${esc(b.bank)}</button>`).join("")}</div><img class="qr-img" id="qrImg" src="${qrUrl(SETTINGS.banks[0], o.total, syn)}" alt="QR"><p class="muted sm center">${x("Mở app ngân hàng → Quét mã QR. Số tiền và nội dung đã điền sẵn, bạn chỉ cần xác nhận.", "Open your banking app → Scan QR. Amount and note are pre-filled; just confirm.")}</p><button class="btn dark full" id="paidBtn">✅ ${x("Tôi đã chuyển khoản – báo shop", "I've paid – notify the shop")}</button></div>
  <div class="banks">${SETTINGS.banks.map(b => `<div class="bank"><div><small class="muted">${x("Ngân hàng", "Bank")}</small><b class="primary-t">${esc(b.bank)}</b></div><div><small class="muted">${x("Số tài khoản", "Account no.")}</small><span><b class="mono">${esc(b.number)}</b> <button class="icon-btn" data-copy="${esc(b.number)}" aria-label="${x("Sao chép", "Copy")}">⧉</button></span></div><div><small class="muted">${x("Chủ tài khoản", "Holder")}</small><b>${esc(b.holder)}</b></div></div>`).join("")}</div>
  <div class="syntax"><span>✎ <b>${x("Cú pháp chuyển khoản:", "Transfer note:")}</b></span><span class="syn"><b class="mono primary-t">${esc(syn)}</b> <button class="icon-btn" data-copy="${esc(syn)}" aria-label="${x("Sao chép", "Copy")}">⧉</button></span></div>
  <p class="muted sm">ⓘ ${x("Đơn bắt đầu thực hiện sau khi tiệm xác nhận nhận tiền. Sau khi gửi bill qua Instagram, Nhi sẽ phản hồi xác nhận ngày giao dự kiến kèm hình ảnh tiến độ.", "Making starts once payment is confirmed. After you send the receipt on Instagram, Nhi will confirm the delivery date and share progress photos.")}</p></div>
  
  <div class="card-box"><div class="rm-head"><b>🧾 ${x("Tóm tắt đơn hàng", "Order summary")}</b><button class="btn soft sm-btn" id="copyOrder">⧉ ${x("Sao chép nội dung đơn", "Copy order")}</button></div><pre class="msgbox">${esc(orderText(o))}</pre><small class="muted">✓ ${x("Họa tiết may tay 100% sợi len Milk Cotton mềm mại", "100% hand-stitched milk cotton")}</small></div>
  <div class="row"><button class="btn primary grow" id="sendIg">📷 ${x("Gửi đơn qua Instagram (Khuyên dùng)", "Send via Instagram (recommended)")}</button><a class="btn white" href="mailto:${SETTINGS.email}?subject=${encodeURIComponent((lang === "vi" ? "[Đơn hàng " : "[Order ") + o.code + "]")}&body=${encodeURIComponent(orderText(o))}">✉ ${x("Gửi qua Email", "Send via email")}</a><a class="btn white" href="${href("")}">⌂ ${x("Về trang chủ", "Home")}</a></div>
  <p class="center muted sm">🌿 ${x("Đóng gói thân thiện môi trường • Tặng kèm túi vải chống bụi", "Eco-friendly packaging • dust bag included")}</p></section>`;
};
function wireOrder(code) {
  const o = store.get("orders", []).find(z => z.code === code); if (!o) return;
  $("#sendIg").onclick = () => messageShop(orderText(o));
  const syn = o.code.replace("-", "") + " " + o.customer.phone.replace(/\s/g, "");
  document.querySelectorAll(".qr-tab").forEach(t => t.onclick = () => { document.querySelectorAll(".qr-tab").forEach(z => z.classList.toggle("on", z === t)); $("#qrImg").src = qrUrl(SETTINGS.banks[+t.dataset.bank], o.total, syn); });
  $("#paidBtn").onclick = () => messageShop(x(`Chào shop, mình đã chuyển khoản đơn ${o.code} số tiền ${money(o.total)}, nội dung "${syn}". Mình gửi bill ở đây ạ!`, `Hi! I've paid order ${o.code} (${money(o.total)}), note "${syn}". Sending the receipt here!`));
  $("#copyOrder").onclick = async () => { if (await copyText(orderText(o))) toast(x("Đã sao chép nội dung đơn ✓", "Order copied ✓")); };
  document.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => { if (await copyText(b.dataset.copy)) toast(x("Đã sao chép ✓", "Copied ✓")); });
}

views.policy = key => {
  const pol = POLICIES[lang][key]; if (!pol) return views.notfound();
  return `<section class="pol-head"><div class="pol-in"><div class="crumbs muted"><a href="${href("")}">⌂ ${x("Trang chủ", "Home")}</a> / ${x("Chính sách & Hỗ trợ", "Policies & Support")}</div><div class="pol-t"><h1 class="serif">${x("Chính sách & Điều khoản tiệm len", "Shop policies & terms")}</h1><span class="hand r hide-m">${x("yêu thương từng mũi móc", "love in every stitch")} 🧶</span></div></div></section>
  <section class="pol"><nav class="tabs" aria-label="Policies">${POLICY_ORDER.map(k => `<a class="${k === key ? "on" : ""}" href="${href("chinh-sach/" + k)}">${POLICIES[lang][k].tab}</a>`).join("")}</nav>
  <div class="draft-bar"><b>${x("Lưu ý quản trị nội dung", "Admin note")}</b><br>⚠️ <b>${x("Bản nháp", "Draft")}</b> – ${x("chủ shop duyệt lại trước khi ra mắt chính thức.", "to be reviewed by the shop owner before launch.")}</div>
  <article class="card-box"><div class="tags"><span class="pill rose">${x("CẬP NHẬT 2026", "UPDATED 2026")}</span><small class="muted">• ${x("Áp dụng toàn quốc", "Nationwide")}</small></div><h2 class="serif">${pol.title}</h2><p class="muted">${esc(pol.intro)}</p>
  <div class="pol-items">${pol.items.map((it, i) => `<div class="pol-item"><div class="pi-h"><span class="num-c">0${i + 1}</span><h3 class="serif sm">${esc(it[0])}</h3></div><p class="muted">${esc(it[1])}</p></div>`).join("")}</div>
  <div class="tip">🎥 <span><b>${x("Mẹo nhỏ gửi bạn:", "Tip:")}</b> ${esc(pol.tip)}</span></div></article>
  <div class="panel-s"><div><span class="hand r">♡ ${x("luôn sẵn lòng lắng nghe bạn", "always happy to listen")}</span><h3 class="serif">${x("Cần trợ giúp riêng cho món len của bạn?", "Need help with your piece?")}</h3><p class="muted">${x("Nhắn tin cho shop qua Instagram", "Message us on Instagram")} <b>@${IG()}</b> ${x("hoặc email để Nhi hỗ trợ bạn chu đáo nhất nhé.", "or email and Nhi will help.")}</p></div><a class="btn primary" href="${igUrl()}" target="_blank" rel="noopener">➤ ${x("Nhắn tin qua Instagram", "Message on Instagram")}</a></div></section>`;
};
views.notfound = () => `<section class="section"><p>${x("Không tìm thấy trang này.", "Page not found.")}</p><a class="btn dark" href="${href("")}">${x("Về trang chủ", "Back to home")}</a></section>`;

// ---------- Khung chung & router ----------
function chrome() {
  document.documentElement.lang = lang;
  document.title = x("handmadebyhnhi – Tiệm len thủ công", "handmadebyhnhi – Handmade crochet");
  $("#logo").href = href("");
  const ico = { "": "🏠", "san-pham": "🛍️", quiz: "✨" };
  const items = [["", x("Trang chủ", "Home")], ["san-pham", x("Sản phẩm", "Shop")], ["quiz", x("Tìm mẫu hợp bạn", "Find my match")]];
  const cur = location.hash.replace(/^#\/(vi|en)\/?/, "").split("/")[0].split("?")[0];
  $("#nav").innerHTML = items.map(([p, l]) => `<a class="${p === cur || (p === "san-pham" && cur === "san-pham") ? "on" : ""}" href="${href(p)}" aria-label="${l}" title="${l}"><span class="ni" aria-hidden="true">${ico[p]}</span><span class="nl">${l}</span></a>`).join("");
  document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
  $("#igChip").href = `https://instagram.com/${IG()}`; $("#igChip").innerHTML = `📷 @${IG()}`;
  $("#footer").innerHTML = `<div class="foot-grid"><div><div class="foot-logo"><b class="serif">handmadebyhnhi</b><span class="hand r">🧶 ${x("tiệm len nhỏ", "little yarn shop")}</span></div><p class="muted">${x("Từng mũi móc được làm thủ công bằng cả tấm lòng. Mang hơi ấm dịu dàng của sợi len vào từng góc nhỏ thường nhật của bạn.", "Every stitch is made by hand with heart, bringing the gentle warmth of yarn to your everyday corners.")}</p><a class="primary-t sm" href="https://instagram.com/${IG()}" target="_blank" rel="noopener">♡ Instagram: @${IG()}</a></div><div><b class="up">${x("Chính sách khách hàng", "Policies")}</b><ul>${POLICY_ORDER.map(k => `<li><a href="${href("chinh-sach/" + k)}">${POLICIES[lang][k].tab === "Đổi trả hàng" ? "Chính sách đổi trả hàng" : POLICIES[lang][k].title}</a></li>`).join("")}</ul></div><div><b class="up">${x("Liên hệ & Hỗ trợ", "Contact")}</b><p class="muted">${x("Nhận đặt may len theo yêu cầu cá nhân hóa.", "Custom crochet orders welcome.")}</p><span class="hand muted">handmade with patience & love</span><p class="muted sm">${x("Thông tin người bán: [địa chỉ & liên hệ – chủ shop cập nhật trước khi ra mắt]", "Seller info: [address & contact – shop owner to update before launch]")}</p></div></div><div class="foot-bot muted sm"><span>© ${new Date().getFullYear()} handmadebyhnhi. All rights reserved.</span><span>${x("Thiết kế dành cho những người yêu len thủ công", "Designed for yarn lovers")} ♡</span></div>`;
  const fab = $("#igFab"); fab.href = igUrl(); fab.innerHTML = `<span aria-hidden="true">💬</span><span class="fl">${x("Nhắn shop trên Instagram", "Message us on Instagram")}</span>`;
}
function route() {
  const raw = location.hash.replace(/^#\/?/, ""), [pathPart, query = ""] = raw.split("?");
  const seg = pathPart.split("/").filter(Boolean);
  if (seg[0] === "vi" || seg[0] === "en") { lang = seg.shift(); store.set("lang", lang); }
  else { lang = store.get("lang", (navigator.language || "vi").startsWith("en") ? "en" : "vi"); return nav(seg.join("/")); }
  chrome();
  const [a, b] = seg; let html, after;
  if (!a) html = views.home();
  else if (a === "san-pham") { html = b ? views.product(b) : views.products(); after = b && (() => wireProduct(b)); }
  else if (a === "quiz") { qState = { i: 0, a: {} }; html = views.quiz(); after = wireQuiz; }
  else if (a === "ket-qua") { html = views.result(b, query); after = () => wireResult(b, query); }
  else if (a === "dat-hang") { html = views.checkout(); after = wireCheckout; }
  else if (a === "don-hang") { html = views.order(b); after = () => wireOrder(b); }
  else if (a === "chinh-sach") html = views.policy(b || "doi-tra");
  else html = views.notfound();
  $("#view").innerHTML = html; after && after();
  document.querySelectorAll(".faq details").forEach(dt => dt.addEventListener("toggle", () => { if (dt.open) document.querySelectorAll(".faq details").forEach(o => { if (o !== dt) o.open = false; }); }));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".lang button").forEach(b => b.onclick = () => {
  const cur = location.hash.replace(/^#\/(vi|en)/, ""); lang = b.dataset.lang; location.hash = `#/${lang}${cur}`;
});
addEventListener("hashchange", route);
loadRemote().finally(route);
