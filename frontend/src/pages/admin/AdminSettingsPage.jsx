// Trang cài đặt hệ thống — Linear dark theme (giống AdminReviewsPage)
import { useEffect, useState } from 'react';
import { getAdminSettingsApi, updateAdminSettingsApi } from '../../api/admin.api';
import toast from 'react-hot-toast';

// Design tokens Linear dark
const C = {
  canvas:   '#010102',
  surface1: '#0f1117',
  surface2: '#1e2028',
  hairline: '#23252a',
  primary:  '#5e6ad2',
  primary2: '#828fff',
  ink:      '#f7f8f8',
  muted:    '#8a8f98',
  dim:      '#62666d',
  inkMuted: '#d0d6e0',
};

export default function AdminSettingsPage() {
  // Tỷ lệ hoa hồng hiện tại (lưu dưới dạng phần trăm 0-100 để hiển thị)
  const [commissionPct, setCommissionPct] = useState('');
  const [inputPct, setInputPct] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tải cài đặt hiện tại khi mount
  useEffect(() => {
    setLoading(true);
    getAdminSettingsApi()
      .then(({ data }) => {
        const rate = data.data?.platformCommissionRate ?? 0.10;
        const pct = (rate * 100).toFixed(2).replace(/\.00$/, '');
        setCommissionPct(pct);
        setInputPct(pct);
      })
      .catch(() => toast.error('Không thể tải cài đặt hệ thống'))
      .finally(() => setLoading(false));
  }, []);

  // Lưu cài đặt
  const handleSave = async () => {
    const pct = parseFloat(inputPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Tỷ lệ hoa hồng phải từ 0% đến 100%');
      return;
    }
    const rate = pct / 100; // chuyển về dạng 0-1 để gửi lên API
    setSaving(true);
    try {
      const { data } = await updateAdminSettingsApi({ platformCommissionRate: rate });
      const saved = data.data?.platformCommissionRate ?? rate;
      const savedPct = (saved * 100).toFixed(2).replace(/\.00$/, '');
      setCommissionPct(savedPct);
      setInputPct(savedPct);
      toast.success('Đã lưu cài đặt hệ thống!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu cài đặt thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Tính ví dụ phân chia với đơn 100,000đ
  const exampleAmount = 100000;
  const currentRate = parseFloat(commissionPct) / 100 || 0.10;
  const examplePlatform = Math.round(exampleAmount * currentRate).toLocaleString('vi-VN');
  const exampleHelper = Math.round(exampleAmount * (1 - currentRate)).toLocaleString('vi-VN');

  // Tính ví dụ với giá trị đang nhập (preview realtime)
  const previewRate = parseFloat(inputPct) / 100;
  const previewValid = !isNaN(previewRate) && previewRate >= 0 && previewRate <= 1;
  const previewPlatform = previewValid ? Math.round(exampleAmount * previewRate).toLocaleString('vi-VN') : '—';
  const previewHelper = previewValid ? Math.round(exampleAmount * (1 - previewRate)).toLocaleString('vi-VN') : '—';

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>Cài đặt hệ thống</h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
          Quản lý các thông số vận hành của nền tảng CleanConnect
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#5e6ad2]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Card: Tỷ lệ hoa hồng */}
          <div
            style={{
              backgroundColor: C.surface1,
              border: `1px solid ${C.hairline}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: C.ink, margin: 0 }}>
                Tỷ lệ hoa hồng nền tảng
              </h2>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                Phần trăm Admin thu từ mỗi đơn hàng thanh toán thành công.
                Phần còn lại ({previewValid ? (100 - parseFloat(inputPct)).toFixed(2).replace(/\.00$/, '') : '—'}%)
                sẽ được tính vào thu nhập của người giúp việc.
              </p>
            </div>

            {/* Hiển thị tỷ lệ hiện tại */}
            <div
              style={{
                backgroundColor: C.surface2,
                border: `1px solid ${C.hairline}`,
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                Tỷ lệ hiện tại
              </span>
              <span style={{ fontSize: 28, fontWeight: 800, color: C.primary2, letterSpacing: '-0.5px' }}>
                {commissionPct}%
              </span>
            </div>

            {/* Input thay đổi */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tỷ lệ mới (%)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={inputPct}
                    onChange={(e) => setInputPct(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0a0b0f',
                      border: `1px solid ${C.hairline}`,
                      borderRadius: 8,
                      padding: '10px 44px 10px 14px',
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.ink,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px rgba(94,106,210,0.15)`; }}
                    onBlur={(e) => { e.target.style.borderColor = C.hairline; e.target.style.boxShadow = 'none'; }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: C.dim }}>%</span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? C.surface2 : C.primary,
                    color: saving ? C.muted : '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = C.primary2; }}
                  onMouseLeave={(e) => { if (!saving) e.currentTarget.style.backgroundColor = C.primary; }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>

          {/* Card: Ví dụ phân chia (preview realtime) */}
          <div
            style={{
              backgroundColor: C.surface1,
              border: `1px solid ${C.hairline}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, color: C.ink, margin: '0 0 4px 0' }}>
              Ví dụ phân chia doanh thu
            </h2>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 0, marginBottom: 16 }}>
              Dựa trên tỷ lệ đang nhập — cập nhật trực tiếp khi bạn thay đổi con số.
            </p>

            <div
              style={{
                backgroundColor: C.surface2,
                border: `1px solid ${C.hairline}`,
                borderRadius: 8,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 13, color: C.dim, marginBottom: 10, fontWeight: 500 }}>
                Đơn hàng: <span style={{ color: C.inkMuted, fontWeight: 700 }}>100,000đ</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {/* Helper */}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                    Helper nhận
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: '#34d399', letterSpacing: '-0.5px' }}>
                    {previewHelper}đ
                  </p>
                </div>
                {/* Separator */}
                <div style={{ width: 1, backgroundColor: C.hairline, alignSelf: 'stretch' }} />
                {/* Platform */}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                    Nền tảng thu
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: C.primary2, letterSpacing: '-0.5px' }}>
                    {previewPlatform}đ
                  </p>
                </div>
              </div>
            </div>

            {/* Lưu ý */}
            <p style={{ fontSize: 12, color: C.dim, marginTop: 12, lineHeight: 1.6 }}>
              Tỷ lệ mới chỉ áp dụng cho các đơn hàng được thanh toán sau khi lưu.
              Các đơn hàng cũ đã thanh toán giữ nguyên tỷ lệ hoa hồng tại thời điểm giao dịch.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
