// handmadebyhnhi – danh sách sản phẩm – sửa tại đây để thêm/bớt hàng. Thay `emoji` bằng `image` (đường dẫn ảnh) khi có ảnh thật.
const PRODUCTS = [
  { id: 1, name: "Gấu bông len", cat: "Thú bông", price: 185000, emoji: "🧸", desc: "Gấu cotton milk mềm mại, cao ~20cm." },
  { id: 2, name: "Thỏ tai dài", cat: "Thú bông", price: 165000, emoji: "🐰", desc: "Thỏ móc tay, tặng bé cực xinh." },
  { id: 3, name: "Túi tote móc", cat: "Túi xách", price: 320000, emoji: "👜", desc: "Túi đeo vai, đựng vừa laptop 13 inch." },
  { id: 4, name: "Túi mini hoa cúc", cat: "Túi xách", price: 210000, emoji: "🌼", desc: "Túi nhỏ đựng điện thoại và ví." },
  { id: 5, name: "Khăn len cổ", cat: "Phụ kiện", price: 250000, emoji: "🧣", desc: "Khăn ấm, nhiều màu theo yêu cầu." },
  { id: 6, name: "Móc khóa trái tim", cat: "Phụ kiện", price: 45000, emoji: "💗", desc: "Móc khóa nhỏ xinh, làm quà tặng." },
  { id: 7, name: "Mũ beanie", cat: "Phụ kiện", price: 190000, emoji: "🧢", desc: "Mũ len ôm đầu, co giãn tốt." },
  { id: 8, name: "Hoa tulip len", cat: "Trang trí", price: 60000, emoji: "🌷", desc: "Không bao giờ héo, trang trí bàn làm việc." },
];

const money = n => n.toLocaleString("vi-VN") + "₫";
const $ = id => document.getElementById(id);
let cart = {};
try { cart = JSON.parse(localStorage.getItem("cart") || "{}"); } catch (e) {}
let activeCat = "Tất cả";

function save() { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {} }
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

function renderFilters() {
  const cats = ["Tất cả", ...new Set(PRODUCTS.map(p => p.cat))];
  $("filters").innerHTML = cats.map(c => `<button class="chip ${c === activeCat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
}

function renderGrid() {
  const list = PRODUCTS.filter(p => activeCat === "Tất cả" || p.cat === activeCat);
  $("grid").innerHTML = list.map(p => `
    <article class="card">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="${p.name}">` : p.emoji}</div>
      <div class="card-body">
        <h3>${p.name}</h3><p>${p.desc}</p>
        <span class="price">${money(p.price)}</span>
        <button class="btn" data-add="${p.id}">Thêm vào giỏ</button>
      </div>
    </article>`).join("");
}

function renderCart() {
  const ids = Object.keys(cart).filter(id => PRODUCTS.some(p => p.id == id));
  let total = 0, count = 0;
  $("cartItems").innerHTML = ids.length ? ids.map(id => {
    const p = PRODUCTS.find(x => x.id == id), q = cart[id];
    total += p.price * q; count += q;
    return `<div class="cart-row"><span class="emoji">${p.emoji}</span>
      <div class="info">${p.name}<br><small>${money(p.price)}</small></div>
      <div class="qty"><button data-dec="${id}">−</button>${q}<button data-inc="${id}">+</button></div></div>`;
  }).join("") : `<div class="empty">Giỏ hàng đang trống 🧶</div>`;
  $("cartTotal").textContent = money(total);
  $("cartCount").textContent = count;
  save();
}

function toggleCart(open) {
  $("cart").classList.toggle("open", open);
  $("overlay").classList.toggle("show", open);
  $("cart").setAttribute("aria-hidden", String(!open));
}

document.addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.cat) { activeCat = t.dataset.cat; renderFilters(); renderGrid(); }
  if (t.dataset.add) { cart[t.dataset.add] = (cart[t.dataset.add] || 0) + 1; renderCart(); toast("Đã thêm vào giỏ ✓"); }
  if (t.dataset.inc) { cart[t.dataset.inc]++; renderCart(); }
  if (t.dataset.dec) { if (--cart[t.dataset.dec] <= 0) delete cart[t.dataset.dec]; renderCart(); }
});
$("openCart").onclick = () => toggleCart(true);
$("closeCart").onclick = $("overlay").onclick = () => toggleCart(false);

// Đặt hàng: mở email soạn sẵn. Đổi SHOP_EMAIL thành email thật của shop.
const SHOP_EMAIL = "shop@example.com";
$("checkoutForm").addEventListener("submit", e => {
  e.preventDefault();
  const ids = Object.keys(cart);
  if (!ids.length) return toast("Giỏ hàng đang trống");
  const f = new FormData(e.target);
  const lines = ids.map(id => { const p = PRODUCTS.find(x => x.id == id); return `- ${p.name} x${cart[id]} = ${money(p.price * cart[id])}`; });
  const total = ids.reduce((s, id) => s + PRODUCTS.find(x => x.id == id).price * cart[id], 0);
  const body = `Khách: ${f.get("name")}\nSĐT: ${f.get("phone")}\nĐịa chỉ: ${f.get("address")}\n\n${lines.join("\n")}\n\nTổng: ${money(total)}`;
  location.href = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent("Đơn hàng mới")}&body=${encodeURIComponent(body)}`;
  cart = {}; renderCart(); e.target.reset(); toggleCart(false); toast("Cảm ơn bạn đã đặt hàng 💗");
});
$("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = `${f.get("name")} (${f.get("phone")})\n\n${f.get("msg")}`;
  location.href = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent("Liên hệ từ website")}&body=${encodeURIComponent(body)}`;
  e.target.reset(); toast("Đã mở email để gửi 💌");
});

$("year").textContent = new Date().getFullYear();
renderFilters(); renderGrid(); renderCart();
