import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchHelpersApi } from '../../api/service.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';

function StarRating({ rating }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="text-gray-500 ml-1">({rating?.toFixed(1)})</span>
    </span>
  );
}

export default function SearchHelpersPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = (cityValue) => {
    setLoading(true);
    searchHelpersApi(serviceId, cityValue)
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { search(''); }, [serviceId]);

  return (
    <div>
      <button onClick={() => navigate('/')} className="text-primary-600 hover:underline text-sm mb-4 block">
        ← Quay lại
      </button>

      {data && (
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{data.service.serviceName}</h1>
      )}

      {/* Bộ lọc thành phố */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Lọc theo thành phố (vd: Hồ Chí Minh)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => search(city)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600"
        >
          Tìm kiếm
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data?.helpers?.map((h) => (
            <div
              key={h.helperId}
              onClick={() => navigate(`/helpers/${h.helperId}?serviceId=${serviceId}`)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-300 cursor-pointer transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
                  {h.avatarUrl ? <img src={h.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : '👩'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{h.fullName}</h3>
                    {h.isVerified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Xác minh</span>}
                  </div>
                  <StarRating rating={h.averageRating} />
                  <p className="text-xs text-gray-500 mt-1">{h.totalReviews} đánh giá</p>
                  <p className="text-primary-600 font-semibold mt-1">{formatPrice(h.effectiveRate)}/giờ</p>
                </div>
              </div>
            </div>
          ))}
          {data?.helpers?.length === 0 && (
            <p className="text-gray-500 col-span-2 text-center py-8">Không tìm thấy người giúp việc phù hợp.</p>
          )}
        </div>
      )}
    </div>
  );
}
