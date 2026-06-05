import { useEffect, useState } from 'react';
import {
  getAdminServicesApi,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  toggleServiceStatusApi,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, X, Pencil, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';

// CSS class input chung theo Linear admin style
const inputCls = 'w-full bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm transition-all';
const labelCls = 'block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5';

// Emoji icon mặc định theo index dịch vụ
const SERVICE_ICONS = ['🏠', '👕', '🍳', '👶', '👴', '🏭', '🧹', '🌿', '🐾', '🔧'];

// Modal tạo / chỉnh sửa dịch vụ
function ServiceModal({ service, onClose, onSaved }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState({
    serviceName: service?.serviceName || '',
    description: service?.description || '',
    basePrice: service?.basePrice || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.serviceName.trim()) return toast.error('Vui lòng nhập tên dịch vụ');
    if (!form.basePrice || Number(form.basePrice) <= 0) return toast.error('Vui lòng nhập giá hợp lệ');
    setSaving(true);
    try {
      if (isEdit) {
        await updateServiceApi(service.serviceId, form);
        toast.success('Đã cập nhật dịch vụ!');
      } else {
        await createServiceApi(form);
        toast.success('Đã tạo dịch vụ mới!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || (isEdit ? 'Lỗi cập nhật' : 'Lỗi tạo dịch vụ'));
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
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">{isEdit ? 'Chỉnh sửa dịch vụ' : 'Tạo dịch vụ mới'}</h3>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Tên dịch vụ <span className="text-red-400">*</span></label>
            <input
              className={inputCls}
              placeholder="VD: Dọn dẹp nhà cửa"
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Mô tả ngắn về dịch vụ..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Giá cơ bản (VND/giờ) <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="0"
              step="1000"
              className={inputCls}
              placeholder="80000"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  // Tải danh sách dịch vụ
  const refresh = () => {
    setLoading(true);
    getAdminServicesApi()
      .then(({ data }) => setServices(data.data?.services || []))
      .catch(() => toast.error('Không thể tải danh sách dịch vụ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  // Xóa / ẩn dịch vụ
  const handleDelete = async (serviceId, name) => {
    if (!window.confirm(`Ẩn dịch vụ "${name}"? Dịch vụ sẽ không hiển thị cho khách hàng.`)) return;
    try {
      await deleteServiceApi(serviceId);
      toast.success('Đã ẩn dịch vụ');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Bật/tắt trạng thái active của dịch vụ
  const handleToggle = async (serviceId) => {
    try {
      const { data } = await toggleServiceStatusApi(serviceId);
      toast.success(data.message || 'Đã cập nhật trạng thái');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const activeCount   = services.filter((s) => s.isActive).length;
  const inactiveCount = services.length - activeCount;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý dịch vụ</h1>
          <p className="text-gray-500 text-sm mt-1">
            {services.length} dịch vụ
            {activeCount > 0 && (
              <span className="ml-2 inline-flex items-center bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-bold px-2 py-0.5 rounded">
                {activeCount} đang hoạt động
              </span>
            )}
            {inactiveCount > 0 && (
              <span className="ml-2 inline-flex items-center bg-gray-100 text-gray-400 border border-gray-200 text-xs font-bold px-2 py-0.5 rounded">
                {inactiveCount} đã ẩn
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
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo dịch vụ mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-2xl">
            🧹
          </div>
          <p className="text-gray-700 font-medium">Chưa có dịch vụ nào</p>
          <p className="text-gray-400 text-sm mt-1">Tạo dịch vụ đầu tiên để bắt đầu</p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 inline-flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo dịch vụ mới
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: bảng */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  {['Dịch vụ', 'Giá cơ bản', 'Số helper', 'Số booking', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.map((s, i) => (
                  <tr key={s.serviceId} className={`hover:bg-gray-50 transition-colors ${!s.isActive ? 'opacity-60' : ''}`}>
                    {/* Tên dịch vụ + icon */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                          {SERVICE_ICONS[i % SERVICE_ICONS.length]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{s.serviceName}</p>
                          {s.description && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{s.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Giá cơ bản */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#828fff]">{formatPrice(s.basePrice)}</span>
                      <span className="text-gray-400 text-xs">/giờ</span>
                    </td>

                    {/* Số helper đăng ký dịch vụ này */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-700">{s.helperCount ?? '—'}</span>
                      <span className="text-gray-400 text-xs ml-1">người</span>
                    </td>

                    {/* Số booking */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-700">{s.bookingCount ?? '—'}</span>
                      <span className="text-gray-400 text-xs ml-1">đơn</span>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-4">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-400 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          Đã ẩn
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(s)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-[#5e6ad2]/20 text-[#828fff] hover:bg-[#5e6ad2]/10 font-semibold transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Sửa
                        </button>
                        {s.isActive ? (
                          <button
                            onClick={() => handleDelete(s.serviceId, s.serviceName)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-red-400/20 text-red-400 hover:bg-red-400/10 font-semibold transition-colors"
                          >
                            <EyeOff className="w-3 h-3" />
                            Ẩn
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(s.serviceId)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10 font-semibold transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Hiện lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {services.map((s, i) => (
              <div
                key={s.serviceId}
                className={`bg-white rounded-lg p-5 border border-gray-200 transition-all ${!s.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {SERVICE_ICONS[i % SERVICE_ICONS.length]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{s.serviceName}</h3>
                      <p className="text-sm font-semibold text-[#828fff]">{formatPrice(s.basePrice)}/giờ</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${s.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                    {s.isActive ? 'Hoạt động' : 'Đã ẩn'}
                  </span>
                </div>
                {s.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{s.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span><span className="font-semibold text-gray-700">{s.helperCount ?? 0}</span> helper</span>
                  <span><span className="font-semibold text-gray-700">{s.bookingCount ?? 0}</span> đơn</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(s)}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs border border-[#5e6ad2]/20 text-[#828fff] hover:bg-[#5e6ad2]/10 font-semibold rounded-md px-3 py-2 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Chỉnh sửa
                  </button>
                  {s.isActive ? (
                    <button
                      onClick={() => handleDelete(s.serviceId, s.serviceName)}
                      className="inline-flex items-center gap-1 text-xs border border-red-400/20 text-red-400 hover:bg-red-400/10 font-semibold rounded-md px-3 py-2 transition-colors"
                    >
                      <EyeOff className="w-3 h-3" />
                      Ẩn
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggle(s.serviceId)}
                      className="inline-flex items-center gap-1 text-xs border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10 font-semibold rounded-md px-3 py-2 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Hiện lại
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {editing && (
        <ServiceModal
          service={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}

      {creating && (
        <ServiceModal
          service={null}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}
