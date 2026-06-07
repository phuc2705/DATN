// Hàm tiện ích định dạng dữ liệu hiển thị
export const formatPrice = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const BOOKING_STATUS_LABEL = {
  pending:     { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
  confirmed:   { text: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-800'   },
  in_progress: { text: 'Đang làm',     color: 'bg-indigo-100 text-indigo-800'},
  completed:   { text: 'Hoàn thành',   color: 'bg-green-100 text-green-800' },
  cancelled:   { text: 'Đã hủy',       color: 'bg-red-100 text-red-800'     },
};

export const PAYMENT_STATUS_LABEL = {
  unpaid:             { text: 'Chưa thanh toán',         color: 'bg-orange-100 text-orange-800'  },
  deposit_paid:       { text: 'Đã cọc 70%',              color: 'bg-blue-100 text-blue-800'      },
  paid:               { text: '��ã thanh toán',           color: 'bg-green-100 text-green-800'    },
  refund_pending:     { text: 'Đang hoàn tiền',          color: 'bg-yellow-100 text-yellow-800'  },
  refunded:           { text: 'Đã hoàn tiền',            color: 'bg-gray-100 text-gray-600'      },
  deposit_forfeited:  { text: 'Cọc chuyển cho helper',   color: 'bg-red-100 text-red-700'        },
};
