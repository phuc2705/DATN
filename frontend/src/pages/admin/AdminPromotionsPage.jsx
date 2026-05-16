import { useEffect, useState } from 'react';
import { getAdminPromotionsApi, createPromotionApi, updatePromotionApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = { code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', startDate: '', endDate: '' };

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    getAdminPromotionsApi()
      .then(({ data }) => setPromos(data.data || []))
      .catch(() => toast.error('Không thể tải khuyến mãi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPromotionApi(form);
      toast.success('Đã tạo mã khuyến mãi!');
      setForm(EMPTY_FORM);
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

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
          <p className="text-gray-500 text-sm mt-1">{promos.length} mã khuyến mãi</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mã mới
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Tạo mã khuyến mãi mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Mã code</label>
              <input required className="input-field uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: SUMMER20" />
            </div>
            <div>
              <label className="label">Loại giảm giá</label>
              <select className="input-field" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
            <div>
              <label className="label">Giá trị giảm</label>
              <input required type="number" min="0" className="input-field" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === 'percentage' ? '10 (= 10%)' : '50000'} />
            </div>
            <div>
              <label className="label">Đơn tối thiểu (VND)</label>
              <input type="number" min="0" className="input-field" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="Để trống = không giới hạn" />
            </div>
            <div>
              <label className="label">Số lần dùng tối đa</label>
              <input type="number" min="1" className="input-field" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Để trống = không giới hạn" />
            </div>
            <div>
              <label className="label">Ngày bắt đầu</label>
              <input required type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Ngày kết thúc</label>
              <input required type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Hủy</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60">
                {saving ? 'Đang tạo...' : 'Tạo mã khuyến mãi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-gray-500">Chưa có mã khuyến mãi nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div key={p.promoId} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${p.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-gray-900">{p.code}</span>
                    <span className={`badge text-xs ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 font-semibold mt-1">
                    {p.discountType === 'percentage' ? `Giảm ${p.discountValue}%` : `Giảm ${Number(p.discountValue).toLocaleString()}đ`}
                    {p.minOrderAmount ? ` · Đơn từ ${Number(p.minOrderAmount).toLocaleString()}đ` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(p.promoId, p.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                    p.isActive
                      ? 'border-red-200 text-red-500 hover:bg-red-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {p.isActive ? 'Tắt' : 'Bật'}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
                <span>{p.usedCount ?? 0}{p.maxUses ? `/${p.maxUses}` : ''} lần dùng</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
