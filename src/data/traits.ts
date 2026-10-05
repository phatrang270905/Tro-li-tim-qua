/**
 * Từ điển kiến thức cho Chatbot Gợi Ý Quà.
 *
 * Muốn bot "thông minh" hơn, chỉ cần thêm dòng vào các danh sách dưới đây — không cần sửa logic.
 *  - `patterns`: cụm từ CÓ DẤU, viết thường (khớp nguyên từ trong câu hỏi)
 *  - `plainPatterns`: cụm từ KHÔNG DẤU cho người gõ không dấu (nên dùng cụm ≥ 2 từ để tránh nhầm)
 *  - `keywords`: từ khóa KHÔNG DẤU tìm trong tên / mô tả / tính năng sản phẩm
 */

export interface GiftTrait {
  id: string;
  label: string;
  patterns: string[];
  plainPatterns: string[];
  vibes: string[];
  keywords: string[];
  preferHighRating?: boolean;
  advice: string;
}

export interface ProductTypeHint {
  id: string;
  label: string;
  patterns: string[];
  plainPatterns: string[];
  titleKeywords: string[];
}

export const GIFT_TRAITS: GiftTrait[] = [
  {
    id: 'picky',
    label: 'khó tính',
    patterns: ['khó tính', 'kỹ tính', 'kĩ tính', 'khó chiều', 'cầu toàn', 'kén chọn', 'kỹ càng', 'khó chịu', 'khó ưng', 'kén'],
    plainPatterns: ['kho tinh', 'ky tinh', 'kho chieu', 'cau toan', 'ken chon', 'ky cang', 'kho ung'],
    vibes: ['Thực tế & Tiện ích', 'Lãng mạn & Tinh tế'],
    keywords: ['cao cap', 'sang trong', 'thuong hang', 'khac ten', 'tu nhien'],
    preferHighRating: true,
    advice:
      'Người khó tính thường đánh giá cao sự chỉn chu: nên chọn món chất lượng tốt, dùng được thật sự, đóng gói đẹp và tránh đồ sến hoặc rẻ tiền. Mình ưu tiên những món được đánh giá cao nhất.',
  },
  {
    id: 'luxury',
    label: 'thích sang trọng',
    patterns: ['sang chảnh', 'hàng hiệu', 'sang trọng', 'đẳng cấp', 'quý phái', 'cao cấp', 'xịn sò', 'xịn'],
    plainPatterns: ['sang chanh', 'hang hieu', 'sang trong', 'dang cap', 'quy phai', 'xin so'],
    vibes: ['Lãng mạn & Tinh tế'],
    keywords: ['cao cap', 'sang trong', 'thuong hang', 'ma vang', 'to tam', 'bac 925', 'hop qua'],
    preferHighRating: true,
    advice: 'Với người thích sự sang trọng, hộp quà đẹp và chất liệu cao cấp quan trọng không kém món quà.',
  },
  {
    id: 'practical',
    label: 'thực tế',
    patterns: ['thực tế', 'thực dụng', 'hữu ích', 'không thích sến', 'ghét sến', 'không sến', 'dùng hằng ngày', 'dùng hàng ngày'],
    plainPatterns: ['thuc te', 'thuc dung', 'huu ich', 'khong thich sen', 'ghet sen', 'dung hang ngay'],
    vibes: ['Thực tế & Tiện ích'],
    keywords: ['tien loi', 'hang ngay', 'moi ngay', 'gon'],
    advice: 'Người thực tế sẽ quý món quà dùng được mỗi ngày hơn là đồ trang trí.',
  },
  {
    id: 'romantic',
    label: 'lãng mạn',
    patterns: ['lãng mạn', 'ngọt ngào', 'mơ mộng', 'tình cảm', 'thích hoa', 'điệu đà', 'bánh bèo'],
    plainPatterns: ['lang man', 'ngot ngao', 'mo mong', 'tinh cam', 'thich hoa', 'dieu da', 'banh beo'],
    vibes: ['Lãng mạn & Tinh tế'],
    keywords: ['khac ten', 'thong diep', 'hoa hong', 'ky niem'],
    advice: 'Người lãng mạn thích những món có dấu ấn riêng — khắc tên, ngày kỷ niệm hoặc lời nhắn nhỏ sẽ ghi điểm lớn.',
  },
  {
    id: 'tech',
    label: 'mê công nghệ',
    patterns: ['công nghệ', 'đồ điện tử', 'gadget', 'game thủ', 'chơi game', 'mê game', 'dân it', 'kỹ thuật'],
    plainPatterns: ['cong nghe', 'do dien tu', 'game thu', 'choi game', 'me game', 'dan it'],
    vibes: ['Yêu công nghệ & Độc lạ'],
    keywords: ['bluetooth', 'thong minh', 'led', 'ket noi'],
    advice: 'Người mê công nghệ thích đồ "có pin, có kết nối" và mới lạ.',
  },
  {
    id: 'stress',
    label: 'hay căng thẳng / mất ngủ',
    patterns: ['mất ngủ', 'khó ngủ', 'căng thẳng', 'stress', 'áp lực', 'mệt mỏi', 'thư giãn', 'chữa lành', 'chill', 'hướng nội'],
    plainPatterns: ['mat ngu', 'kho ngu', 'cang thang', 'ap luc', 'met moi', 'thu gian', 'chua lanh'],
    vibes: ['Chill & Chữa lành'],
    keywords: ['ngu', 'nen thom', 'tinh dau', 'massage', 'den ngu', 'thu gian', 'tra'],
    advice: 'Với người hay căng thẳng, quà giúp thư giãn và ngủ ngon là lựa chọn rất tinh tế.',
  },
  {
    id: 'office',
    label: 'dân văn phòng',
    patterns: ['văn phòng', 'công sở', 'ngồi nhiều', 'đau lưng', 'mỏi vai', 'đau cổ', 'mỏi cổ', 'ngồi máy tính'],
    plainPatterns: ['van phong', 'cong so', 'ngoi nhieu', 'dau lung', 'moi vai', 'dau co', 'moi co', 'ngoi may tinh'],
    vibes: ['Thực tế & Tiện ích'],
    keywords: ['van phong', 'cot song', 'tua lung', 'massage', 'co vai gay', 'giu nhiet'],
    advice: 'Dân văn phòng ngồi nhiều nên rất cần đồ giảm mỏi lưng, cổ vai gáy hoặc giữ ấm đồ uống.',
  },
  {
    id: 'beauty',
    label: 'thích làm đẹp',
    patterns: ['làm đẹp', 'skincare', 'chăm sóc da', 'trang điểm', 'mỹ phẩm', 'thích son', 'chăm chút ngoại hình'],
    plainPatterns: ['lam dep', 'cham soc da', 'trang diem', 'my pham', 'thich son'],
    vibes: ['Lãng mạn & Tinh tế'],
    keywords: ['son', 'rua mat', 'lao hoa', 'nang co'],
    advice: 'Người thích làm đẹp sẽ vui với món chăm sóc da hoặc son màu an toàn, dễ dùng.',
  },
  {
    id: 'music',
    label: 'yêu âm nhạc',
    patterns: ['nghe nhạc', 'âm nhạc', 'mê nhạc', 'thích nhạc'],
    plainPatterns: ['nghe nhac', 'am nhac', 'me nhac', 'thich nhac'],
    vibes: ['Yêu công nghệ & Độc lạ', 'Chill & Chữa lành'],
    keywords: ['tai nghe', 'loa', 'bluetooth', 'chong on'],
    advice: 'Người yêu âm nhạc luôn cần một chiếc tai nghe hoặc loa ưng ý.',
  },
  {
    id: 'travel',
    label: 'thích du lịch / chụp ảnh',
    patterns: ['du lịch', 'đi phượt', 'công tác', 'chụp ảnh', 'sống ảo', 'check in', 'hay đi xa'],
    plainPatterns: ['du lich', 'di phuot', 'cong tac', 'chup anh', 'song ao', 'check in'],
    vibes: ['Yêu công nghệ & Độc lạ'],
    keywords: ['du lich', 'bo tui', 'in anh', 'mini', 'song ao', 'gon'],
    advice: 'Người hay đi đây đó thích đồ nhỏ gọn, mang theo được và giúp lưu giữ kỷ niệm.',
  },
  {
    id: 'health',
    label: 'quan tâm sức khỏe',
    patterns: ['sức khỏe', 'sức khoẻ', 'lớn tuổi', 'tuổi cao', 'người già', 'đau nhức', 'xương khớp', 'hay mệt', 'tuổi già'],
    plainPatterns: ['suc khoe', 'lon tuoi', 'tuoi cao', 'nguoi gia', 'dau nhuc', 'xuong khop'],
    vibes: ['Thực tế & Tiện ích', 'Chill & Chữa lành'],
    keywords: ['massage', 'ngam chan', 'yen chung', 'dong trung', 'cot song', 'suc khoe', 'thao duoc'],
    advice: 'Quà sức khỏe luôn là lựa chọn "chắc ăn": vừa thiết thực vừa thể hiện sự quan tâm lâu dài.',
  },
  {
    id: 'tea',
    label: 'thích trà / cà phê',
    patterns: ['uống trà', 'thích trà', 'cà phê', 'cafe', 'coffee'],
    plainPatterns: ['uong tra', 'thich tra', 'ca phe'],
    vibes: ['Thực tế & Tiện ích'],
    keywords: ['tra', 'giu nhiet'],
    advice: 'Người thích trà / cà phê sẽ dùng món quà này mỗi ngày.',
  },
  {
    id: 'minimal',
    label: 'thích tối giản',
    patterns: ['tối giản', 'đơn giản', 'gọn gàng', 'minimalist', 'nhẹ nhàng'],
    plainPatterns: ['toi gian', 'don gian', 'gon gang', 'nhe nhang'],
    vibes: ['Thực tế & Tiện ích'],
    keywords: ['toi gian', 'gon', 'nho gon'],
    advice: 'Người thích tối giản chuộng thiết kế gọn, ít chi tiết thừa.',
  },
];

export const PRODUCT_TYPES: ProductTypeHint[] = [
  { id: 'lamp', label: 'đèn ngủ', patterns: ['đèn ngủ', 'đèn'], plainPatterns: ['den ngu'], titleKeywords: ['den'] },
  { id: 'candle', label: 'nến thơm', patterns: ['nến thơm', 'nến'], plainPatterns: ['nen thom'], titleKeywords: ['nen'] },
  { id: 'lipstick', label: 'son', patterns: ['son', 'son môi', 'son kem'], plainPatterns: ['son moi', 'son kem'], titleKeywords: ['son'] },
  { id: 'flower', label: 'hoa', patterns: ['hoa', 'hoa hồng', 'hoa sáp'], plainPatterns: ['hoa hong', 'hoa sap'], titleKeywords: ['hoa hong'] },
  { id: 'jewelry', label: 'trang sức', patterns: ['vòng cổ', 'dây chuyền', 'trang sức', 'vòng tay'], plainPatterns: ['vong co', 'day chuyen', 'trang suc', 'vong tay'], titleKeywords: ['vong co', 'day chuyen'] },
  { id: 'wallet', label: 'ví', patterns: ['ví', 'bóp', 'ví da'], plainPatterns: ['vi da'], titleKeywords: ['vi da'] },
  { id: 'headphones', label: 'tai nghe', patterns: ['tai nghe'], plainPatterns: ['tai nghe'], titleKeywords: ['tai nghe'] },
  { id: 'speaker', label: 'loa', patterns: ['loa', 'loa bluetooth'], plainPatterns: ['loa bluetooth'], titleKeywords: ['loa'] },
  { id: 'thermos', label: 'bình giữ nhiệt', patterns: ['bình giữ nhiệt', 'ly giữ nhiệt', 'bình nước'], plainPatterns: ['binh giu nhiet', 'ly giu nhiet', 'binh nuoc'], titleKeywords: ['giu nhiet'] },
  { id: 'pen', label: 'bút ký', patterns: ['bút', 'bút ký'], plainPatterns: ['but ky'], titleKeywords: ['but'] },
  { id: 'scarf', label: 'khăn', patterns: ['khăn', 'khăn choàng', 'khăn lụa'], plainPatterns: ['khan choang', 'khan lua'], titleKeywords: ['khan'] },
  { id: 'tea', label: 'trà', patterns: ['trà', 'trà thảo mộc'], plainPatterns: ['tra thao moc'], titleKeywords: ['tra'] },
  { id: 'pillow', label: 'gối', patterns: ['gối', 'gối tựa', 'gối ngủ'], plainPatterns: ['goi tua', 'goi ngu'], titleKeywords: ['goi'] },
  { id: 'massage', label: 'máy massage', patterns: ['massage', 'mát xa', 'máy massage', 'máy mát xa'], plainPatterns: ['massage', 'mat xa'], titleKeywords: ['massage'] },
  { id: 'nutrition', label: 'yến / đông trùng', patterns: ['yến', 'yến sào', 'đông trùng', 'đông trùng hạ thảo'], plainPatterns: ['yen sao', 'dong trung'], titleKeywords: ['yen chung', 'dong trung'] },
  { id: 'printer', label: 'máy in ảnh', patterns: ['máy in', 'máy in ảnh', 'in ảnh'], plainPatterns: ['may in', 'in anh'], titleKeywords: ['in anh'] },
  { id: 'shaver', label: 'máy cạo râu', patterns: ['cạo râu', 'máy cạo râu'], plainPatterns: ['cao rau'], titleKeywords: ['cao rau'] },
  { id: 'skincare', label: 'đồ chăm sóc da', patterns: ['máy rửa mặt', 'rửa mặt'], plainPatterns: ['rua mat'], titleKeywords: ['rua mat'] },
  { id: 'footspa', label: 'chậu ngâm chân', patterns: ['ngâm chân', 'chậu ngâm chân'], plainPatterns: ['ngam chan'], titleKeywords: ['ngam chan'] },
];

/**
 * Gợi ý giới tính của sản phẩm theo từ khóa trong tên (CÓ DẤU, viết thường).
 * Dùng để không gợi ý son cho bạn trai hay máy cạo râu cho bạn gái.
 * Sản phẩm không khớp từ nào được coi là dùng được cho cả hai.
 */
export const GENDER_HINTS: { female: string[]; male: string[] } = {
  female: ['son', 'vòng cổ', 'dây chuyền', 'rửa mặt', 'khăn choàng', 'hoa hồng'],
  male: ['nam', 'cạo râu'],
};
