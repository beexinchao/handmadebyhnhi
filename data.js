// Dữ liệu MẪU (theo tài liệu mục 5, 6, 8.2). Sản phẩm là dữ liệu giả – thay bằng danh mục thật trước khi ra mắt chính thức.
// Khi có admin + CSDL (Supabase), file này được thay bằng dữ liệu tải từ API.
const SETTINGS = {
  instagram: "handmadebyhnhi",      // TODO: xác nhận tên tài khoản Instagram thật
  email: "handmadebyhnhi@gmail.com", // email nhận đơn (lấy từ thiết kế Stitch, chủ shop xác nhận)
  banks: [                          // TODO: chủ shop xác nhận thông tin chuyển khoản thật (lấy từ bản thiết kế Stitch)
    { bank: "MB Bank", number: "97042299887766", holder: "HOANG NHAT NHI" },
    { bank: "Techcombank", number: "19036789123018", holder: "HOANG NHAT NHI" },
  ],
  shipDays: 3,                      // thời gian ship ước tính (ngày)
  minScore: 40,                     // ngưỡng đề xuất tối thiểu (mục 5.3)
  shipZones: [                      // TODO: chủ shop xác nhận biểu phí thật (mục 12.2)
    { id: "hcm", fee: 25000 }, { id: "hn", fee: 35000 }, { id: "other", fee: 35000 },
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
  { id: "pink", hex: "#FAD2E1", vi: "Hồng Pastel Phối Kem", en: "Pastel pink with cream" },
  { id: "cream", hex: "#FFF1E6", vi: "Kem Sữa Tinh Khôi", en: "Milk cream" },
  { id: "sage", hex: "#CCD5AE", vi: "Xanh Bơ Vintage", en: "Vintage sage" },
  { id: "camel", hex: "#D4A373", vi: "Nâu Mộc Cổ Điển", en: "Classic camel" },
  { id: "lilac", hex: "#D8B4E2", vi: "Tím Khói Mộng Mơ", en: "Dreamy lilac" },
  { id: "butter", hex: "#FAEDCD", vi: "Vàng Bơ Nắng Ấm", en: "Warm butter" },
  { id: "aqua", hex: "#BEE1E6", vi: "Xanh Bầu Trời Pastel", en: "Pastel sky" },
  { id: "terra", hex: "#E07A5F", vi: "Cam Đất Mùa Thu", en: "Autumn terracotta" },
];

// Sản phẩm mẫu (theo thiết kế Stitch). nameFee: null = không thêu; 0 = thêu miễn phí; số = phụ phí.
const PRODUCTS = [
  { slug: "khan-choang-hoa-cuc", emoji: "🌼", bg: "#fff8c4", tag: ["Len mềm cao cấp", "Premium soft yarn"], featured: true, price: 320000, days: 5,
    vi: ["Khăn choàng hoa cúc", "Khăn choàng len mềm với họa tiết hoa cúc, ấm áp và nhẹ, hợp quà tặng mẹ và người thân.", "Sợi cotton milk, pastel butter"],
    en: ["Daisy shawl", "A soft crocheted shawl with a daisy motif – warm, light and perfect as a gift.", "Milk cotton yarn, pastel butter"],
    specs: [["Kích thước", "Rộng 40 × dài 150 cm", "Dáng khăn choàng vai"], ["Chất liệu sợi", "Milk Cotton", "Mềm, ấm, ít xù"], ["Bảo quản", "Giặt tay nước mát", "Phơi ngang trong bóng râm"]],
    tags: { recipient: ["mom", "friend", "partner"], occasion: ["birthday", "none", "anniversary"], style: ["vintage", "cute"], palette: ["pastel", "bright"], personalization: ["color", "ready"] },
    sizes: [["m", "Tiêu chuẩn (40×150cm)", "Standard (40×150cm)", 0]], nameFee: null },
  { slug: "tui-granny-square", emoji: "🌸", bg: "#ffe3e6", tag: ["Bestseller", "Bestseller"], hot: true, featured: true, price: 450000, oldPrice: 490000, sale: ["-8% đợt len mới", "-8% new yarn drop"], days: 7,
    vi: ["Túi xách len Granny Square hoài niệm", "Từng ô vuông hoa văn hoài niệm được ghép nối thủ công nhịp nhàng bằng mũi kim nhỏ nhắn của thợ móc tiệm Nhi.", "Túi retro thanh lịch, hợp outfit nhẹ nhàng."],
    en: ["Granny Square nostalgia tote", "Each nostalgic granny square is joined by hand with fine stitches – a retro bag for easy outfits.", "Elegant retro tote."],
    specs: [["Kích thước", "22 × 20 × 8 cm", "Dáng hộp vintage"], ["Chất liệu sợi", "Milk Cotton Loại 1", "Mềm mịn, êm da, không xù"], ["Bảo quản", "Giặt tay nước mát", "Phơi ngang trong bóng râm"]],
    tags: { recipient: ["friend", "partner", "mom", "self"], occasion: ["birthday", "anniversary", "none"], style: ["vintage"], palette: ["pastel", "earth"], personalization: ["name", "color"] },
    sizes: [["s", "Size Nhỏ (chuẩn) – 22×20×8cm", "Small (standard) – 22×20×8cm", 0], ["l", "Size Lớn (đựng iPad) – 28×26×10cm", "Large (fits iPad) – 28×26×10cm", 80000]], nameFee: 30000 },
  { slug: "mu-bucket-song-pastel", emoji: "🌿", bg: "#e4f6e8", tag: ["Tone pastel", "Pastel tone"], featured: true, price: 280000, days: 4,
    vi: ["Mũ len bucket sóng pastel", "Vành mũ gợn sóng uốn lượn phong cách Mori-girl cổ điển, chất len thông thoáng không gây bí bách.", "Phù hợp chụp ảnh dã ngoại và đi học."],
    en: ["Pastel wave bucket hat", "A wavy brim in a Mori-girl style; breathable yarn that will not feel stuffy.", "Great for picnics and photos."],
    specs: [["Kích cỡ", "Free size", "Tuỳ chỉnh vòng đầu"], ["Chất liệu sợi", "Cotton thoáng khí", "Không bí bách"], ["Bảo quản", "Giặt tay nước mát", "Phơi ngang"]],
    tags: { recipient: ["friend", "self", "partner"], occasion: ["birthday", "none"], style: ["minimal", "vintage"], palette: ["pastel", "neutral"], personalization: ["color", "ready"] },
    sizes: [["m", "Free size / Tuỳ chỉnh vòng đầu", "Free size / adjustable", 0]], nameFee: null },
  { slug: "gau-bong-mini", emoji: "🧸", bg: "#ece9fb", tag: ["Thêu tên free", "Free name embroidery"], featured: true, price: 250000, days: 3,
    vi: ["Gấu bông len mini thêu tên riêng", "Ý nghĩa kỷ niệm sâu sắc nhờ gắn tên/ngày sinh nhật của bạn thân. Kèm móc khóa hoặc túi đựng xinh xắn.", "Tặng kèm charm len và thiệp ghi tay."],
    en: ["Mini teddy with your name", "A keepsake with a name or birthday stitched on – comes with a keychain or pouch.", "Includes a yarn charm and handwritten card."],
    specs: [["Kích thước", "Cao ~12 cm", "Gấu mini để bàn / treo túi"], ["Chất liệu sợi", "Milk Cotton", "Mềm, an toàn cho da"], ["Điểm đặc biệt", "Thêu tên miễn phí", "Tặng charm len & thiệp"]],
    tags: { recipient: ["baby", "partner", "friend"], occasion: ["newborn", "birthday", "anniversary"], style: ["cute"], palette: ["pastel", "neutral", "earth"], personalization: ["name", "color"] },
    sizes: [["s", "Mini ~12cm", "Mini ~12cm", 0], ["m", "Vừa ~20cm", "Medium ~20cm", 70000]], nameFee: 0 },
  { slug: "set-lot-ly-tulip", emoji: "🌷", bg: "#ffeedd", tag: ["Bộ 4 chiếc", "Set of 4"], price: 160000, days: 2,
    vi: ["Set 4 lót ly hoa tulip", "Bộ 4 lót ly hình hoa tulip nhiều màu, thấm nước tốt, trang trí góc làm việc xinh xắn.", "Quà tặng tân gia, đồng nghiệp."],
    en: ["Tulip coaster set (4)", "Four colourful tulip coasters – absorbent and a cheerful desk accent.", "A great housewarming gift."],
    specs: [["Kích thước", "Mỗi chiếc ~10 cm", "Bộ 4 chiếc"], ["Chất liệu sợi", "Cotton thấm nước", "Giặt máy túi lưới"], ["Bảo quản", "Giặt nhẹ", "Phơi khô tự nhiên"]],
    tags: { recipient: ["mom", "friend", "self"], occasion: ["wedding", "birthday", "none"], style: ["cute", "vintage"], palette: ["pastel", "bright"], personalization: ["ready", "color"] },
    sizes: [["m", "Bộ 4 chiếc", "Set of 4", 0]], nameFee: null },
  { slug: "vo-tai-nghe-ech", emoji: "🐸", bg: "#e0f2fd", tag: ["Vừa vặn Airpod", "Fits AirPods"], price: 190000, days: 3,
    vi: ["Vỏ bảo vệ tai nghe ếch", "Vỏ len ếch con vừa AirPods 2, 3, Pro, vừa dễ thương vừa chống trầy xước.", "Có dây móc tiện treo túi."],
    en: ["Frog earbud case", "A little frog cover that fits AirPods 2, 3 and Pro – cute and scratch-proof.", "Includes a clip loop."],
    specs: [["Tương thích", "AirPods 2, 3, Pro", "Có lỗ sạc"], ["Chất liệu sợi", "Cotton mềm", "Chống trầy xước"], ["Bảo quản", "Lau nhẹ", "Không ngâm nước"]],
    tags: { recipient: ["friend", "partner", "self"], occasion: ["birthday", "none"], style: ["playful", "cute"], palette: ["bright"], personalization: ["color", "ready"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: null },
  { slug: "kep-toc-no-hoa-tra", emoji: "🎀", bg: "#fde3ee", tag: ["Quà tặng xinh", "Cute gift"], price: 85000, days: 2,
    vi: ["Kẹp tóc nơ len hoa trà", "Kẹp tóc nơ len nhỏ xinh đính hoa trà, hợp làm quà tặng hay phụ kiện hằng ngày.", "Có thể làm theo màu yêu cầu."],
    en: ["Camellia bow hair clip", "A tiny yarn bow with a camellia – a sweet gift or daily accessory.", "Any colour on request."],
    specs: [["Kích thước", "Rộng ~7 cm", "Kẹp kim loại bọc len"], ["Chất liệu sợi", "Cotton mềm", "Nhẹ, không đau tóc"], ["Bảo quản", "Giặt tay nhẹ", "Phơi khô tự nhiên"]],
    tags: { recipient: ["partner", "friend", "self"], occasion: ["birthday", "anniversary", "none"], style: ["cute", "vintage"], palette: ["pastel"], personalization: ["ready", "color"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: null },
  { slug: "tui-binh-nuoc", emoji: "🧶", bg: "#f1f1f4", tag: ["Tiện dụng", "Handy"], price: 220000, days: 4,
    vi: ["Túi len đựng bình nước", "Túi len bọc bình giữ nhiệt tiện lợi, có dây đeo chéo, giữ bình khỏi trầy và va đập.", "Hợp đi học, đi làm, đi chơi."],
    en: ["Yarn bottle sling", "A crocheted sling that protects your bottle from scratches and bumps.", "For school, work and trips."],
    specs: [["Kích thước", "Vừa bình 500–750 ml", "Dây đeo chéo chỉnh được"], ["Chất liệu sợi", "Cotton dệt chắc", "Bền, ít giãn"], ["Bảo quản", "Giặt tay nước mát", "Phơi ngang"]],
    tags: { recipient: ["friend", "self", "mom"], occasion: ["none", "birthday"], style: ["minimal", "playful"], palette: ["neutral", "earth", "bright"], personalization: ["color", "ready"] },
    sizes: [["m", "Tiêu chuẩn", "Standard", 0]], nameFee: null },
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
