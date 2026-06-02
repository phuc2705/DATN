import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getServiceByIdApi, getServiceReviewsApi } from '../../api/service.api';
import { pricePreviewApi } from '../../api/booking.api';
import { formatPrice } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import SEO from '../../components/common/SEO';
import {
  Star, MapPin, Clock, Check, X, Shield, CreditCard,
  Users, ArrowLeft, Sparkles, ChevronDown, ChevronUp,
  Home, Briefcase, Droplets, Wind,
} from 'lucide-react';

// ── Ảnh tương ứng cho từng dịch vụ (theo slug) ───────────────────────────────
const SERVICE_IMAGES = {
  'giup-viec-theo-gio': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1679500354595-0feead204a28?w=900&auto=format&fit=crop&q=80', label: 'Lau dọn nhà cửa sạch sẽ' },
    { id: 2, url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80', label: 'Vệ sinh bếp tinh tế' },
    { id: 3, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80', label: 'Không gian sạch gọn gàng' },
  ],
  'giup-viec-dinh-ky': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1678304224523-d25b4117558f?w=900&auto=format&fit=crop&q=80', label: 'Dọn dẹp định kỳ chuyên nghiệp' },
    { id: 2, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', label: 'Nhà sạch mỗi tuần' },
    { id: 3, url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80', label: 'Bếp luôn sạch bóng' },
  ],
  'don-dep-nha-cua': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1678304224523-d25b4117558f?w=900&auto=format&fit=crop&q=80', label: 'Dọn dẹp toàn diện' },
    { id: 2, url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80', label: 'Bếp sạch bóng' },
    { id: 3, url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80', label: 'Phòng ngủ thoáng mát' },
  ],
  'tong-ve-sinh': [
    { id: 1, url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&auto=format&fit=crop&q=80', label: 'Tổng vệ sinh toàn diện' },
    { id: 2, url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&auto=format&fit=crop&q=80', label: 'Không gian sạch tinh tươm' },
    { id: 3, url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80', label: 'Vệ sinh sâu từng góc' },
  ],
  'tong-ve-sinh-deep-clean': [
    { id: 1, url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&auto=format&fit=crop&q=80', label: 'Tổng vệ sinh sâu toàn diện' },
    { id: 2, url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&auto=format&fit=crop&q=80', label: 'Không gian sạch tinh tươm' },
    { id: 3, url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80', label: 'Vệ sinh từng ngóc ngách' },
  ],
  'nau-an': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1694714103696-25e10d1b907e?w=900&auto=format&fit=crop&q=80', label: 'Bữa ăn gia đình thơm ngon' },
    { id: 2, url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&auto=format&fit=crop&q=80', label: 'Nấu nướng chuyên nghiệp' },
    { id: 3, url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=80', label: 'Nguyên liệu tươi sạch' },
  ],
  'nau-an-gia-dinh': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1694714103696-25e10d1b907e?w=900&auto=format&fit=crop&q=80', label: 'Bữa cơm gia đình ấm cúng' },
    { id: 2, url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&auto=format&fit=crop&q=80', label: 'Chế biến món ngon' },
    { id: 3, url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=80', label: 'Nguyên liệu tươi sạch' },
  ],
  'cham-soc-tre-em': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1661281306510-eee6c942a838?w=900&auto=format&fit=crop&q=80', label: 'Trông trẻ tận tâm' },
    { id: 2, url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80', label: 'Vui chơi an toàn' },
    { id: 3, url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format&fit=crop&q=80', label: 'Học bài cùng bé' },
  ],
  'trong-tre-tai-nha': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1661281306510-eee6c942a838?w=900&auto=format&fit=crop&q=80', label: 'Trông trẻ ngay tại nhà' },
    { id: 2, url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80', label: 'Bé vui chơi an lành' },
    { id: 3, url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format&fit=crop&q=80', label: 'Hỗ trợ học bài' },
  ],
  'cham-soc-nguoi-gia': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1663036976879-4baf18adfd5b?w=900&auto=format&fit=crop&q=80', label: 'Chăm sóc người cao tuổi ân cần' },
    { id: 2, url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80', label: 'Hỗ trợ sinh hoạt hàng ngày' },
    { id: 3, url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80', label: 'Không khí gia đình ấm áp' },
  ],
  'cham-soc-nguoi-cao-tuoi': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1663036976879-4baf18adfd5b?w=900&auto=format&fit=crop&q=80', label: 'Chăm sóc người thân yêu' },
    { id: 2, url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80', label: 'Hỗ trợ sinh hoạt tận tình' },
    { id: 3, url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80', label: 'Môi trường an toàn, thoải mái' },
  ],
  'giat-ui': [
    { id: 1, url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=900&auto=format&fit=crop&q=80', label: 'Giặt sạch thơm tho' },
    { id: 2, url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80', label: 'Là ủi phẳng phiu' },
    { id: 3, url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&auto=format&fit=crop&q=80', label: 'Gấp gọn gàng cẩn thận' },
  ],
  've-sinh-sofa-nem-rem': [
    { id: 1, url: 'https://images.unsplash.com/photo-1686178827149-6d55c72d81df?w=900&auto=format&fit=crop&q=80', label: 'Sofa sạch như mới' },
    { id: 2, url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80', label: 'Nệm thơm thoáng sạch khuẩn' },
    { id: 3, url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80', label: 'Rèm cửa tươi mới' },
  ],
  've-sinh-dieu-hoa': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1679943423706-570c6462f9a4?w=900&auto=format&fit=crop&q=80', label: 'Vệ sinh điều hòa chuyên nghiệp' },
    { id: 2, url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&auto=format&fit=crop&q=80', label: 'Thợ tay nghề cao' },
    { id: 3, url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80', label: 'Không khí trong lành hơn' },
  ],
  've-sinh-may-giat-thiet-bi-bep': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1667520405114-47d3677f966e?w=900&auto=format&fit=crop&q=80', label: 'Thiết bị bếp vệ sinh kỹ lưỡng' },
    { id: 2, url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80', label: 'Máy giặt sạch bóng' },
    { id: 3, url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80', label: 'Tủ lạnh khử khuẩn sâu' },
  ],
  'cham-soc-thu-cung': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1663012822996-ba7e04f3627a?w=900&auto=format&fit=crop&q=80', label: 'Thú cưng được yêu thương' },
    { id: 2, url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop&q=80', label: 'Cún cưng sạch sẽ thơm tho' },
    { id: 3, url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop&q=80', label: 'Vui đùa, ăn uống đúng giờ' },
  ],
  've-sinh-van-phong-shop': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1663011218145-c1d0c3ba3542?w=900&auto=format&fit=crop&q=80', label: 'Văn phòng sạch, chuyên nghiệp' },
    { id: 2, url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80', label: 'Không gian làm việc lý tưởng' },
    { id: 3, url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop&q=80', label: 'Sàn bóng, bụi bặm không còn' },
  ],
  've-sinh-cong-nghiep': [
    { id: 1, url: 'https://plus.unsplash.com/premium_photo-1663011218145-c1d0c3ba3542?w=900&auto=format&fit=crop&q=80', label: 'Vệ sinh công nghiệp quy mô lớn' },
    { id: 2, url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80', label: 'Thiết bị chuyên dụng hiện đại' },
    { id: 3, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', label: 'Kết quả ấn tượng' },
  ],
  'phun-khu-khuan-con-trung': [
    { id: 1, url: 'https://images.unsplash.com/photo-1593999094742-4f5280054b23?w=900&auto=format&fit=crop&q=80', label: 'Phun khử khuẩn toàn diện' },
    { id: 2, url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', label: 'Diệt khuẩn 99.9%' },
    { id: 3, url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80', label: 'An toàn cho cả gia đình' },
  ],
};

const DEFAULT_IMAGES = [
  { id: 1, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80', label: 'Dịch vụ chuyên nghiệp' },
  { id: 2, url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80', label: 'Đội ngũ tận tâm' },
  { id: 3, url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80', label: 'Kết quả hoàn hảo' },
];

// Fallback theo từ khóa trong tên dịch vụ khi slug không match
function getImagesByName(name = '') {
  const n = name.toLowerCase();
  if (n.includes('trông trẻ') || n.includes('chăm sóc trẻ')) return SERVICE_IMAGES['trong-tre-tai-nha'];
  if (n.includes('người cao tuổi') || n.includes('người già'))  return SERVICE_IMAGES['cham-soc-nguoi-cao-tuoi'];
  if (n.includes('nấu ăn'))        return SERVICE_IMAGES['nau-an-gia-dinh'];
  if (n.includes('giặt'))          return SERVICE_IMAGES['giat-ui'];
  if (n.includes('thú cưng'))      return SERVICE_IMAGES['cham-soc-thu-cung'];
  if (n.includes('điều hòa'))      return SERVICE_IMAGES['ve-sinh-dieu-hoa'];
  if (n.includes('sofa') || n.includes('nệm')) return SERVICE_IMAGES['ve-sinh-sofa-nem-rem'];
  if (n.includes('máy giặt'))      return SERVICE_IMAGES['ve-sinh-may-giat-thiet-bi-bep'];
  if (n.includes('văn phòng'))     return SERVICE_IMAGES['ve-sinh-van-phong-shop'];
  if (n.includes('khử khuẩn') || n.includes('côn trùng')) return SERVICE_IMAGES['phun-khu-khuan-con-trung'];
  if (n.includes('tổng vệ sinh'))  return SERVICE_IMAGES['tong-ve-sinh-deep-clean'];
  if (n.includes('định kỳ'))       return SERVICE_IMAGES['giup-viec-dinh-ky'];
  if (n.includes('theo giờ') || n.includes('giúp việc')) return SERVICE_IMAGES['giup-viec-theo-gio'];
  return DEFAULT_IMAGES;
}

// ── Mock data — swap với API khi backend sẵn sàng ────────────────────────────
const MOCK_SERVICE = {
  serviceId:        1,
  serviceName:      'Dọn dẹp nhà theo giờ',
  tagline:          'Dịch vụ phổ biến nhất',
  category:         'Vệ sinh & Dọn dẹp',
  basePrice:        120000,
  city:             'Hà Nội',
  rating:           4.8,
  reviewCount:      234,
  helperCount:      48,
  completedBookings: 1200,
  shortDescription: 'Dịch vụ dọn dẹp nhà cửa toàn diện theo khung giờ linh hoạt, thực hiện bởi đội ngũ người giúp việc được đào tạo bài bản và xác minh danh tính kỹ lưỡng. Chúng tôi sử dụng sản phẩm vệ sinh an toàn, thân thiện với trẻ em và thú cưng. Mỗi ca làm việc đều được ghi lại qua hệ thống check-in/check-out GPS để đảm bảo tính minh bạch và đúng giờ.',
  priceUnit: 'giờ',
  description: `Bạn bận rộn — chúng tôi lo phần còn lại. Dịch vụ dọn dẹp nhà theo giờ của CleanConnect kết nối bạn với những người giúp việc được xác minh danh tính, có kinh nghiệm thực tế và được đánh giá bởi cộng đồng khách hàng thật.

Mỗi người giúp việc trải qua quy trình xác minh CCCD, kiểm tra lý lịch tư pháp và phỏng vấn trực tiếp trước khi được nhận vào hệ thống. Chúng tôi chỉ chấp nhận những ứng viên đạt điểm đánh giá từ 4.5 trở lên sau giai đoạn thử việc.

Toàn bộ ca làm việc được theo dõi qua hệ thống check-in/check-out GPS — bạn nhận thông báo khi người giúp việc đến và hoàn thành công việc. Sản phẩm vệ sinh an toàn, không mùi hắc, thân thiện với trẻ nhỏ và thú cưng.`,
  images: [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',
      label: 'Phòng khách sạch bóng, không tì vết',
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80',
      label: 'Bếp sáng bóng sau khi vệ sinh sâu',
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
      label: 'Phòng ngủ gọn gàng, thoáng mát',
    },
  ],
  includes: [
    'Lau sàn toàn bộ các phòng (kể cả góc khuất)',
    'Vệ sinh nhà bếp: bếp ga/từ, bồn rửa, mặt bàn, tủ lạnh ngoài',
    'Lau dọn nhà vệ sinh và phòng tắm sạch khuẩn',
    'Hút bụi thảm, sofa và các góc chân tường',
    'Lau kính cửa sổ, gương và bề mặt bóng',
    'Dọn và lau bàn ghế, kệ tủ, đồ trang trí',
    'Đổ rác, thay túi rác và vệ sinh thùng rác',
    'Quét mạng nhện trần nhà, quạt trần và cánh cửa',
  ],
  excludes: [
    'Giặt ủi quần áo (có dịch vụ riêng)',
    'Vệ sinh bên trong điều hòa, lò vi sóng, lò nướng',
    'Vệ sinh bên ngoài tòa nhà, ban công tầng cao',
    'Di chuyển đồ nặng hoặc lắp ráp nội thất',
  ],
  highlights: [
    { Icon: Shield,     text: 'Xác minh CCCD & lý lịch tư pháp' },
    { Icon: Clock,      text: 'Đúng giờ, GPS check-in/out thực tế' },
    { Icon: CreditCard, text: 'Giá cố định theo giờ, không phát sinh' },
    { Icon: Users,      text: '48 người giúp việc đã xác minh sẵn sàng' },
  ],
  ratingBreakdown: { 5: 178, 4: 38, 3: 12, 2: 4, 1: 2 },
};

const MOCK_REVIEWS = [
  {
    id: 1, name: 'Nguyễn Thị Lan',  avatar: 'L', avatarBg: 'from-orange-400 to-orange-600',
    rating: 5, date: 'Tháng 5, 2026',
    text: 'Chị giúp việc đến đúng giờ, làm việc rất tỉ mỉ và cẩn thận. Nhà tôi sạch bóng từng góc khuất. Tôi đặt lịch định kỳ hàng tuần rồi, rất hài lòng!',
    helperName: 'Chị Hương',
  },
  {
    id: 2, name: 'Trần Văn Minh',   avatar: 'M', avatarBg: 'from-blue-400 to-blue-600',
    rating: 5, date: 'Tháng 5, 2026',
    text: 'Lần đầu dùng dịch vụ trực tuyến mà tôi rất yên tâm. Ứng dụng dễ dùng, đặt lịch chỉ mất 2 phút. Người giúp việc được xác minh đầy đủ, không lo lắng gì.',
    helperName: 'Chị Mai',
  },
  {
    id: 3, name: 'Phạm Thị Hoa',    avatar: 'H', avatarBg: 'from-pink-400 to-pink-600',
    rating: 4, date: 'Tháng 4, 2026',
    text: 'Nhìn chung rất tốt, chị làm nhanh và gọn. Tôi chỉ góp ý nhỏ là lần sau nên chú ý góc bếp hơn một chút. Dù sao vẫn rất hài lòng, sẽ tiếp tục ủng hộ!',
    helperName: 'Chị Ngọc',
  },
  {
    id: 4, name: 'Lê Thành Nam',    avatar: 'N', avatarBg: 'from-teal-400 to-emerald-600',
    rating: 5, date: 'Tháng 4, 2026',
    text: 'Tôi thuê theo tháng, 4 lần/tháng. Giá hợp lý, chất lượng ổn định từ lần đầu đến nay. Đây là dịch vụ tôi giới thiệu cho bạn bè và đồng nghiệp nhiều nhất.',
    helperName: 'Chị Thu',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

// Tách danh sách BAO GỒM / KHÔNG BAO GỒM từ trường description khi API không trả includes[]
function parseIncludes(description) {
  if (!description) return [];
  const m = description.match(/BAO GỒM:\s*([^\n]+)/);
  if (!m) return [];
  return m[1].split(';').map(s => s.trim()).filter(Boolean);
}
function parseExcludes(description) {
  if (!description) return [];
  const m = description.match(/KHÔNG BAO GỒM:\s*([^\n]+)/);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

// ── Sub-component: StarRating ────────────────────────────────────────────────
function StarRating({ rating, size = 'md', showEmpty = true }) {
  const filled = Math.round(Number(rating) || 0);
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < filled
              ? 'text-yellow-400 fill-yellow-400'
              : showEmpty
                ? 'text-gray-200 fill-gray-200'
                : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ── Sub-component: RatingBar (thanh phân bổ đánh giá) ───────────────────────
function RatingBreakdownBars({ breakdown, total }) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-3 text-right flex-shrink-0">{star}</span>
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            {/* Thanh bar — Airbnb dùng màu ink cho filled portion */}
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-800 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-component: ReviewCard ────────────────────────────────────────────────
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 160;
  const displayText = isLong && !expanded ? review.text.slice(0, 160) + '…' : review.text;

  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.avatarBg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {review.avatar}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-gray-400">{review.date}</span>
          </div>
        </div>
        {review.helperName && (
          <span className="ml-auto text-xs text-gray-400 flex-shrink-0 hidden sm:block">
            Phục vụ bởi {review.helperName}
          </span>
        )}
      </div>

      {/* Review text */}
      <p className="text-sm text-gray-600 leading-relaxed">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 mt-2 text-sm font-semibold text-gray-900 hover:text-orange-500 transition-colors underline"
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

// ── Sub-component: PhotoGallery ──────────────────────────────────────────────
function PhotoGallery({ images }) {
  const [main, ...thumbs] = images;
  return (
    <div className="rounded-2xl overflow-hidden mb-8">
      <div className="grid grid-cols-2 grid-rows-2 h-[380px] md:h-[460px] gap-2">
        {/* Ảnh chính — chiếm toàn bộ cột trái */}
        <div className="row-span-2 relative group cursor-pointer overflow-hidden bg-gray-100">
          <img
            src={main.url}
            alt={main.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Gradient overlay + label */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
            {main.label}
          </span>
        </div>
        {/* 2 thumbnail nhỏ — cột phải */}
        {thumbs.slice(0, 2).map((img) => (
          <div key={img.id} className="relative group cursor-pointer overflow-hidden bg-gray-100">
            <img
              src={img.url}
              alt={img.label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow">
              {img.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-component: BookingWidget (card sticky bên phải) ──────────────────────
function BookingWidget({ service, sharedDate, setSharedDate, sharedStart, setSharedStart, sharedEnd, setSharedEnd }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Dùng shared state từ parent (để MobileStickyBar cũng biết)
  const date      = sharedDate  ?? '';
  const startTime = sharedStart ?? '';
  const endTime   = sharedEnd   ?? '';
  const setDate      = setSharedDate  ?? (() => {});
  const setStartTime = setSharedStart ?? (() => {});
  const setEndTime   = setSharedEnd   ?? (() => {});

  const [priceData, setPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  // Dùng giờ Việt Nam (UTC+7) cho min/max date
  const getVNNow  = () => new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayVN   = getVNNow().toISOString().slice(0, 10);
  const maxDateVN = (() => {
    const d = getVNNow();
    d.setUTCDate(d.getUTCDate() + 30);
    return d.toISOString().slice(0, 10);
  })();

  // Tính giá preview khi chọn đủ giờ
  useEffect(() => {
    if (!startTime || !endTime || startTime >= endTime) { setPriceData(null); return; }
    const t = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const { data } = await pricePreviewApi({
          serviceId: service.serviceId,
          startTime,
          endTime,
        });
        setPriceData(data.data);
      } catch { setPriceData(null); }
      finally { setPriceLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [service.serviceId, startTime, endTime]);

  const canBook = date && startTime && endTime && startTime < endTime && !dateError;

  const handleBook = () => {
    if (!user) {
      navigate(`/login?redirect=/services/${service.serviceId}`);
      return;
    }
    // Validate ngày không được là quá khứ
    if (date < todayVN) {
      setDateError('Không thể đặt lịch cho ngày đã qua. Vui lòng chọn từ hôm nay trở đi.');
      return;
    }
    if (date > maxDateVN) {
      setDateError('Chỉ có thể đặt lịch trước tối đa 30 ngày.');
      return;
    }
    const params = new URLSearchParams({ serviceId: service.serviceId });
    if (date)      params.set('date', date);
    if (startTime) params.set('startTime', startTime);
    if (endTime)   params.set('endTime', endTime);
    navigate(`/bookings/new?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px' }}>
      {/* Giá */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900">{formatPrice(service.basePrice)}</span>
          <span className="text-gray-500 text-sm font-normal">/{service.priceUnit || service.price_unit || 'giờ'}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{service.rating}</span>
          <span className="text-gray-400 text-sm">({service.reviewCount} đánh giá)</span>
        </div>
      </div>

      {/* Form chọn ngày & giờ */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        {/* Ngày */}
        <div className="border-b border-gray-200">
          <label className="block px-4 pt-3 pb-0.5 text-[11px] font-semibold text-gray-900 uppercase tracking-wider">
            Ngày làm việc
          </label>
          <input
            type="date"
            min={todayVN}
            max={maxDateVN}
            value={date}
            onChange={(e) => { setDate(e.target.value); setDateError(''); }}
            className="block w-full px-4 pb-3 text-sm text-gray-700 bg-transparent focus:outline-none"
          />
        </div>
        {/* Giờ bắt đầu / kết thúc */}
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div>
            <label className="block px-4 pt-3 pb-0.5 text-[11px] font-semibold text-gray-900 uppercase tracking-wider">
              Giờ bắt đầu
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="block w-full px-4 pb-3 text-sm text-gray-700 bg-transparent focus:outline-none"
            />
          </div>
          <div>
            <label className="block px-4 pt-3 pb-0.5 text-[11px] font-semibold text-gray-900 uppercase tracking-wider">
              Giờ kết thúc
            </label>
            <input
              type="time"
              value={endTime}
              min={startTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full px-4 pb-3 text-sm text-gray-700 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Validation hints */}
      {dateError && (
        <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
          <X className="w-3.5 h-3.5 shrink-0" /> {dateError}
        </p>
      )}
      {startTime && endTime && startTime >= endTime && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Giờ kết thúc phải sau giờ bắt đầu
        </p>
      )}

      {/* Price preview */}
      {priceLoading && (
        <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400 mb-4 animate-pulse">
          Đang tính giá...
        </div>
      )}
      {priceData && !priceLoading && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ</span>
            <span>{formatPrice(priceData.basePrice)}</span>
          </div>
          {priceData.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giảm giá</span>
              <span>−{formatPrice(priceData.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 border-t border-orange-100 pt-2">
            <span>Tổng dự kiến</span>
            <span className="text-orange-500">{formatPrice(priceData.totalPrice)}</span>
          </div>
        </div>
      )}

      {/* CTA Button — Airbnb: 48px height, primary fill, rounded-xl (8px) */}
      <button
        onClick={handleBook}
        disabled={!canBook}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-200 disabled:to-orange-200 disabled:text-white/80 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {canBook ? 'Đặt lịch ngay' : 'Chọn ngày & giờ để đặt lịch'}
      </button>

      {/* Cam kết */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Chưa bị tính tiền cho đến khi xác nhận
      </p>

      {/* Divider */}
      <div className="border-t border-gray-100 my-5" />

      {/* Trust badges */}
      <div className="space-y-3">
        {[
          { Icon: Shield,     text: 'Người giúp việc xác minh CCCD' },
          { Icon: CreditCard, text: 'Giá cố định, không phí ẩn'     },
          { Icon: Clock,      text: 'Đúng giờ hoặc hoàn tiền'        },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Chia sẻ booking state giữa BookingWidget và MobileStickyBar
  const [sharedDate, setSharedDate]   = useState('');
  const [sharedStart, setSharedStart] = useState('');
  const [sharedEnd, setSharedEnd]     = useState('');

  useEffect(() => {
    setLoading(true);
    // Thử load từ API; nếu lỗi thì dùng mock data
    getServiceByIdApi(serviceId)
      .then(({ data }) => {
        setService(data.data || MOCK_SERVICE);
      })
      .catch(() => {
        setService(MOCK_SERVICE);
      });

    getServiceReviewsApi(serviceId)
      .then(({ data }) => {
        setReviews(data.data?.reviews || MOCK_REVIEWS);
      })
      .catch(() => {
        setReviews(MOCK_REVIEWS);
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-48 mb-6" />
        <div className="h-[380px] bg-gray-100 rounded-2xl mb-8" />
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-px bg-gray-100 my-6" />
            <div className="space-y-2">
              {[80,60,90,70].map((w) => <div key={w} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />)}
            </div>
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!service) return null;

  // Tách description thành paragraphs
  const descParagraphs = (service.description || '').trim().split('\n\n');
  const descShort = descParagraphs[0];
  const descHasMore = descParagraphs.length > 1;
  const shortDesc = service.shortDescription || service.short_description;
  const priceUnit = service.priceUnit || service.price_unit || 'giờ';
  const includes = service.includes || parseIncludes(service.description);
  const excludes = service.excludes || parseExcludes(service.description);
  const totalRatings = Object.values(service.ratingBreakdown || {}).reduce((s, v) => s + v, 0);
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);
  const serviceImages = service.images || SERVICE_IMAGES[service.slug] || getImagesByName(service.serviceName);

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.serviceName,
    description: shortDesc || descShort,
    provider: { '@type': 'LocalBusiness', name: 'CleanConnect' },
    areaServed: { '@type': 'City', name: 'Hà Nội' },
    offers: {
      '@type': 'Offer',
      price: service.basePrice,
      priceCurrency: 'VND',
      priceSpecification: { '@type': 'UnitPriceSpecification', unitText: priceUnit },
    },
    aggregateRating: service.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: service.rating,
      reviewCount: service.reviewCount,
    } : undefined,
  };

  return (
    <div className="animate-fadeIn pb-24 lg:pb-0">
      <SEO
        title={service.serviceName}
        description={`${shortDesc || descShort || service.serviceName} – Đặt lịch ngay từ ${formatPrice(service.basePrice)}/${priceUnit} tại CleanConnect Hà Nội.`}
        canonical={`/services/${service.serviceId}`}
        jsonLd={serviceJsonLd}
      />

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/" className="hover:text-orange-500 transition-colors">Dịch vụ</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{service.serviceName}</span>
      </nav>

      {/* ── Photo gallery ───────────────────────────────────────────────────── */}
      <PhotoGallery images={serviceImages} />

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <div className="min-w-0">

          {/* Service header */}
          <div className="mb-6">
            {/* Eyebrow — Airbnb dùng uppercase tracking-wider cho category labels */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border border-orange-100">
                <Sparkles className="w-3 h-3" />
                {service.tagline || service.category}
              </span>
            </div>

            {/* Title — Airbnb display-xl: 28px / 700 */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {service.serviceName}
            </h1>

            {/* Rating + meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-gray-900">{service.rating}</span>
                <span className="text-orange-500 underline cursor-pointer">
                  ({service.reviewCount} đánh giá)
                </span>
              </div>
              <span className="text-gray-300 hidden sm:block">·</span>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {service.city}
              </div>
              <span className="text-gray-300 hidden sm:block">·</span>
              <span className="text-gray-600">{service.completedBookings?.toLocaleString()}+ đơn hoàn thành</span>
            </div>
          </div>

          {/* Divider — Airbnb hairline: #dddddd */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Highlights (4 đặc điểm nổi bật) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(service.highlights || MOCK_SERVICE.highlights).map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Description */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Về dịch vụ này</h2>
            <div className="text-base text-gray-700 leading-relaxed space-y-3">
              {shortDesc
                ? <p>{shortDesc}</p>
                : descExpanded
                  ? descParagraphs.map((p, i) => <p key={i}>{p}</p>)
                  : <p>{descShort}</p>
              }
            </div>
            {!shortDesc && descHasMore && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="flex items-center gap-1.5 mt-4 text-sm font-semibold text-gray-900 hover:text-orange-500 transition-colors underline"
              >
                {descExpanded ? 'Thu gọn' : 'Xem thêm về dịch vụ'}
                {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </section>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Dịch vụ bao gồm & không bao gồm */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Dịch vụ bao gồm</h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-5">
              {includes.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* Không bao gồm */}
            {excludes.length > 0 && (
              <>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Không bao gồm
                </p>
                <div className="space-y-2">
                  {excludes.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-500">{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-6" />

          {/* [Mobile only] BookingWidget inline */}
          <div className="lg:hidden mb-8" id="booking-widget-inline">
            <BookingWidget service={service}
              sharedDate={sharedDate} setSharedDate={setSharedDate}
              sharedStart={sharedStart} setSharedStart={setSharedStart}
              sharedEnd={sharedEnd} setSharedEnd={setSharedEnd}
            />
          </div>

          {/* Divider (mobile) */}
          <div className="border-t border-gray-200 mb-6 lg:hidden" />

          {/* Reviews section */}
          <section>
            {/* Summary header — Airbnb style: large rating number + stars */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-8 mb-6">
              <div className="text-center sm:text-left">
                <div className="text-5xl font-bold text-gray-900 leading-none mb-1">
                  {service.rating}
                </div>
                <StarRating rating={service.rating} size="lg" />
                <p className="text-sm text-gray-500 mt-1">{service.reviewCount} đánh giá</p>
              </div>
              <div className="flex-1">
                <RatingBreakdownBars
                  breakdown={service.ratingBreakdown || MOCK_SERVICE.ratingBreakdown}
                  total={totalRatings}
                />
              </div>
            </div>

            {/* Review cards — 1 column (each with bottom border, like Airbnb) */}
            <div className="grid md:grid-cols-2 gap-x-10">
              {displayedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {reviews.length > 4 && (
              <button
                onClick={() => setShowAllReviews((v) => !v)}
                className="mt-4 px-6 py-3 border-2 border-gray-900 text-gray-900 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                {showAllReviews
                  ? 'Ẩn bớt đánh giá'
                  : `Xem tất cả ${reviews.length} đánh giá`}
              </button>
            )}
          </section>

        </div>
        {/* ════════════════ END LEFT ════════════════ */}

        {/* ════════════════ RIGHT COLUMN — STICKY WIDGET ════════════════ */}
        <div className="hidden lg:block lg:sticky lg:top-8">
          <BookingWidget service={service}
            sharedDate={sharedDate} setSharedDate={setSharedDate}
            sharedStart={sharedStart} setSharedStart={setSharedStart}
            sharedEnd={sharedEnd} setSharedEnd={setSharedEnd}
          />

          {/* Liên hệ hỗ trợ */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Cần hỗ trợ?{' '}
            <a href="#" className="font-semibold text-gray-900 underline hover:text-orange-500 transition-colors">
              Liên hệ chúng tôi
            </a>
          </p>
        </div>
        {/* ════════════════ END RIGHT ════════════════ */}

      </div>

      {/* ── Mobile sticky bottom bar (chỉ hiện trên < lg) ──────────────────── */}
      <MobileStickyBar service={service}
        bookingDate={sharedDate} bookingStart={sharedStart} bookingEnd={sharedEnd}
      />
    </div>
  );
}

// ── Sub-component: MobileStickyBar ───────────────────────────────────────────
function MobileStickyBar({ service, bookingDate, bookingStart, bookingEnd }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const hasFullBooking = bookingDate && bookingStart && bookingEnd;

  const handleBook = () => {
    if (!user) {
      navigate(`/login?redirect=/services/${service.serviceId}`);
      return;
    }
    if (!hasFullBooking) {
      // Chưa chọn ngày/giờ → scroll đến inline widget để user điền
      document.getElementById('booking-widget-inline')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const params = new URLSearchParams({ serviceId: service.serviceId });
    params.set('date', bookingDate);
    params.set('startTime', bookingStart);
    params.set('endTime', bookingEnd);
    navigate(`/bookings/new?${params.toString()}`);
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
      style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}
    >
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">{formatPrice(service.basePrice)}</span>
          <span className="text-sm text-gray-500">/{service.priceUnit || service.price_unit || 'giờ'}</span>
        </div>
        {hasFullBooking ? (
          <p className="text-xs text-orange-500 font-medium mt-0.5">{bookingDate} · {bookingStart}–{bookingEnd}</p>
        ) : (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">{service.rating}</span>
            <span className="text-xs text-gray-400">({service.reviewCount})</span>
          </div>
        )}
      </div>
      <button
        onClick={handleBook}
        className="flex-1 max-w-[200px] h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md"
      >
        {hasFullBooking ? 'Đặt lịch ngay' : 'Chọn ngày & giờ ↑'}
      </button>
    </div>
  );
}
