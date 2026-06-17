import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const PRESET_REASONS = [
  'Tôi muốn thay đổi thời gian',
  'Tôi tìm được người giúp việc khác',
  'Tôi không còn nhu cầu nữa',
  'Người giúp việc không phù hợp',
  'Có việc bận đột xuất',
  'Khác',
];

export default function CancelBookingModal({ onConfirm, onClose, loading = false }) {
  const [selected, setSelected] = useState('');
  const [custom,   setCustom]   = useState('');

  const reason = selected === 'Khác' ? custom.trim() : selected;
  const canSubmit = selected && (selected !== 'Khác' || custom.trim().length >= 5);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Hủy đơn hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Vui lòng cho chúng tôi biết lý do</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Reasons */}
        <div className="px-6 py-4 space-y-2">
          {PRESET_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => { setSelected(r); if (r !== 'Khác') setCustom(''); }}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selected === r
                  ? 'border-[#ff385c] bg-red-50 text-[#ff385c]'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}

          {selected === 'Khác' && (
            <textarea
              autoFocus
              rows={3}
              placeholder="Nhập lý do cụ thể (tối thiểu 5 ký tự)..."
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#ff385c] resize-none"
            />
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex-1 h-11 rounded-xl bg-[#ff385c] text-white text-sm font-semibold hover:bg-[#e0304f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
