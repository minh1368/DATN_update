export const NEWS_CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "blog", label: "Blog" },
  { id: "promo", label: "Ưu đãi" },
];

const baseNewsArticles = [
  {
    slug: "thu-tuc-rut-ho-so-goc-xe-o-to",
    title: "Hướng dẫn chi tiết thủ tục rút hồ sơ gốc xe ô tô",
    excerpt:
      "Hướng dẫn chi tiết thủ tục rút hồ sơ gốc xe ô tô bao gồm: các loại giấy tờ cần chuẩn bị, quy trình thực hiện, thời gian xử lý và lưu ý khi làm việc với cơ quan đăng kiểm.",
    category: "blog",
    featured: true,
    date: "2025-10-14",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    content: [
      "Rút hồ sơ gốc xe ô tô là thủ tục bắt buộc khi bạn muốn sang tên, chuyển nhượng hoặc xuất xe ra khỏi tỉnh. Hồ sơ gốc thường bao gồm giấy đăng ký, giấy kiểm định và các giấy tờ liên quan được lưu tại cơ quan đăng kiểm.",
      "Trước khi đến, hãy chuẩn bị CMND/CCCD, giấy đăng ký xe bản photo, hợp đồng mua bán hoặc biên bản bàn giao (nếu có), đơn đề nghị theo mẫu và lệ phí theo quy định hiện hành.",
      "Thời gian xử lý thường từ 3–7 ngày làm việc tùy địa phương. Khi thuê xe tại Phương Đông, đội ngũ tư vấn có thể hỗ trợ bạn kiểm tra giấy tờ trước chuyến đi dài ngày.",
    ],
  },
  {
    slug: "hop-dong-mua-ban-xe-o-to-cu",
    title: "Mẫu hợp đồng mua bán xe ô tô cũ & các điều cần lưu ý",
    excerpt:
      "Mẫu hợp đồng mua bán xe ô tô cũ chuẩn pháp lý, hướng dẫn đầy đủ các điều khoản quan trọng và những lưu ý cần biết để giao dịch an toàn.",
    category: "blog",
    featured: true,
    date: "2025-10-14",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=85",
    content: [
      "Hợp đồng mua bán xe cần ghi rõ thông tin hai bên, biển số, số khung, số máy, giá bán, phương thức thanh toán và thời hạn bàn giao xe cùng giấy tờ.",
      "Nên kiểm tra tình trạng pháp lý: xe có thế chấp, phạt nguội, đang tranh chấp hay không. Yêu cầu xác nhận công chứng nếu giá trị xe lớn.",
      "Sau khi ký, hai bên làm thủ tục sang tên tại cơ quan đăng ký trong thời hạn luật định để tránh rủi ro về trách nhiệm pháp lý.",
    ],
  },
  {
    slug: "phi-sang-ten-doi-chu-xe-khac-tinh",
    title: "Chi phí sang tên đổi chủ xe ô tô khác tỉnh bao nhiêu? Cập nhật 2025",
    excerpt:
      "Cập nhật chi tiết phí sang tên đổi chủ xe ô tô khác tỉnh năm 2025: lệ phí trước bạ, phí đổi biển số, phí giám định và các khoản phí liên quan.",
    category: "blog",
    featured: true,
    date: "2025-10-14",
    image:
      "https://e-cdn.carpla.vn/carpla-ecom/blog/hop-dong-mua-ban-xe-o-to-la-gi-1758621085.046.jpg",
    content: [
      "Sang tên xe khác tỉnh phát sinh nhiều khoản: lệ phí trước bạ (nếu áp dụng), phí đăng kiểm, phí cấp biển số mới, bảo hiểm bắt buộc và chi phí dịch vụ làm hồ sơ.",
      "Mức phí cụ thể thay đổi theo loại xe, tỉnh thành và thời điểm. Bạn nên liên hệ Phòng Đăng ký xe hoặc đơn vị uy tín để nhận báo giá chính xác.",
      "Lên kế hoạch trước 1–2 tuần nếu cần xe đi ngay sau khi sang tên, tránh ảnh hưởng lịch công tác hoặc du lịch.",
    ],
  },
  {
    slug: "chon-mau-xe-hop-tuoi-phong-thuy",
    title: "Cách xem và chọn màu xe hợp tuổi phong thủy chi tiết",
    excerpt:
      "Hướng dẫn cách xem màu xe hợp tuổi theo ngũ hành phong thủy, chi tiết cho từng mệnh Kim – Mộc – Thủy – Hỏa – Thổ.",
    category: "blog",
    featured: false,
    date: "2025-10-14",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    content: [
      "Màu xe được xem theo ngũ hành tương sinh với mệnh chủ: Kim hợp trắng, bạc; Mộc hợp xanh lá; Thủy hợp đen, xanh dương; Hỏa hợp đỏ, cam; Thổ hợp vàng, nâu.",
      "Ngoài màu sơn, bạn có thể cân nhắc màu nội thất và phụ kiện để tạo cảm giác hài hòa khi sử dụng xe lâu dài.",
      "Khi thuê xe tại Phương Đông, hãy đặt trước mẫu xe và màu sắc mong muốn để được sắp xếp xe phù hợp nhất.",
    ],
  },
  {
    slug: "kinh-nghiem-thue-xe-tu-lai-lan-dau",
    title: "Kinh nghiệm thuê xe tự lái lần đầu cần biết",
    excerpt:
      "Tổng hợp kinh nghiệm thuê xe tự lái: chọn loại xe, kiểm tra ngoại thất, giấy tờ, bảo hiểm và quy trình nhận – trả xe an toàn.",
    category: "blog",
    featured: false,
    date: "2025-11-02",
    image: "/image/car/vf6.webp",
    content: [
      "Xác định nhu cầu: số người, quãng đường, địa hình và thời gian thuê để chọn sedan, SUV hay MPV phù hợp.",
      "Khi nhận xe, kiểm tra cùng nhân viên: vỏ xe, lốp, nhiên liệu, đồng hồ km, giấy tờ xe và tình trạng nội thất. Chụp ảnh làm bằng chứng.",
      "Tuân thủ hợp đồng về km, vùng di chuyển và thời gian trả xe. Liên hệ hotline 0979 402 470 khi cần hỗ trợ khẩn.",
    ],
  },
  {
    slug: "giay-to-thue-xe-co-lai",
    title: "Giấy tờ cần có khi thuê xe có lái cho doanh nghiệp",
    excerpt:
      "Danh sách giấy tờ và thông tin cần chuẩn bị khi ký hợp đồng thuê xe có lái đưa đón nhân viên, chuyên gia hoặc đi công tác.",
    category: "blog",
    featured: false,
    date: "2025-11-18",
    image: "/image/car/luxSA2.0.jpg",
    content: [
      "Doanh nghiệp cần: giấy phép kinh doanh, thông tin người đại diện, lịch trình tuyến đường và thời gian sử dụng dự kiến.",
      "Đối với thuê cá nhân: CMND/CCCD, GPLX còn hiệu lực và phương thức thanh toán theo hợp đồng.",
      "Phương Đông hỗ trợ lập hợp đồng theo tháng hoặc theo chuyến, phù hợp khu công nghiệp và văn phòng tại Hà Nội.",
    ],
  },
  {
    slug: "bao-duong-xe-truoc-chuyen-di-dai",
    title: "Checklist bảo dưỡng xe trước chuyến đi dài",
    excerpt:
      "Những hạng mục nên kiểm tra trước khi lái xe đi xa: dầu máy, nước làm mát, lốp, ắc quy, đèn và hệ thống phanh.",
    category: "blog",
    featured: false,
    date: "2025-12-05",
    image: "/image/car/cx5.webp",
    content: [
      "Kiểm tra áp suất lốp, độ sâu gai và lốp dự phòng. Bơm căng đúng mức theo khuyến cáo của hãng.",
      "Kiểm tra mực dầu máy, nước làm mát, nước rửa kính và tình trạng ắc quy. Thay dầu nếu gần đến hạn bảo dưỡng.",
      "Xe cho thuê tại Phương Đông được bảo dưỡng định kỳ; khách hàng vẫn nên kiểm tra nhanh trước khi nhận xe.",
    ],
  },
  {
    slug: "uu-dai-thue-xe-cuoi-tuan",
    title: "Ưu đãi thuê xe cuối tuần – Giảm đến 15%",
    excerpt:
      "Chương trình ưu đãi thuê xe tự lái và có lái cuối tuần: giảm 15% cho đơn từ 2 ngày, áp dụng một số dòng xe chỉ định.",
    category: "promo",
    featured: false,
    date: "2026-01-10",
    image: "/image/car/vf3.webp",
    content: [
      "Ưu đãi áp dụng cho đặt xe từ thứ Sáu đến Chủ nhật, tối thiểu 2 ngày thuê.",
      "Không cộng dồn với chương trình khác. Số lượng xe ưu đãi có hạn.",
      "Liên hệ hotline 0979 402 470 hoặc đặt qua website để được xác nhận giá cuối cùng.",
    ],
  },
  {
    slug: "combo-vinfast-3-ngay",
    title: "Combo thuê xe điện VinFast 3 ngày – Giá ưu đãi",
    excerpt:
      "Trải nghiệm xe điện VinFast với gói 3 ngày 2 đêm, miễn phí sạc tại trạm đối tác trong phạm vi chương trình.",
    category: "promo",
    featured: false,
    date: "2026-02-01",
    image: "/image/car/teslamodel3.jpg",
    content: [
      "Gói combo bao gồm VF 3, VF 5 hoặc VF 6 tùy tình trạng xe trống tại thời điểm đặt.",
      "Khách hàng cần GPLX hạng B trở lên và đặt cọc theo quy định.",
      "Đăng ký trước ít nhất 48 giờ để được sắp xe và hướng dẫn sạc.",
    ],
  },
  {
    slug: "hop-tac-doanh-nghiep-dua-don",
    title: "Hợp tác doanh nghiệp – Dịch vụ đưa đón nhân viên dài hạn",
    excerpt:
      "Giải pháp cho thuê xe đưa đón nhân viên tại khu công nghiệp theo tháng, GPS giám sát và đội xe đa dạng 4–45 chỗ.",
    category: "promo",
    featured: false,
    date: "2026-03-15",
    image: "/image/car/innova.webp",
    content: [
      "Phù hợp nhà máy, khu công nghiệp và văn phòng tại Hà Nội và miền Bắc.",
      "Hợp đồng linh hoạt theo tháng, quý hoặc năm. Báo giá riêng theo tuyến và số chuyến.",
      "Liên hệ kinh doanh qua email phuongdongcorp22@gmail.com để được khảo sát tuyến miễn phí.",
    ],
  },
];

function getExtraNewsContent(article) {
  const isPromo = article.category === "promo";

  if (isPromo) {
    return [
      "Khi tham gia chương trình, khách hàng nên cung cấp sớm thời gian nhận xe, địa điểm nhận xe, số lượng người đi và nhu cầu hành lý để nhân viên tư vấn chọn đúng dòng xe. Các thông tin này giúp hạn chế đổi xe sát giờ và đảm bảo báo giá sát với thực tế sử dụng.",
      "Giá ưu đãi có thể thay đổi theo ngày nhận xe, thời lượng thuê, tình trạng xe trống và các yêu cầu phát sinh như giao xe tận nơi, đi ngoại tỉnh hoặc thuê thêm tài xế. Vì vậy, khách hàng nên xác nhận lại trước khi đặt cọc để tránh hiểu nhầm về chi phí cuối cùng.",
      "Phương Đông ưu tiên tư vấn phương án phù hợp thay vì chỉ chọn xe giá thấp nhất. Với chuyến đi gia đình, xe rộng và cốp lớn thường đem lại trải nghiệm tốt hơn; với nhu cầu công việc trong nội thành, xe nhỏ gọn hoặc sedan tiết kiệm chi phí sẽ hợp lý hơn.",
    ];
  }

  return [
    "Trong thực tế, mỗi trường hợp có thể phát sinh thêm giấy tờ hoặc bước xử lý tùy theo tình trạng xe, địa phương và mục đích sử dụng. Người dùng nên kiểm tra kỹ thông tin trước khi ra quyết định, đặc biệt với các giao dịch có giá trị lớn hoặc lịch trình cần xe gấp.",
    "Nếu bạn đang chuẩn bị thuê xe, hãy xác định rõ số người đi, số ngày thuê, tuyến đường dự kiến, nhu cầu tự lái hay có lái và ngân sách mong muốn. Những thông tin này giúp quá trình tư vấn nhanh hơn, đồng thời tránh chọn xe không phù hợp với hành trình.",
    "Đối với khách hàng doanh nghiệp, việc thống nhất trước lịch trình, điểm đón trả, số chuyến trong ngày và người phụ trách liên hệ sẽ giúp hợp đồng vận hành ổn định hơn. Phương Đông có thể hỗ trợ tư vấn phương án thuê theo ngày, theo chuyến hoặc dài hạn tùy nhu cầu.",
  ];
}

export const newsArticles = baseNewsArticles.map((article) => ({
  ...article,
  content: [...article.content, ...getExtraNewsContent(article)],
}));

export function getNewsBySlug(slug) {
  return newsArticles.find((a) => a.slug === slug);
}

export function formatNewsDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
