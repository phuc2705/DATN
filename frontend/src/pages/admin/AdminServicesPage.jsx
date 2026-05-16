import { useEffect, useState } from 'react';
import { getAdminServicesApi, updateServiceApi, deleteServiceApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';

function EditModal({ service, onClose, onSaved }) {
  const [form, setForm] = useState({
    serviceName: service.serviceName,
    description: service.description || '',
    basePrice: service.basePrice,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateServiceApi(service.serviceId, form);
      toast.success('Đã cập nhật dịch vụ!');
      onSaved();
    } catch {
      toast.error('Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-gray-900 text-lg mb-5">Chỉnh sửa dịch vụ</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Tên dịch vụ</label>
            <input className="input-field" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Giá cơ bản (VND/giờ)</label>
            <input type="number" className="input-field" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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

  const refresh = () => {
    setLoading(true);
    getAdminServicesApi()
      .then(({ data }) => setServices(data.data?.services || []))
      .catch(() => toast.error('Không thể tải dịch vụ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (serviceId, name) => {
    if (!confirm(`Ẩn dịch vụ "${name}"?`)) return;
    try {
      await deleteServiceApi(serviceId);
      toast.success('Đã ẩn dịch vụ');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const SERVICE_ICONS = ['🏠', '👕', '🍳', '👶', '👴', '🏭'];

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý dịch vụ</h1>
        <p className="text-gray-500 text-sm mt-1">{services.length} dịch vụ</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <div key={s.serviceId} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${s.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">
                  {SERVICE_ICONS[i] || '🔧'}
                </div>
                {!s.isActive && (
                  <span className="badge bg-red-50 text-red-500 text-xs">Đã ẩn</span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{s.serviceName}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>
              <p className="text-orange-600 font-bold text-sm mb-4">{formatPrice(s.basePrice)}<span className="text-gray-400 font-normal">/giờ</span></p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(s)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold transition-all"
                >
                  Chỉnh sửa
                </button>
                {s.isActive && (
                  <button
                    onClick={() => handleDelete(s.serviceId, s.serviceName)}
                    className="text-xs px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-semibold transition-all"
                  >
                    Ẩn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          service={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}
