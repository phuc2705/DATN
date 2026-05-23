import { useEffect, useState } from 'react';
import { getAdminServicesApi, createServiceApi, updateServiceApi, deleteServiceApi, toggleServiceStatusApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-[#0f1117] border border-[#23252a] rounded-lg p-6 w-full max-w-md">
        <h3 className="font-bold text-[#f7f8f8] text-lg mb-5">Chỉnh sửa dịch vụ</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Tên dịch vụ</label>
            <input
              className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Mô tả</label>
            <textarea
              className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Giá cơ bản (VND/giờ)</label>
            <input
              type="number"
              className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-[#1e2028] hover:bg-[#272932] text-[#d0d6e0] border border-[#23252a] text-sm font-medium rounded-md px-4 py-2 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ serviceName: '', description: '', basePrice: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.serviceName.trim() || !form.basePrice) return toast.error('Vui lòng điền đầy đủ thông tin');
    setSaving(true);
    try {
      await createServiceApi(form);
      toast.success('Đã tạo dịch vụ mới!');
      onSaved();
    } catch {
      toast.error('Lỗi tạo dịch vụ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-[#0f1117] border border-[#23252a] rounded-lg p-6 w-full max-w-md">
        <h3 className="font-bold text-[#f7f8f8] text-lg mb-5">Tạo dịch vụ mới</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Tên dịch vụ <span className="text-red-400">*</span></label>
            <input
              className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
              placeholder="VD: Dọn dẹp nhà"
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Mô tả</label>
            <textarea
              className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm resize-none"
              rows={3}
              placeholder="Mô tả ngắn về dịch vụ..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Giá cơ bản (VND/giờ) <span className="text-red-400">*</span></label>
            <input
              type="number"
              className="w-full bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
              placeholder="80000"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-[#1e2028] hover:bg-[#272932] text-[#d0d6e0] border border-[#23252a] text-sm font-medium rounded-md px-4 py-2 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60"
          >
            {saving ? 'Đang tạo...' : 'Tạo dịch vụ'}
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

  const refresh = () => {
    setLoading(true);
    getAdminServicesApi()
      .then(({ data }) => setServices(data.data?.services || []))
      .catch(() => toast.error('Không thể tải dịch vụ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (serviceId, name) => {
    if (!window.confirm(`Ẩn dịch vụ "${name}"?`)) return;
    try {
      await deleteServiceApi(serviceId);
      toast.success('Đã ẩn dịch vụ');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleToggle = async (serviceId) => {
    try {
      const { data } = await toggleServiceStatusApi(serviceId);
      toast.success(data.message || 'Đã cập nhật');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const SERVICE_ICONS = ['🏠', '👕', '🍳', '👶', '👴', '🏭'];

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f7f8f8]">Quản lý dịch vụ</h1>
          <p className="text-[#8a8f98] text-sm mt-1">{services.length} dịch vụ</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo dịch vụ mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <div
              key={s.serviceId}
              className={`bg-[#0f1117] rounded-lg p-5 border border-[#1e2028] transition-all ${!s.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-md bg-[#1e2028] flex items-center justify-center text-2xl">
                  {SERVICE_ICONS[i] || '🔧'}
                </div>
                {!s.isActive && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-400/10 text-red-400 border border-red-400/20">
                    Đã ẩn
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[#f7f8f8] mb-1">{s.serviceName}</h3>
              <p className="text-xs text-[#8a8f98] mb-3 line-clamp-2">{s.description}</p>
              <p className="text-sm font-semibold text-[#828fff] mb-4">
                {formatPrice(s.basePrice)}<span className="text-[#62666d] font-normal">/giờ</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(s)}
                  className="flex-1 text-blue-300 border border-blue-400/20 hover:bg-blue-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors"
                >
                  Chỉnh sửa
                </button>
                {s.isActive ? (
                  <button
                    onClick={() => handleDelete(s.serviceId, s.serviceName)}
                    className="text-red-400 border border-red-400/20 hover:bg-red-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors"
                  >
                    Ẩn
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggle(s.serviceId)}
                    className="text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors"
                  >
                    Hiện lại
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

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}
