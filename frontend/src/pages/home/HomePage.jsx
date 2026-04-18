import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllServicesApi } from '../../api/service.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';

// Màu icon cho từng dịch vụ
const SERVICE_COLORS = [
  'bg-orange-100 text-orange-600',
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-yellow-100 text-yellow-600',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllServicesApi()
      .then(({ data }) => setServices(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-10 text-white text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Dịch vụ Giúp việc Gia đình</h1>
        <p className="text-primary-100 text-lg">Đặt lịch nhanh chóng, giúp việc uy tín, thanh toán minh bạch</p>
      </div>

      {/* Danh sách dịch vụ */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Chọn dịch vụ</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((svc, idx) => (
            <button
              key={svc.serviceId}
              onClick={() => navigate(`/services/${svc.serviceId}/helpers`)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-300 transition text-left"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 ${SERVICE_COLORS[idx % SERVICE_COLORS.length]}`}>
                🧹
              </div>
              <h3 className="font-semibold text-gray-800">{svc.serviceName}</h3>
              {svc.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
              )}
              <p className="text-primary-600 font-medium mt-2 text-sm">
                Từ {formatPrice(svc.basePrice)}/giờ
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
