// handmadebyhnhi – ứng dụng một trang (router theo hash), song ngữ VI/EN. Dữ liệu ở data.js.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => Math.round(n).toLocaleString("vi-VN") + "₫";
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
let lang = "vi";

// ---------- Chuỗi giao diện ----------
const T = {
  vi: {
    nav: [["", "Trang chủ"], ["san-pham", "Sản phẩm"], ["quiz", "Tìm mẫu hợp bạn"]],
    heroTitle: "Món đồ móc dành riêng cho bạn",
    heroText: "Trả lời 7 câu hỏi ngắn, chúng mình gợi ý ngay mẫu móc handmade hợp với người nhận, dịp tặng và ngân sách của bạn.",
    cta: "Tìm mẫu hợp với bạn", featured: "Bộ sưu tập nổi bật", all: "Xem tất cả sản phẩm",
    stepsTitle: "Đặt hàng chỉ 4 bước",
    steps: [["Làm quiz", "Trả lời vài câu hỏi ngắn."], ["Chọn mẫu", "Xem gợi ý và chọn màu, kích thước, lời nhắn."], ["Gửi đơn", "Điền thông tin nhận hàng và gửi đơn."], ["Shop làm & giao", "Mỗi món được móc tay, rồi gửi tận nơi."]],
    storyTitle: "Câu chuyện của shop",
    story: "handmadebyhnhi bắt đầu từ một cuộn len nhỏ và niềm đam mê móc. Mỗi sản phẩm đều làm thủ công, dùng sợi cotton milk mềm, an toàn cho da. Bạn có thể đổi màu, đổi kích thước hoặc thêu tên/lời nhắn riêng.",
    faqTitle: "Câu hỏi thường gặp",
    faq: [["Một món làm mất bao lâu?", "Từ 3 đến 8 ngày tuỳ mẫu, cộng khoảng 3 ngày giao hàng. Ngày dự kiến hiển thị ngay trên trang sản phẩm."],
          ["Giặt và bảo quản thế nào?", "Giặt tay nhẹ với nước mát, không vắt mạnh, phơi bóng râm. Mỗi sản phẩm có hướng dẫn riêng."],
          ["Có đổi trả không?", "Sản phẩm cá nhân hoá (đổi màu, thêu tên) không đổi trả trừ khi lỗi do shop hoặc hư hỏng khi giao. Xem trang chính sách."],
          ["Phí ship bao nhiêu?", "Theo khu vực nhận hàng, hiển thị rõ trước khi gửi đơn."]],
    products: "Sản phẩm", notReady: "ảnh sắp cập nhật", from: "từ", days: "ngày làm",
    back: "Quay lại", next: "Tiếp", seeResult: "Xem gợi ý", question: "Câu", of: "/",
    notUrgent: "Không gấp", pickDate: "Chọn ngày", pickAtLeast: "Hãy chọn một đáp án", maxPick: "Chọn tối đa 2",
    resultTitle: "Gợi ý dành cho bạn", ref: "Mã kết quả", match: "Độ phù hợp",
    noMatch: "Chưa có mẫu nào khớp hoàn toàn với lựa chọn của bạn. Đây là mẫu gần nhất – bạn cũng có thể nhắn shop để đặt làm riêng nhé!",
    retake: "Làm lại quiz", viewItem: "Xem & đặt mẫu này", dm: "Nhắn shop trên Instagram", dmCopied: "Đã sao chép tin nhắn mẫu – dán vào hộp thoại Instagram nhé 💌",
    dmFallback: "Không sao chép tự động được. Hãy sao chép đoạn tin dưới đây rồi gửi cho shop:",
    shareLink: "Sao chép link kết quả", linkCopied: "Đã sao chép link ✓",
    yarnColor: "Màu len", size: "Kích thước", engrave: "Tên / lời nhắn thêu", engravePh: "Tối đa 20 ký tự", note: "Ghi chú thêm", notePh: "Ví dụ: muốn tông hồng đậm hơn…",
    specs: "Thông tin", total: "Tạm tính", etaLabel: "Dự kiến giao", orderNow: "Đặt ngay", noReturn: "Lưu ý: sản phẩm cá nhân hoá (đổi màu, thêu tên) không đổi trả, trừ khi lỗi do shop hoặc hư hỏng khi giao.",
    checkout: "Đặt hàng", item: "Sản phẩm", subtotal: "Tiền hàng", shipping: "Phí ship", grand: "Tổng cộng",
    fName: "Họ tên", fPhone: "Số điện thoại", fEmail: "Email", fProvince: "Khu vực nhận hàng", fAddress: "Địa chỉ chi tiết (số nhà, phường/xã, quận/huyện, tỉnh/thành)",
    zones: { hcm: "TP. Hồ Chí Minh", hn: "Hà Nội", other: "Tỉnh/thành khác" },
    agree: "Tôi đã đọc và đồng ý với", terms: "điều khoản", and: "và", returns: "chính sách đổi trả",
    place: "Gửi đơn hàng", emptyCart: "Chưa có sản phẩm nào để đặt.", pickOne: "Chọn sản phẩm",
    phoneErr: "Số điện thoại chưa hợp lệ", emailErr: "Email chưa hợp lệ", required: "Vui lòng điền thông tin này", agreeErr: "Bạn cần đồng ý điều khoản trước khi gửi đơn",
    doneTitle: "Đã ghi nhận đơn hàng 💗", orderCode: "Mã đơn",
    doneText: "Bước tiếp theo: gửi đơn cho shop qua Instagram hoặc email. Shop sẽ xác nhận và gửi mã QR/thông tin chuyển khoản để bạn thanh toán 100%; đơn được bắt đầu làm sau khi nhận thanh toán.",
    sendIg: "Gửi đơn qua Instagram", sendMail: "Gửi đơn qua email", home: "Về trang chủ",
    footLegal: "Thông tin người bán: handmadebyhnhi · [Địa chỉ & liên hệ – chủ shop cập nhật trước khi ra mắt]",
    policies: "Chính sách", draftTag: "Bản nháp – chủ shop duyệt lại trước khi ra mắt chính thức",
    sampleBanner: "Đang chạy thử: sản phẩm và giá là dữ liệu mẫu.",
    notFound: "Không tìm thấy trang này.",
    reasonGift: (occ, rec) => `Hợp làm quà ${occ ? occ + " " : ""}${rec ? "cho " + rec : ""}`.trim(),
    reasonStyle: s => `phong cách ${s} như bạn chọn`, reasonPalette: p => `tông ${p}`, reasonPers: p => `đúng nhu cầu “${p}”`,
    reasonOnly: "Một lựa chọn gần với nhu cầu của bạn",
  },
  en: {
    nav: [["", "Home"], ["san-pham", "Shop"], ["quiz", "Find my match"]],
    heroTitle: "A crochet piece made just for you",
    heroText: "Answer 7 short questions and we'll suggest handmade crochet pieces that fit the recipient, the occasion and your budget.",
    cta: "Find my match", featured: "Featured collection", all: "See all products",
    stepsTitle: "Order in 4 steps",
    steps: [["Take the quiz", "Answer a few quick questions."], ["Pick a piece", "See suggestions, then choose colour, size and message."], ["Send your order", "Add delivery details and send."], ["We make & ship", "Every piece is hand-crocheted, then shipped."]],
    storyTitle: "Our story",
    story: "handmadebyhnhi began with one small ball of yarn and a love of crochet. Every piece is made by hand with soft, skin-friendly milk cotton. You can change the colour and size, or add an embroidered name or message.",
    faqTitle: "FAQ",
    faq: [["How long does it take?", "3 to 8 days depending on the piece, plus about 3 days for delivery. The estimated date is shown on each product page."],
          ["How do I wash it?", "Hand wash gently in cool water, don't wring, dry in the shade. Each product has its own care notes."],
          ["Can I return it?", "Personalised items (custom colour, embroidery) are not returnable unless the fault is ours or damaged in transit. See the policy page."],
          ["How much is shipping?", "It depends on your delivery area and is shown before you send your order."]],
    products: "Shop", notReady: "photo coming soon", from: "from", days: "days to make",
    back: "Back", next: "Next", seeResult: "See my picks", question: "Question", of: "/",
    notUrgent: "No rush", pickDate: "Pick a date", pickAtLeast: "Please pick an answer", maxPick: "Pick up to 2",
    resultTitle: "Picks for you", ref: "Result code", match: "Match",
    noMatch: "Nothing matches all your answers exactly. Here's the closest piece – or message us to make something custom!",
    retake: "Retake quiz", viewItem: "View & order", dm: "Message us on Instagram", dmCopied: "Sample message copied – paste it into Instagram 💌",
    dmFallback: "Couldn't copy automatically. Please copy this message and send it to us:",
    shareLink: "Copy result link", linkCopied: "Link copied ✓",
    yarnColor: "Yarn colour", size: "Size", engrave: "Embroidered name / message", engravePh: "Up to 20 characters", note: "Extra notes", notePh: "e.g. I'd like a deeper pink…",
    specs: "Details", total: "Subtotal", etaLabel: "Estimated delivery", orderNow: "Order now", noReturn: "Note: personalised items (custom colour, embroidery) are non-returnable unless the fault is ours or damaged in transit.",
    checkout: "Checkout", item: "Item", subtotal: "Items", shipping: "Shipping", grand: "Total",
    fName: "Full name", fPhone: "Phone number", fEmail: "Email", fProvince: "Delivery area", fAddress: "Full address (street, ward, district, province/city)",
    zones: { hcm: "Ho Chi Minh City", hn: "Hanoi", other: "Other provinces" },
    agree: "I have read and agree to the", terms: "terms", and: "and", returns: "return policy",
    place: "Send order", emptyCart: "Nothing to order yet.", pickOne: "Choose a product",
    phoneErr: "Invalid phone number", emailErr: "Invalid email", required: "Please fill this in", agreeErr: "Please accept the terms before sending",
    doneTitle: "Order recorded 💗", orderCode: "Order code",
    doneText: "Next step: send your order to us via Instagram or email. We'll confirm and send a QR / bank-transfer detail for 100% payment; making starts once payment is received.",
    sendIg: "Send via Instagram", sendMail: "Send via email", home: "Back to home",
    footLegal: "Seller: handmadebyhnhi · [Address & contact – shop owner to update before launch]",
    policies: "Policies", draftTag: "Draft – to be reviewed by the shop owner before launch",
    sampleBanner: "Preview mode: products and prices are sample data.",
    notFound: "Page not found.",
    reasonGift: (occ, rec) => `A great ${occ ? occ + " " : ""}gift${rec ? " for " + rec : ""}`,
    reasonStyle: s => `${s} style, as you chose`, reasonPalette: p => `${p} tones`, reasonPers: p => `fits your “${p}” wish`,
    reasonOnly: "A close fit for what you need",
  },
};
const POLICIES = {
  vi: {
    "doi-tra": ["Chính sách đổi trả", ["Sản phẩm cá nhân hoá (đổi màu, thêu tên/lời nhắn) không đổi trả, trừ khi lỗi do shop hoặc hư hỏng khi giao.", "Mẫu có sẵn không cá nhân hoá: [số ngày được đổi – chủ shop xác nhận].", "Hủy đơn: được hủy và hoàn tiền khi đơn chưa chuyển sang trạng thái “đang làm”; sau đó không hoàn."]],
    "van-chuyen": ["Chính sách vận chuyển", ["Thời gian nhận hàng = thời gian làm (tuỳ mẫu) + khoảng 3 ngày giao.", "Phí ship tính theo khu vực nhận hàng, hiển thị trước khi gửi đơn.", "Trách nhiệm khi bưu kiện thất lạc: [chủ shop xác nhận theo đơn vị vận chuyển]."]],
    "bao-mat": ["Chính sách bảo mật", ["Chúng mình thu thập: họ tên, số điện thoại, email, địa chỉ và câu trả lời quiz – chỉ để tư vấn và xử lý đơn hàng.", "Thời gian lưu: [chủ shop xác nhận]. Bạn có thể yêu cầu xóa dữ liệu bất cứ lúc nào qua Instagram hoặc email của shop.", "Bản chạy thử này lưu dữ liệu ngay trên trình duyệt của bạn, không gửi lên máy chủ."]],
    "dieu-khoan": ["Điều khoản sử dụng", ["Thanh toán 100% khi đặt; đơn được giữ 30 phút để thanh toán sau khi shop gửi thông tin chuyển khoản.", "Màu len thực tế có thể lệch nhẹ so với màn hình; mỗi sản phẩm handmade có sai khác nhỏ là bình thường.", "Bằng việc đặt hàng, bạn đồng ý với các chính sách đổi trả, vận chuyển và bảo mật của shop."]],
  },
  en: {
    "doi-tra": ["Return policy", ["Personalised items (custom colour, embroidered name/message) are non-returnable unless the fault is ours or damaged in transit.", "Ready-made, non-personalised items: [return window – to be confirmed by the shop].", "Cancellation: allowed with refund before the order reaches “in progress”; not refundable afterwards."]],
    "van-chuyen": ["Shipping policy", ["Delivery time = making time (varies by piece) + about 3 days shipping.", "Shipping fees depend on your delivery area and are shown before you send your order.", "Lost parcels: [to be confirmed by the shop with the carrier]."]],
    "bao-mat": ["Privacy policy", ["We collect your name, phone, email, address and quiz answers – only to advise you and process your order.", "Retention period: [to be confirmed by the shop]. You can ask us to delete your data any time via Instagram or email.", "This preview stores data in your own browser only and does not send it to a server."]],
    "dieu-khoan": ["Terms of use", ["100% payment at order; your order is held for 30 minutes for payment after we send the transfer details.", "Actual yarn colour may differ slightly from your screen; small variations are normal for handmade pieces.", "By ordering you agree to our return, shipping and privacy policies."]],
  },
};

const t = () => T[lang];
const L = o => (lang === "vi" ? 0 : 1);
const tagLabel = (g, k) => TAGS[g][k][L()];

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
  const cmp = (x, y) => y.score - x.score || (y.p.featured - x.p.featured) || (budget - minPrice(x.p)) - (budget - minPrice(y.p)) ;
  const good = pass.filter(r => r.score >= SETTINGS.minScore).sort(cmp).slice(0, 3);
  if (good.length) return { list: good, fallback: false };
  // Không mẫu nào đạt ngưỡng: lấy mẫu gần nhất (QZ-05)
  const near = (pass.length ? pass.sort(cmp) : rows.sort((x, y) => minPrice(x.p) - minPrice(y.p)))[0];
  return { list: [near], fallback: true };
}
function reasonFor(r, a) {
  const h = r.hits, s = t();
  const rec = h.recipient && tagLabel("recipient", h.recipient[0]);
  const occ = h.occasion && tagLabel("occasion", h.occasion[0]);
  const parts = [];
  if (rec || occ) parts.push(s.reasonGift(occ, rec));
  if (h.style) parts.push(s.reasonStyle(h.style.map(k => tagLabel("style", k)).join(" / ")));
  if (h.palette) parts.push(s.reasonPalette(tagLabel("palette", h.palette[0])));
  if (h.personalization) parts.push(s.reasonPers(tagLabel("personalization", h.personalization[0])));
  if (!parts.length) return s.reasonOnly;
  const txt = parts.join(", ");
  return txt.charAt(0).toUpperCase() + txt.slice(1) + ".";
}

// ---------- Tiện ích ----------
const pName = p => p[lang][0];
const etaDate = p => { const d = new Date(); d.setDate(d.getDate() + p.days + SETTINGS.shipDays); return d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB"); };
function thumb(p, big) {
  return `<div class="thumb${big ? " big" : ""}" style="background:${p.bg}"><span class="emo">${p.emoji}</span><small>${t().notReady}</small></div>`;
}
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2800);
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch (e) {}
  try { const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (e) { return false; }
}
const igUrl = () => `https://ig.me/m/${SETTINGS.instagram}`;
// IG-02: sao chép tin mẫu rồi mở Instagram; nếu không sao chép được thì hiện tin để khách tự chép (T-12)
async function messageShop(text) {
  const ok = await copyText(text);
  if (ok) { toast(t().dmCopied); window.open(igUrl(), "_blank", "noopener"); return; }
  const box = document.createElement("div"); box.className = "modal";
  box.innerHTML = `<div class="modal-in"><p>${esc(t().dmFallback)}</p><textarea readonly rows="5">${esc(text)}</textarea><p><a class="btn" href="${igUrl()}" target="_blank" rel="noopener">${esc(t().dm)}</a> <button class="btn ghost" id="mClose">✕</button></p></div>`;
  document.body.appendChild(box); box.querySelector("textarea").select();
  box.querySelector("#mClose").onclick = () => box.remove();
}
const nav = (path) => { location.hash = `#/${lang}${path ? "/" + path : ""}`; };
const href = path => `#/${lang}${path ? "/" + path : ""}`;
const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const unb64 = s => JSON.parse(decodeURIComponent(escape(atob(s))));

// ---------- Màn hình ----------
const views = {};

views.home = () => {
  const s = t(), feat = PRODUCTS.filter(p => p.featured).slice(0, 8);
  return `
  <section class="hero"><div><h1>${s.heroTitle}</h1><p>${s.heroText}</p><a class="btn big" href="${href("quiz")}">${s.cta} →</a></div><div class="hero-art" aria-hidden="true">🧶</div></section>
  <section class="section"><h2>${s.featured}</h2><div class="grid">${feat.map(card).join("")}</div><p class="center"><a class="btn ghost" href="${href("san-pham")}">${s.all}</a></p></section>
  <section class="section alt"><h2>${s.stepsTitle}</h2><ol class="steps">${s.steps.map(([a, b], i) => `<li><span class="n">${i + 1}</span><b>${a}</b><p>${b}</p></li>`).join("")}</ol></section>
  <section class="section"><h2>${s.storyTitle}</h2><p class="prose">${s.story}</p></section>
  <section class="section alt"><h2>${s.faqTitle}</h2>${s.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</section>`;
};
const card = p => `<a class="card" href="${href("san-pham/" + p.slug)}">${thumb(p)}<div class="card-body"><h3>${esc(pName(p))}</h3><p>${esc(p[lang][1])}</p><div class="meta"><span class="price">${t().from} ${money(minPrice(p))}</span><span class="muted">${p.days} ${t().days}</span></div></div></a>`;

views.products = () => `<section class="section"><h1>${t().products}</h1><p class="muted banner">${t().sampleBanner}</p><div class="grid">${PRODUCTS.map(card).join("")}</div></section>`;

views.product = slug => {
  const p = PRODUCTS.find(x => x.slug === slug); if (!p) return views.notfound();
  const s = t();
  const draft = store.get("draft", {}); const d = draft.slug === slug ? draft : {};
  return `<section class="section detail"><a class="muted" href="${href("san-pham")}">← ${s.products}</a>
  <div class="detail-grid">
    ${thumb(p, true)}
    <div><h1>${esc(pName(p))}</h1><p>${esc(p[lang][1])}</p><p class="muted">${esc(p[lang][2])}</p>
      <form id="optForm" class="form" novalidate>
        <fieldset><legend>${s.yarnColor}</legend><div class="swatches">${YARN_COLORS.map((c, i) => `<label title="${esc(c[lang])}"><input type="radio" name="color" value="${c.id}" ${(d.color || "pink") === c.id ? "checked" : ""}><span style="background:${c.hex}"></span></label>`).join("")}</div><small id="colorName" class="muted"></small></fieldset>
        ${p.sizes.length > 1 ? `<label>${s.size}<select name="size">${p.sizes.map(z => `<option value="${z[0]}" ${d.size === z[0] ? "selected" : ""}>${z[lang === "vi" ? 1 : 2]}${z[3] ? " (" + (z[3] > 0 ? "+" : "−") + money(Math.abs(z[3])) + ")" : ""}</option>`).join("")}</select></label>` : `<input type="hidden" name="size" value="${p.sizes[0][0]}">`}
        ${p.nameFee ? `<label>${s.engrave} (+${money(p.nameFee)})<input name="text" maxlength="20" placeholder="${s.engravePh}" value="${esc(d.text || "")}"></label>` : ""}
        <label>${s.note}<textarea name="note" rows="2" placeholder="${s.notePh}">${esc(d.note || "")}</textarea></label>
        <div class="total-row"><span>${s.total}</span><strong id="liveTotal"></strong></div>
        <p class="muted">${s.etaLabel}: <b>${etaDate(p)}</b></p>
        <p class="warn">${s.noReturn}</p>
        <button class="btn big" type="submit">${s.orderNow}</button>
        <button class="btn ghost" type="button" id="askIg">${s.dm}</button>
      </form></div></div></section>`;
};
function wireProduct(slug) {
  const p = PRODUCTS.find(x => x.slug === slug); if (!p) return;
  const f = $("#optForm");
  const read = () => {
    const v = Object.fromEntries(new FormData(f)); v.slug = slug;
    const size = p.sizes.find(z => z[0] === v.size) || p.sizes[0];
    v.unit = p.price + size[3] + (p.nameFee && v.text && v.text.trim() ? p.nameFee : 0);
    return v;
  };
  const upd = () => { const v = read(); $("#liveTotal").textContent = money(v.unit); const c = YARN_COLORS.find(c => c.id === v.color); $("#colorName").textContent = c ? c[lang] : ""; };
  f.addEventListener("input", upd); upd();
  f.addEventListener("submit", e => { e.preventDefault(); store.set("draft", read()); nav("dat-hang"); });
  $("#askIg").onclick = () => { const v = read(); const c = YARN_COLORS.find(c => c.id === v.color); messageShop(lang === "vi" ? `Chào shop, mình quan tâm mẫu "${pName(p)}", màu ${c[lang]}. Shop tư vấn giúp mình nhé!` : `Hi! I'm interested in "${pName(p)}" in ${c[lang]}. Could you advise me?`); };
}

// Quiz
let qState = { i: 0, a: {} };
views.quiz = () => {
  const s = t(), q = QUIZ[qState.i], a = qState.a, total = QUIZ.length;
  let body = "";
  if (q.kind === "single" || q.kind === "multi") {
    const keys = Object.keys(TAGS[q.group]); const cur = [].concat(a[q.group] || []);
    body = `<div class="choices">${keys.map(k => `<button type="button" class="choice ${cur.includes(k) ? "on" : ""}" data-k="${k}">${tagLabel(q.group, k)}</button>`).join("")}</div>${q.kind === "multi" ? `<p class="muted">${s.maxPick}</p>` : ""}`;
  } else if (q.kind === "budget") {
    body = `<div class="choices">${q.choices.map((c, i) => `<button type="button" class="choice ${a.budget === i ? "on" : ""}" data-k="${i}">${c[lang === "vi" ? 1 : 2]}</button>`).join("")}</div>`;
  } else {
    const min = new Date().toISOString().slice(0, 10);
    body = `<div class="choices"><button type="button" class="choice ${a.date === "" ? "on" : ""}" data-k="none">${s.notUrgent}</button></div><label class="dateq">${s.pickDate}<input type="date" id="dateIn" min="${min}" value="${a.date || ""}"></label>`;
  }
  const last = qState.i === total - 1;
  return `<section class="section quiz"><div class="bar"><i style="width:${(qState.i / total) * 100}%"></i></div>
    <p class="muted">${s.question} ${qState.i + 1} ${s.of} ${total}</p><h1>${q[lang]}</h1>${body}<p id="qErr" class="err" role="alert"></p>
    <div class="row">${qState.i ? `<button class="btn ghost" id="qBack">← ${s.back}</button>` : ""}<button class="btn" id="qNext">${last ? s.seeResult : s.next} →</button></div></section>`;
};
function wireQuiz() {
  const q = QUIZ[qState.i], a = qState.a;
  document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (q.kind === "single") a[q.group] = k;
    else if (q.kind === "multi") { let c = [].concat(a[q.group] || []); c = c.includes(k) ? c.filter(x => x !== k) : [...c, k]; if (c.length > q.max) c = c.slice(-q.max); a[q.group] = c; }
    else if (q.kind === "budget") a.budget = +k;
    else a.date = "";
    $("#view").innerHTML = views.quiz(); wireQuiz();
  });
  const di = $("#dateIn"); if (di) di.onchange = () => { a.date = di.value; $("#view").innerHTML = views.quiz(); wireQuiz(); };
  const bk = $("#qBack"); if (bk) bk.onclick = () => { qState.i--; $("#view").innerHTML = views.quiz(); wireQuiz(); };
  $("#qNext").onclick = () => {
    const answered = q.kind === "budget" ? a.budget !== undefined : q.kind === "date" ? a.date !== undefined : [].concat(a[q.group] || []).length > 0;
    if (!answered) { $("#qErr").textContent = t().pickAtLeast; return; }
    if (qState.i < QUIZ.length - 1) { qState.i++; $("#view").innerHTML = views.quiz(); wireQuiz(); window.scrollTo(0, 0); return; }
    const ref = "KQ-" + String(Math.floor(1000 + Math.random() * 9000));
    const sessions = store.get("quizSessions", []); sessions.push({ ref, answers: a, lang, at: Date.now() }); store.set("quizSessions", sessions.slice(-50));
    location.hash = `#/${lang}/ket-qua/${ref}?a=${encodeURIComponent(b64(a))}`;
  };
}

views.result = (ref, query) => {
  let a; try { a = unb64(new URLSearchParams(query).get("a")); } catch (e) {}
  if (!a) return `<section class="section"><p>${t().notFound}</p><a class="btn" href="${href("quiz")}">${t().retake}</a></section>`;
  const s = t(), res = recommend(a);
  return `<section class="section"><h1>${s.resultTitle}</h1><p class="muted">${s.ref}: <b>${esc(ref)}</b></p>
    ${res.fallback ? `<p class="banner">${s.noMatch}</p>` : ""}
    <div class="results">${res.list.map(r => `<article class="card wide">${thumb(r.p)}<div class="card-body"><h3>${esc(pName(r.p))}</h3>${res.fallback ? "" : `<span class="badge">${s.match} ${r.score}%</span>`}<p>${res.fallback ? esc(r.p[lang][1]) : esc(reasonFor(r, a))}</p><div class="meta"><span class="price">${s.from} ${money(minPrice(r.p))}</span><span class="muted">${r.p.days} ${s.days}</span></div><a class="btn" href="${href("san-pham/" + r.p.slug)}">${s.viewItem}</a></div></article>`).join("")}</div>
    <div class="row"><button class="btn" id="dmBtn">${s.dm}</button><button class="btn ghost" id="shareBtn">${s.shareLink}</button><a class="btn ghost" href="${href("quiz")}">${s.retake}</a></div></section>`;
};
function wireResult(ref, query) {
  let a; try { a = unb64(new URLSearchParams(query).get("a")); } catch (e) { return; }
  const res = recommend(a), top = res.list[0];
  const budgetTxt = QUIZ[2].choices[a.budget ?? 3][lang === "vi" ? 1 : 2];
  const msg = lang === "vi"
    ? `Chào shop, mình vừa làm quiz (${ref}), shop gợi ý ${pName(top.p)}. Ngân sách của mình: ${budgetTxt}. Mình muốn được tư vấn thêm ạ.`
    : `Hi! I just took the quiz (${ref}) and you suggested ${pName(top.p)}. My budget: ${budgetTxt}. I'd love some advice.`;
  $("#dmBtn").onclick = () => { messageShop(msg); const ss = store.get("quizSessions", []); const x = ss.find(z => z.ref === ref); if (x) { x.clickedCta = true; store.set("quizSessions", ss); } };
  $("#shareBtn").onclick = async () => { if (await copyText(location.href)) toast(t().linkCopied); };
}

// Đặt hàng
views.checkout = () => {
  const s = t(), d = store.get("draft"); const p = d && PRODUCTS.find(x => x.slug === d.slug);
  if (!p) return `<section class="section"><p>${s.emptyCart}</p><a class="btn" href="${href("san-pham")}">${s.pickOne}</a></section>`;
  const color = YARN_COLORS.find(c => c.id === d.color), size = p.sizes.find(z => z[0] === d.size) || p.sizes[0];
  return `<section class="section checkout"><h1>${s.checkout}</h1>
  <div class="summary"><b>${esc(pName(p))}</b><br><small class="muted">${esc(color[lang])} · ${esc(size[lang === "vi" ? 1 : 2])}${d.text ? " · “" + esc(d.text) + "”" : ""}${d.note ? "<br>" + esc(d.note) : ""}</small><div class="total-row"><span>${s.subtotal}</span><strong>${money(d.unit)}</strong></div>
  <div class="total-row"><span>${s.shipping}</span><strong id="shipFee"></strong></div><div class="total-row grand"><span>${s.grand}</span><strong id="grand"></strong></div></div>
  <form id="coForm" class="form" novalidate>
    <label>${s.fName}<input name="name" autocomplete="name"><em class="fe"></em></label>
    <label>${s.fPhone}<input name="phone" inputmode="tel" autocomplete="tel"><em class="fe"></em></label>
    <label>${s.fEmail}<input name="email" type="email" autocomplete="email"><em class="fe"></em></label>
    <label>${s.fProvince}<select name="zone">${SETTINGS.shipZones.map(z => `<option value="${z.id}">${s.zones[z.id]} (${money(z.fee)})</option>`).join("")}</select></label>
    <label>${s.fAddress}<textarea name="address" rows="2" autocomplete="street-address"></textarea><em class="fe"></em></label>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="check"><input type="checkbox" name="agree"> <span>${s.agree} <a href="${href("chinh-sach/dieu-khoan")}" target="_blank">${s.terms}</a> ${s.and} <a href="${href("chinh-sach/doi-tra")}" target="_blank">${s.returns}</a></span></label><em class="fe" id="agreeErr"></em>
    <p class="warn">${s.noReturn}</p>
    <button class="btn big" type="submit">${s.place}</button>
  </form></section>`;
};
function wireCheckout() {
  const f = $("#coForm"); if (!f) return;
  const d = store.get("draft"), s = t();
  const fee = () => SETTINGS.shipZones.find(z => z.id === f.zone.value).fee;
  const upd = () => { $("#shipFee").textContent = money(fee()); $("#grand").textContent = money(d.unit + fee()); };
  f.zone.onchange = upd; upd();
  f.addEventListener("submit", e => {
    e.preventDefault();
    if (f.website.value) return; // honeypot chống bot
    const v = Object.fromEntries(new FormData(f)); let bad = false;
    const setErr = (name, msg) => { const el = name === "agree" ? $("#agreeErr") : f[name].parentElement.querySelector(".fe"); el.textContent = msg || ""; if (msg) bad = true; };
    setErr("name", v.name.trim() ? "" : s.required);
    setErr("phone", /^(\+?84|0)\d{9}$/.test(v.phone.replace(/[\s.-]/g, "")) ? "" : s.phoneErr);
    setErr("email", /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) ? "" : s.emailErr);
    setErr("address", v.address.trim().length > 8 ? "" : s.required);
    setErr("agree", v.agree ? "" : s.agreeErr);
    if (bad) return;
    const p = PRODUCTS.find(x => x.slug === d.slug);
    const order = { code: "DH-" + String(Math.floor(100000 + Math.random() * 900000)), status: "pending_payment", at: Date.now(), draft: d, customer: { name: v.name.trim(), phone: v.phone, email: v.email, address: v.address.trim(), zone: v.zone }, shipping: fee(), subtotal: d.unit, total: d.unit + fee(), lang };
    const orders = store.get("orders", []); orders.push(order); store.set("orders", orders);
    store.set("draft", null); store.set("lastOrder", order);
    nav("don-hang/" + order.code);
  });
}
function orderText(o) {
  const p = PRODUCTS.find(x => x.slug === o.draft.slug), c = YARN_COLORS.find(x => x.id === o.draft.color), z = p.sizes.find(x => x[0] === o.draft.size) || p.sizes[0];
  const vi = lang === "vi";
  return [`${vi ? "Đơn hàng" : "Order"} ${o.code}`, `${pName(p)} – ${c[lang]} – ${z[vi ? 1 : 2]}${o.draft.text ? ` – “${o.draft.text}”` : ""}`, o.draft.note ? `${vi ? "Ghi chú" : "Note"}: ${o.draft.note}` : "",
    `${vi ? "Tiền hàng" : "Items"}: ${money(o.subtotal)} · ${vi ? "Ship" : "Shipping"}: ${money(o.shipping)} · ${vi ? "Tổng" : "Total"}: ${money(o.total)}`,
    `${vi ? "Người nhận" : "Recipient"}: ${o.customer.name} – ${o.customer.phone} – ${o.customer.email}`, `${vi ? "Địa chỉ" : "Address"}: ${o.customer.address}`].filter(Boolean).join("\n");
}
views.order = code => {
  const o = store.get("orders", []).find(x => x.code === code); const s = t();
  if (!o) return views.notfound();
  return `<section class="section checkout"><h1>${s.doneTitle}</h1><p>${s.orderCode}: <b>${esc(o.code)}</b></p><p class="prose">${s.doneText}</p><pre class="order">${esc(orderText(o))}</pre>
    <div class="row"><button class="btn" id="sendIg">${s.sendIg}</button><a class="btn ghost" href="mailto:${SETTINGS.email}?subject=${encodeURIComponent((lang === "vi" ? "Đơn hàng " : "Order ") + o.code)}&body=${encodeURIComponent(orderText(o))}">${s.sendMail}</a><a class="btn ghost" href="${href("")}">${s.home}</a></div></section>`;
};
function wireOrder(code) { const o = store.get("orders", []).find(x => x.code === code); const b = $("#sendIg"); if (o && b) b.onclick = () => messageShop(orderText(o)); }

views.policy = key => {
  const pol = POLICIES[lang][key]; if (!pol) return views.notfound();
  return `<section class="section"><h1>${pol[0]}</h1><p class="banner">${t().draftTag}</p><ul class="prose">${pol[1].map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>`;
};
views.notfound = () => `<section class="section"><p>${t().notFound}</p><a class="btn" href="${href("")}">${t().home}</a></section>`;

// ---------- Router ----------
function chrome() {
  const s = t();
  document.documentElement.lang = lang;
  document.title = lang === "vi" ? "handmadebyhnhi – Đồ móc handmade" : "handmadebyhnhi – Handmade crochet";
  $("#logo").href = href("");
  $("#nav").innerHTML = s.nav.map(([p, l]) => `<a href="${href(p)}">${l}</a>`).join("");
  document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
  const pol = POLICIES[lang];
  $("#footer").innerHTML = `<div>${s.footLegal}</div><div class="links">${Object.entries(pol).map(([k, v]) => `<a href="${href("chinh-sach/" + k)}">${v[0]}</a>`).join("")}<a href="https://instagram.com/${SETTINGS.instagram}" target="_blank" rel="noopener">Instagram</a></div><div class="muted">© ${new Date().getFullYear()} handmadebyhnhi · Handmade with ♥</div>`;
  const fab = $("#igFab"); fab.href = igUrl(); fab.textContent = "💬 " + s.dm;
}
function route() {
  const raw = location.hash.replace(/^#\/?/, ""), [pathPart, query = ""] = raw.split("?");
  const seg = pathPart.split("/").filter(Boolean);
  if (seg[0] === "vi" || seg[0] === "en") { lang = seg.shift(); store.set("lang", lang); }
  else { lang = store.get("lang", (navigator.language || "vi").startsWith("en") ? "en" : "vi"); return nav(seg.join("/")); }
  chrome();
  const [a, b] = seg; let html, after;
  if (!a) html = views.home();
  else if (a === "san-pham") html = b ? views.product(b) : views.products(), after = b && (() => wireProduct(b));
  else if (a === "quiz") { qState = { i: 0, a: {} }; html = views.quiz(); after = wireQuiz; }
  else if (a === "ket-qua") html = views.result(b, query), after = () => wireResult(b, query);
  else if (a === "dat-hang") html = views.checkout(), after = wireCheckout;
  else if (a === "don-hang") html = views.order(b), after = () => wireOrder(b);
  else if (a === "chinh-sach") html = views.policy(b);
  else html = views.notfound();
  $("#view").innerHTML = html; after && after();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".lang button").forEach(b => b.onclick = () => {
  const cur = location.hash.replace(/^#\/(vi|en)/, ""); lang = b.dataset.lang; location.hash = `#/${lang}${cur}`;
});
addEventListener("hashchange", route);
route();
