import { useEffect, useState } from 'react';
import {
  getAdminPromotionsApi,
  createPromotionApi,
  updatePromotionApi,
  deletePromotionApi,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, X, Pencil, Tag, Users, RefreshCw, Copy } from 'lucide-react';

// Dữ liệu trống cho form tạo mã mới
const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  startDate: '',
  endDate: '',
};

// CSS class dùng chung
const inputCls = 'w-full bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm transition-all';
const labelCls = 'block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5';

// Form tạo / chỉnh sửa mã khuyến mãi
function PromoForm({ initial = EMPTY_FORM, onSubmit, saving, submitLabel, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <div>
        <label className={labelCls}>Mã code <span className="text-red-400">*</span></label>
        <input
          required
          className={`${inputCls} font-mono uppercase tracking-widest`}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
          placeholder="VD: SUMMER20"
        />
      </div>
      <div>
        <label className={labelCls}>Loại giảm giá</label>
        <select className={inputCls} value={form.discountType} onChange={set('discountType')}>
          <option value="percentage">Phần trăm (%)</option>
          <option value="fixed">Số tiền cố định (VND)</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Giá trị giảm <span className="text-red-400">*</span></label>
        <input
          required
          type="number"
          min="0"
          className={inputCls}
          value={form.discountValue}
          onChange={set('discountValue')}
          placeholder={form.discountType === 'percentage' ? '10 (= 10%)' : '50000'}
        />
      </div>
      <div>
        <label className={labelCls}>Đơn tối thiểu (VND)</label>
        <input
          type="number"
          min="0"
          className={inputCls}
          value={form.minOrderAmount}
          onChange={set('minOrderAmount')}
          placeholder="Để trống = không giới hạn"
        />
      </div>
      <div>
        <label className={labelCls}>Số lần dùng tối đa</label>
        <input
          type="number"
          min="1"
          className={inputCls}
          value={form.maxUses}
          onChange={set('maxUses')}
          placeholder="Để trống = không giới hạn"
        />
      </div>
      <div />
      <div>
        <label className={labelCls}>Ngày bắt đầu <span className="text-red-400">*</span></label>
        <input required type="date" className={inputCls} value={form.startDate} onChange={set('startDate')} />
      </div>
      <div>
        <label className={labelCls}>Ngày kết thúc <span className="text-red-400">*</span></label>
        <input required type="date" className={inputCls} value={form.endDate} onChange={set('endDate')} />
      </div>
      <div className="sm:col-span-2 flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// Modal chỉnh sửa mã khuyến mãi
function EditModal({ promo, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);

  const initial = {
    code: promo.code,
    discountType: promo.discountType,
    discountValue: String(promo.discountValue),
    minOrderAmount: promo.minOrderAmount ? String(promo.minOrderAmount) : '',
    maxUses: promo.maxUses ? String(promo.maxUses) : '',
    startDate: promo.startDate?.slice(0, 10) || '',
    endDate: promo.endDate?.slice(0, 10) || '',
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      await updatePromotionApi(promo.promoId, {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success('Đã cập nhật mã khuyến mãi!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Chỉnh sửa mã khuyến mãi</h3>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <PromoForm
            initial={initial}
            onSubmit={handleSubmit}
            saving={saving}
            submitLabel="Lưu thay đổi"
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// Modal xem danh sách người đã dùng mã
function UsageModal({ promo, onClose }) {
  // API hiện tại chưa trả danh sách user dùng mã; hiển thị thống kê tổng
  // Nếu backend bổ sung endpoint /api/admin/promotions/:id/usages thì có thể fetch ở đây
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-gray-900">Lịch sử sử dụng mã</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono uppercase tracking-widest">{promo.code}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {/* Thống kê tóm tắt */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{promo.usedCount ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Lần đã dùng</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900">
                {promo.maxUses ? `${promo.maxUses - (promo.usedCount ?? 0)}` : '∞'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Còn lại</p>
            </div>
          </div>

          {/* Chi tiết mã */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Loại giảm giá</span>
              <span className="font-semibold text-gray-700">
                {promo.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Giá trị</span>
              <span className="font-semibold text-[#828fff]">
                {promo.discountType === 'percentage'
                  ? `${promo.discountValue}%`
                  : `${Number(promo.discountValue).toLocaleString('vi-VN')}đ`}
              </span>
            </div>
            {promo.minOrderAmount && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">Đơn tối thiểu</span>
                <span className="font-semibold text-gray-700">{Number(promo.minOrderAmount).toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Thời hạn</span>
              <span className="font-semibold text-gray-700">{formatDate(promo.startDate)} → {formatDate(promo.endDate)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Trạng thái</span>
              <span className={`font-semibold ${promo.isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                {promo.isActive ? 'Đang hoạt động' : 'Đã tắt'}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Danh sách chi tiết người dùng sẽ hiển thị khi backend cung cấp API usage log
          </p>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Kiểm tra mã có đang trong thời hạn không
function isExpired(endDate) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

// Hiển thị giá trị giảm giá dạng badge
function DiscountBadge({ type, value }) {
  return (
    <span className="inline-flex items-center bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20 text-xs font-bold px-2 py-0.5 rounded">
      {type === 'percentage' ? `${value}%` : `${Number(value).toLocaleString('vi-VN')}đ`}
    </span>
  );
}

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingUsage, setViewingUsage] = useState(null);

  // Tải danh sách mã khuyến mãi
  const refresh = () => {
    setLoading(true);
    getAdminPromotionsApi()
      .then(({ data }) => setPromos(data.data || []))
      .catch(() => toast.error('Không thể tải danh sách khuyến mãi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  // Tạo mã mới
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await createPromotionApi({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      });
      toast.success('Đã tạo mã khuyến mãi!');
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo mã');
    } finally {
      setSaving(false);
    }
  };

  // Bật/tắt mã khuyến mãi
  const handleToggle = async (promoId, isActive) => {
    try {
      await updatePromotionApi(promoId, { isActive: !isActive });
      toast.success(isActive ? 'Đã tắt mã' : 'Đã bật mã');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Xóa mã khuyến mãi
  const handleDelete = async (promoId, code) => {
    if (!window.confirm(`Xóa mã "${code}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deletePromotionApi(promoId);
      toast.success('Đã xóa mã khuyến mãi');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Copy mã vào clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(
      () => toast.success(`Đã copy mã: ${code}`),
      () => toast.error('Không thể copy')
    );
  };

  const activeCount  = promos.filter((p) => p.isActive && !isExpired(p.endDate)).length;
  const expiredCount = promos.filter((p) => isExpired(p.endDate)).length;

  return (
    <div className="animate-fadeIn">
      {/* Modals */}
      {editing && (
        <EditModal
          promo={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
      {viewingUsage && (
        <UsageModal
          promo={viewingUsage}
          onClose={() => setViewingUsage(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
          <p className="text-gray-500 text-sm mt-1">
            {promos.length} mã khuyến mãi
            {activeCount > 0 && (
              <span className="ml-2 inline-flex items-center bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-bold px-2 py-0.5 rounded">
                {activeCount} đang hoạt động
              </span>
            )}
            {expiredCount > 0 && (
              <span className="ml-2 inline-flex items-center bg-red-400/10 text-red-400 border border-red-400/20 text-xs font-bold px-2 py-0.5 rounded">
                {expiredCount} đã hết hạn
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo mã mới
          </button>
        </div>
      </div>

      {/* Form tạo mã mới (inline expand) */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 border border-[#5e6ad2]/20 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Tạo mã khuyến mãi mới</h3>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <PromoForm
            onSubmit={handleCreate}
            saving={saving}
            submitLabel="Tạo mã khuyến mãi"
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Tag className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">Chưa có mã khuyến mãi nào</p>
          <p className="text-gray-400 text-sm mt-1">Tạo mã đầu tiên để thu hút khách hàng</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo mã mới
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: bảng */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  {['Mã code', 'Loại / Giá trị', 'Đơn tối thiểu', 'Lượt dùng', 'Thời hạn', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promos.map((p) => {
                  const expired = isExpired(p.endDate);
                  return (
                    <tr key={p.promoId} className={`hover:bg-gray-50 transition-colors ${!p.isActive || expired ? 'opacity-60' : ''}`}>
                      {/* Mã code */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 tracking-wider">{p.code}</span>
                          <button
                            onClick={() => handleCopyCode(p.code)}
                            className="text-gray-400 hover:text-[#828fff] transition-colors"
                            title="Copy mã"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Loại + giá trị */}
                      <td className="px-5 py-4">
                        <DiscountBadge type={p.discountType} value={p.discountValue} />
                        <p className="text-xs text-gray-400 mt-1">
                          {p.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                        </p>
                      </td>

                      {/* Đơn tối thiểu */}
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {p.minOrderAmount ? `${Number(p.minOrderAmount).toLocaleString('vi-VN')}đ` : '—'}
                      </td>

                      {/* Lượt dùng */}
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-700">{p.usedCount ?? 0}</span>
                        {p.maxUses && (
                          <span className="text-gray-400 text-xs ml-1">/ {p.maxUses}</span>
                        )}
                      </td>

                      {/* Thời hạn */}
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(p.startDate)} → {formatDate(p.endDate)}
                        {expired && (
                          <div className="text-red-400 text-[10px] font-medium mt-0.5">Đã hết hạn</div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4">
                        {expired ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-400/10 text-red-400 border border-red-400/20">
                            Hết hạn
                          </span>
                        ) : p.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-400 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Đã tắt
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingUsage(p)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 font-semibold transition-colors"
                            title="Xem lịch sử dùng"
                          >
                            <Users className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditing(p)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-[#5e6ad2]/20 text-[#828fff] hover:bg-[#5e6ad2]/10 font-semibold transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Sửa
                          </button>
                          {!expired && (
                            <button
                              onClick={() => handleToggle(p.promoId, p.isActive)}
                              className={`text-xs px-2.5 py-1.5 rounded-md border font-semibold transition-colors ${
                                p.isActive
                                  ? 'border-red-400/20 text-red-400 hover:bg-red-400/10'
                                  : 'border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                              }`}
                            >
                              {p.isActive ? 'Tắt' : 'Bật'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.promoId, p.code)}
                            className="text-xs px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 font-semibold transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {promos.map((p) => {
              const expired = isExpired(p.endDate);
              return (
                <div
                  key={p.promoId}
                  className={`bg-white rounded-lg p-5 border border-gray-200 ${!p.isActive || expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">{p.code}</span>
                        <button onClick={() => handleCopyCode(p.code)} className="text-gray-400 hover:text-[#828fff]">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DiscountBadge type={p.discountType} value={p.discountValue} />
                        {expired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-400/10 text-red-400 border border-red-400/20">Hết hạn</span>
                        ) : p.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Hoạt động</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200">Đã tắt</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                    {p.minOrderAmount && <p>Đơn tối thiểu: {Number(p.minOrderAmount).toLocaleString('vi-VN')}đ</p>}
                    <p>Đã dùng: <span className="font-semibold text-gray-700">{p.usedCount ?? 0}</span>{p.maxUses ? `/${p.maxUses}` : ''} lần</p>
                    <p>Thời hạn: {formatDate(p.startDate)} → {formatDate(p.endDate)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewingUsage(p)}
                      className="inline-flex items-center gap-1 text-xs border border-gray-200 text-gray-500 hover:bg-gray-100 font-semibold rounded-md px-3 py-1.5 transition-colors"
                    >
                      <Users className="w-3 h-3" />
                      Lịch sử
                    </button>
                    <button
                      onClick={() => setEditing(p)}
                      className="inline-flex items-center gap-1 text-xs border border-[#5e6ad2]/20 text-[#828fff] hover:bg-[#5e6ad2]/10 font-semibold rounded-md px-3 py-1.5 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Sửa
                    </button>
                    {!expired && (
                      <button
                        onClick={() => handleToggle(p.promoId, p.isActive)}
                        className={`text-xs font-semibold rounded-md px-3 py-1.5 border transition-colors ${
                          p.isActive
                            ? 'border-red-400/20 text-red-400 hover:bg-red-400/10'
                            : 'border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                        }`}
                      >
                        {p.isActive ? 'Tắt' : 'Bật'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(p.promoId, p.code)}
                      className="text-xs border border-red-500/20 text-red-500 hover:bg-red-500/10 font-semibold rounded-md px-3 py-1.5 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
