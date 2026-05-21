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
          <h1 className="text-2xl font-bold text-[#f7f8f8]">Quản lý khuyến mãi</h1>
          <p className="text-[#8a8f98] text-sm mt-1">{promos.length} mã khuyến mãi</p>
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
        <div className="bg-[#0f1117] rounded-lg p-6 border border-[#5e6ad2]/20 mb-6">
          <h3 className="font-bold text-[#f7f8f8] mb-4">Tạo mã khuyến mãi mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Mã code</label>
              <input
                required
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="VD: SUMMER20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Loại giảm giá</label>
              <select
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Giá trị giảm</label>
              <input
                required
                type="number"
                min="0"
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percentage' ? '10 (= 10%)' : '50000'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Đơn tối thiểu (VND)</label>
              <input
                type="number"
                min="0"
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                placeholder="Để trống = không giới hạn"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Số lần dùng tối đa</label>
              <input
                type="number"
                min="1"
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Để trống = không giới hạn"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Ngày bắt đầu</label>
              <input
                required
                type="date"
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Ngày kết thúc</label>
              <input
                required
                type="date"
                className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-[#1e2028] hover:bg-[#272932] text-[#d0d6e0] border border-[#23252a] text-sm font-medium rounded-md px-4 py-2 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60"
              >
                {saving ? 'Đang tạo...' : 'Tạo mã khuyến mãi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : promos.length === 0 ? (
        <div className="bg-[#0f1117] rounded-lg p-12 text-center border border-[#1e2028]">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-[#8a8f98]">Chưa có mã khuyến mãi nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div
              key={p.promoId}
              className={`bg-[#0f1117] rounded-lg p-5 border border-[#1e2028] transition-all ${!p.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-[#f7f8f8]">{p.code}</span>
                    {p.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e2028] text-[#62666d] border border-[#23252a]">
                        Đã tắt
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#828fff] mt-1">
                    {p.discountType === 'percentage' ? `Giảm ${p.discountValue}%` : `Giảm ${Number(p.discountValue).toLocaleString()}đ`}
                    {p.minOrderAmount ? ` · Đơn từ ${Number(p.minOrderAmount).toLocaleString()}đ` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(p.promoId, p.isActive)}
                  className={
                    p.isActive
                      ? 'text-red-400 border border-red-400/20 hover:bg-red-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors'
                      : 'text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors'
                  }
                >
                  {p.isActive ? 'Tắt' : 'Bật'}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8a8f98]">{formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
                <span className="text-[#62666d]">{p.usedCount ?? 0}{p.maxUses ? `/${p.maxUses}` : ''} lần dùng</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
