import { useEffect, useState } from 'react';
import { getAdminPromotionsApi, createPromotionApi, updatePromotionApi, deletePromotionApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = { code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', startDate: '', endDate: '' };

const inputCls = 'w-full bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';

function PromoForm({ initial = EMPTY_FORM, onSubmit, saving, submitLabel, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Mã code</label>
        <input required className={inputCls} value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="VD: SUMMER20" />
      </div>
      <div>
        <label className={labelCls}>Loại giảm giá</label>
        <select className={inputCls} value={form.discountType} onChange={set('discountType')}>
          <option value="percentage">Phần trăm (%)</option>
          <option value="fixed">Số tiền cố định (VND)</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Giá trị giảm</label>
        <input required type="number" min="0" className={inputCls} value={form.discountValue}
          onChange={set('discountValue')}
          placeholder={form.discountType === 'percentage' ? '10 (= 10%)' : '50000'} />
      </div>
      <div>
        <label className={labelCls}>Đơn tối thiểu (VND)</label>
        <input type="number" min="0" className={inputCls} value={form.minOrderAmount}
          onChange={set('minOrderAmount')} placeholder="Để trống = không giới hạn" />
      </div>
      <div>
        <label className={labelCls}>Số lần dùng tối đa</label>
        <input type="number" min="1" className={inputCls} value={form.maxUses}
          onChange={set('maxUses')} placeholder="Để trống = không giới hạn" />
      </div>
      <div />
      <div>
        <label className={labelCls}>Ngày bắt đầu</label>
        <input required type="date" className={inputCls} value={form.startDate} onChange={set('startDate')} />
      </div>
      <div>
        <label className={labelCls}>Ngày kết thúc</label>
        <input required type="date" className={inputCls} value={form.endDate} onChange={set('endDate')} />
      </div>
      <div className="sm:col-span-2 flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-sm font-medium rounded-md px-4 py-2 transition-colors">
            Hủy
          </button>
        )}
        <button type="submit" disabled={saving}
          className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60">
          {saving ? 'Đang lưu...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Chỉnh sửa mã khuyến mãi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <PromoForm initial={initial} onSubmit={handleSubmit} saving={saving} submitLabel="Lưu thay đổi" onCancel={onClose} />
      </div>
    </div>
  );
}

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => {
    setLoading(true);
    getAdminPromotionsApi()
      .then(({ data }) => setPromos(data.data || []))
      .catch(() => toast.error('Không thể tải khuyến mãi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

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

  const handleToggle = async (promoId, isActive) => {
    try {
      await updatePromotionApi(promoId, { isActive: !isActive });
      toast.success(isActive ? 'Đã tắt mã' : 'Đã bật mã');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

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

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
          <p className="text-gray-500 text-sm mt-1">{promos.length} mã khuyến mãi</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mã mới
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 border border-[#5e6ad2]/20 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Tạo mã khuyến mãi mới</h3>
          <PromoForm onSubmit={handleCreate} saving={saving} submitLabel="Tạo mã khuyến mãi"
            onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-gray-500">Chưa có mã khuyến mãi nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div key={p.promoId}
              className={`bg-white rounded-lg p-5 border border-gray-200 transition-all ${!p.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-gray-900">{p.code}</span>
                    {p.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Đang hoạt động</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-400 border border-gray-200">Đã tắt</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#828fff] mt-1">
                    {p.discountType === 'percentage' ? `Giảm ${p.discountValue}%` : `Giảm ${Number(p.discountValue).toLocaleString()}đ`}
                    {p.minOrderAmount ? ` · Đơn từ ${Number(p.minOrderAmount).toLocaleString()}đ` : ''}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-blue-400 border border-blue-400/20 hover:bg-blue-400/10 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleToggle(p.promoId, p.isActive)}
                    className={p.isActive
                      ? 'text-red-400 border border-red-400/20 hover:bg-red-400/10 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors'
                      : 'text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/10 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors'}
                  >
                    {p.isActive ? 'Tắt' : 'Bật'}
                  </button>
                  <button
                    onClick={() => handleDelete(p.promoId, p.code)}
                    className="text-red-500 border border-red-500/20 hover:bg-red-500/10 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
                <span className="text-gray-400">{p.usedCount ?? 0}{p.maxUses ? `/${p.maxUses}` : ''} lần dùng</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          promo={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}
