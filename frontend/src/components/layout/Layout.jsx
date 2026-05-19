import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import { Phone, Mail, MapPin } from 'lucide-react';

const FOOTER_LINKS = {
  'Dịch vụ': ['Dọn dẹp nhà', 'Nấu ăn theo giờ', 'Giặt ủi', 'Vệ sinh điều hòa', 'Vệ sinh tổng thể'],
  'Hỗ trợ':  ['Câu hỏi thường gặp', 'Liên hệ hỗ trợ', 'Hướng dẫn đặt lịch', 'Chính sách hoàn tiền'],
  'Về chúng tôi': ['Giới thiệu', 'Tuyển dụng', 'Blog', 'Báo chí'],
};

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="ConnectClean" className="h-9 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Nền tảng kết nối người giúp việc gia đình chuyên nghiệp với hàng nghìn gia đình trên toàn quốc.
              </p>
              <div className="flex gap-3">
                {[
                  { label: 'Facebook', icon: 'f', href: '#' },
                  { label: 'Zalo', icon: 'Z', href: '#' },
                  { label: 'Youtube', icon: '▶', href: '#' },
                ].map((s) => (
                  <a key={s.label} href={s.href}
                    className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-orange-500 flex items-center justify-center text-sm font-bold transition-colors"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-white font-semibold mb-4">{category}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact & Cities */}
          <div className="border-t border-gray-800 pt-8 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Liên hệ</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400 shrink-0" /> Hotline: <span className="text-orange-400 font-medium">1800 1234</span> (miễn phí 24/7)</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400 shrink-0" /> Email: <span className="text-orange-400">support@connectclean.vn</span></p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400 shrink-0" /> Trụ sở: 3 Cầu Giấy, Hà Nội</p>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Đang phục vụ tại</h3>
                <div className="flex flex-wrap gap-2">
                  {['Hà Nội'].map((city) => (
                    <span key={city} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500">
            <p>© 2026 ConnectClean - ĐATN của Nguyễn Trọng Phúc</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-300 transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
