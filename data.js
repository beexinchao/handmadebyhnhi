// Dữ liệu MẪU (theo tài liệu mục 5, 6, 8.2). Sản phẩm là dữ liệu giả – thay bằng danh mục thật trước khi ra mắt chính thức.
// Khi có admin + CSDL (Supabase), file này được thay bằng dữ liệu tải từ API.
const SETTINGS = {
  instagram: "handmadebyhnhi",      // TODO: xác nhận tên tài khoản Instagram thật
  email: "shop@example.com",        // TODO: email nhận đơn thật
  shipDays: 3,                      // thời gian ship ước tính (ngày)
  minScore: 40,                     // ngưỡng đề xuất tối thiểu (mục 5.3)
  shipZones: [                      // TODO: chủ shop xác nhận biểu phí thật (mục 12.2)
    { id: "hcm", fee: 25000 }, { id: "hn", fee: 30000 }, { id: "other", fee: 35000 },
  ],
};

// Nhóm thẻ và trọng số khởi đầu (mục 5.3)
const TAG_GROUPS = {
  recipient: { weight: 3 }, occasion: { weight: 3 }, style: { weight: 2 }, palette: { weight: 1 }, personalization: { weight: 2 },
};

// Nhãn thẻ: key -> [vi, en]
const TAGS = {
  recipient: { partner: ["bạn gái/bạn trai", "partner"], mom: ["mẹ", "mom"], baby: ["em bé", "a baby"], friend: ["bạn bè", "a friend"], self: ["chính mình", "myself"] },
  occasion: { birthday: ["sinh nhật", "birthday"], anniversary: ["kỷ niệm", "anniversary"], wedding: ["cưới", "wedding"], newborn: ["em bé chào đời", "newborn"], none: ["không dịp đặc biệt", "no special occasion"] },
  style: { cute: ["dễ thương", "cute"], minimal: ["tối giản", "minimal"], vintage: ["cổ điển", "vintage"], playful: ["vui nhộn", "playful"] },
  palette: { pastel: ["pastel", "pastel"], earth: ["đất", "earthy"], bright: ["tươi sáng", "bright"], neutral: ["trung tính", "neutral"] },
  personalization: { ready: ["giữ nguyên mẫu", "ready-made"], color: ["đổi màu", "custom colour"], name: ["thêu tên/lời nhắn", "embroidered name/message"] },
};

const YARN_COLORS = [
  { id: "pink", hex: "#f4a6b8", vi: "Hồng pastel", en: "Pastel pink" },
  { id: "cream", hex: "#f5e6d3", vi: "Kem", en: "Cream" },
  { id: "mint", hex: "#b9e4d0", vi: "Xanh bạc hà", en: "Mint" },
  { id: "sky", hex: "#a9cdf0", vi: "Xanh trời", en: "Sky blue" },
  { id: "lilac", hex: "#cdb9e8", vi: "Tím lilac", en: "Lilac" },
  { id: "butter", hex: "#f7e08a", vi: "Vàng bơ", en: "Butter yellow" },
  { id: "brown", hex: "#a77b5a", vi: "Nâu đất", en: "Earth brown" },
  { id: "red", hex: "#d9534f", vi: "Đỏ", en: "Red" },
];

// Sản phẩm mẫu. sizes: [id, vi, en, phụ phí VND]. nameFee: phụ phí thêu tên (0 = không hỗ trợ).
const PRODUCTS = [
  { slug: "tho-bong-pastel", emoji: "🐰", bg: "#fde4ec", featured: true, price: 185000, days: 5,
    vi: ["Thỏ bông pastel", "Thỏ móc tay cotton milk mềm mại, tai dài, quà tặng nhẹ nhàng cho người thương.", "Cao ~20cm · cotton milk 100% · giặt tay nhẹ, phơi bóng râm."],
    en: ["Pastel bunny", "Hand-crocheted bunny in soft milk cotton with long ears – a gentle gift for someone special.", "~20cm tall · 100% milk cotton · gentle hand wash, dry in the shade."],
    tags: { recipient: ["partner", "friend", "baby"], occasion: ["anniversary", "birthday", "newborn"], style: ["cute"], palette: ["pastel"], personalization: ["color", "ready"] },
    sizes: [["s", "Nhỏ ~15cm", "Small ~15cm", -30000], ["m", "Vừa ~20cm", "Medium ~20cm", 0], ["l", "Lớn ~30cm", "Large ~30cm", 90000]], nameFee: 30000 },
  { slug: "gau-bong-len", emoji: "🧸", bg: "#fff0dc", featured: true, price: 205000, days: 6,
    vi: ["Gấu bông len", "Gấu ôm mềm, dễ thương, hợp tặng sinh nhật hoặc đón em bé chào đời.", "Cao ~22cm · cotton milk · có thể thêu tên lên áo gấu."],
    en: ["Woolly teddy bear", "A soft cuddly teddy – great for birthdays and welcoming a newborn.", "~22cm tall · milk cotton · name can be embroidered on the bear's shirt."],
    tags: { recipient: ["baby", "friend", "partner"], occasion: ["birthday", "newborn", "anniversary"], style: ["cute", "vintage"], palette: ["neutral", "pastel", "earth"], personalization: ["name", "color"] },
    sizes: [["m", "Vừa ~22cm", "Medium ~22cm", 0], ["l", "Lớn ~32cm", "Large ~32cm", 100000]], nameFee: 40000 },
  { slug: "tui-tote-moc", emoji: "👜", bg: "#f0e6d8", featured: true, price: 320000, days: 8,
    vi: ["Túi tote móc", "Túi đeo vai họa tiết lưới, đựng vừa laptop 13 inch, hợp đi học đi làm.", "30×35cm · cotton thấm hút · lót vải bên trong."],
    en: ["Crochet tote bag", "Mesh-pattern shoulder bag that fits a 13-inch laptop – for school or work.", "30×35cm · absorbent cotton · fabric lining."],
    tags: { recipient: ["mom", "friend", "self"], occasion: ["birthday", "none"], style: ["minimal", "vintage"], palette: ["earth", "neutral"], personalization: ["color", "ready"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: 0 },
  { slug: "tui-mini-hoa-cuc", emoji: "🌼", bg: "#fff6c9", featured: true, price: 210000, days: 6,
    vi: ["Túi mini hoa cúc", "Túi nhỏ đựng điện thoại và ví, thêu hoa cúc vui mắt.", "16×13cm · dây đeo chéo điều chỉnh được."],
    en: ["Daisy mini bag", "A small bag for phone and wallet with a cheerful daisy motif.", "16×13cm · adjustable crossbody strap."],
    tags: { recipient: ["partner", "friend", "self"], occasion: ["birthday", "none", "anniversary"], style: ["cute", "playful"], palette: ["bright", "pastel"], personalization: ["color", "ready"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: 0 },
  { slug: "khan-len-co", emoji: "🧣", bg: "#e8e0f3", featured: false, price: 250000, days: 7,
    vi: ["Khăn len cổ", "Khăn ấm mềm, chọn màu theo ý, quà mùa lạnh cho mẹ và người thân.", "150×20cm · len cotton blend."],
    en: ["Knit scarf", "A warm soft scarf in your choice of colour – a winter gift for mom and family.", "150×20cm · cotton-blend yarn."],
    tags: { recipient: ["mom", "partner", "friend"], occasion: ["birthday", "anniversary", "none"], style: ["minimal", "vintage"], palette: ["earth", "neutral"], personalization: ["color", "name"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: 35000 },
  { slug: "moc-khoa-trai-tim", emoji: "💗", bg: "#ffe0e6", featured: true, price: 55000, days: 3,
    vi: ["Móc khóa trái tim", "Móc khóa nhỏ xinh, làm quà tặng hay thêm vào set quà.", "~6cm · chọn màu tự do."],
    en: ["Heart keychain", "A tiny keepsake – a sweet gift or an add-on for a gift set.", "~6cm · any colour you like."],
    tags: { recipient: ["partner", "friend", "self"], occasion: ["anniversary", "birthday", "none"], style: ["cute", "playful"], palette: ["pastel", "bright"], personalization: ["color", "ready"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: 20000 },
  { slug: "mu-beanie", emoji: "🧢", bg: "#e4eef7", featured: false, price: 190000, days: 6,
    vi: ["Mũ beanie", "Mũ len ôm đầu, co giãn tốt, giữ ấm mùa lạnh.", "Vòng đầu 52–58cm · co giãn."],
    en: ["Beanie hat", "A snug, stretchy knit hat to keep warm in cold weather.", "Head 52–58cm · stretchy."],
    tags: { recipient: ["friend", "self", "partner"], occasion: ["birthday", "none"], style: ["minimal", "playful"], palette: ["earth", "neutral", "bright"], personalization: ["color", "ready"] },
    sizes: [["m", "Người lớn", "Adult", 0]], nameFee: 0 },
  { slug: "hoa-tulip-len", emoji: "🌷", bg: "#ffe6ef", featured: true, price: 60000, days: 3,
    vi: ["Hoa tulip len", "Không bao giờ héo – hoa len tặng người thương hoặc trang trí bàn làm việc.", "Cao ~30cm / bông · gói giấy kraft."],
    en: ["Yarn tulip", "Never wilts – a yarn flower to gift or decorate your desk.", "~30cm per stem · kraft paper wrap."],
    tags: { recipient: ["partner", "mom", "friend"], occasion: ["anniversary", "birthday", "wedding", "none"], style: ["cute", "vintage"], palette: ["pastel", "bright"], personalization: ["color", "ready"] },
    sizes: [["m", "1 bông", "1 stem", 0], ["b", "Bó 5 bông", "Bouquet of 5", 220000]], nameFee: 0 },
];

// Câu hỏi quiz (mục 5.2). kind: single | multi | budget | date
const QUIZ = [
  { id: "recipient", kind: "single", group: "recipient", vi: "Bạn tặng cho ai?", en: "Who is it for?" },
  { id: "occasion", kind: "single", group: "occasion", vi: "Dịp gì?", en: "What's the occasion?" },
  { id: "budget", kind: "budget", vi: "Ngân sách tối đa?", en: "What's your maximum budget?",
    choices: [[200000, "Dưới 200k", "Under 200k"], [400000, "200–400k", "200–400k"], [700000, "400–700k", "400–700k"], [Infinity, "Trên 700k", "Over 700k"]] },
  { id: "date", kind: "date", vi: "Cần nhận trước ngày nào?", en: "When do you need it by?" },
  { id: "style", kind: "multi", group: "style", max: 2, vi: "Phong cách bạn thích? (chọn 1–2)", en: "Which styles do you like? (pick 1–2)" },
  { id: "palette", kind: "single", group: "palette", vi: "Tông màu?", en: "Colour tone?" },
  { id: "personalization", kind: "single", group: "personalization", vi: "Bạn muốn cá nhân hoá đến mức nào?", en: "How personal should it be?" },
];
