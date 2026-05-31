import { useEffect, useState } from 'react';
import { getAdminReviewsApi, toggleReviewVisibilityApi, deleteReviewApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const STAR_FILTERS = [
  { label: 'Tất cả', value: '' },
  { label: '★ 1', value: '1' },
  { label: '★ 2', value: '2' },
  { label: '★ 3', value: '3' },
  { label: '★ 4', value: '4' },
  { label: '★ 5', value: '5' },
];

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [visibleFilter, setVisibleFilter] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const refresh = () => {
    setLoading(true);
    const params = { limit: 50 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (ratingFilter) params.rating = ratingFilter;
    if (visibleFilter !== '') params.isVisible = visibleFilter;
    getAdminReviewsApi(params)
      .then(({ data }) => {
        setReviews(data.data?.reviews || []);
        setTotal(data.data?.total || 0);
      })
      .catch(() => toast.error('Không thể tải đánh giá'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [debouncedSearch, ratingFilter, visibleFilter]);

  const handleToggle = async (reviewId, isVisible) => {
    try {
      await toggleReviewVisibilityApi(reviewId);
      toast.success(isVisible ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Xóa đánh giá này? Hành động không thể hoàn tác.')) return;
    try {
      await deleteReviewApi(reviewId);
      toast.success('Đã xóa đánh giá');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingDist = [5,4,3,2,1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxDist = Math.max(...ratingDist.map((d) => d.count), 1);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-gray-500 text-sm mt-1">{total} đánh giá</p>
        </div>
      </div>

      {/* Summary + rating distribution */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-5">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-gray-900">{avgRating}</p>
              <Stars rating={Math.round(avgRating)} />
              <p className="text-xs text-gray-400 mt-1">{reviews.length} đánh giá</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-3">{star}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${(count / maxDist) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Đang hiển thị</p>
              <p className="text-2xl font-bold text-emerald-400">{reviews.filter((r) => r.is_visible).length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Đang ẩn</p>
              <p className="text-2xl font-bold text-red-400">{reviews.filter((r) => !r.is_visible).length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Đánh giá 1-2 sao</p>
              <p className="text-2xl font-bold text-yellow-400">{reviews.filter((r) => r.rating <= 2).length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Đánh giá 5 sao</p>
              <p className="text-2xl font-bold text-[#828fff]">{reviews.filter((r) => r.rating === 5).length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên helper, khách hàng, nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 rounded-md text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 transition-all"
              autoComplete="off"
            />
          </div>

          {/* Star filter */}
          <div className="flex gap-1.5">
            {STAR_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setRatingFilter(value)}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  ratingFilter === value
                    ? 'bg-[#5e6ad2] border-[#5e6ad2] text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-[#5e6ad2]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Visibility filter */}
          <select
            value={visibleFilter}
            onChange={(e) => setVisibleFilter(e.target.value)}
            className="bg-gray-100 border border-gray-200 text-gray-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#5e6ad2] min-w-[150px]"
          >
            <option value="">Tất cả</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đang ẩn</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-gray-700 font-medium">Không có đánh giá nào</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {reviews.map((r) => (
              <div
                key={r.review_id}
                className={`px-5 py-4 hover:bg-gray-50 transition-colors ${!r.is_visible ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Parties */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      {/* Customer */}
                      <div className="flex items-center gap-2">
                        <Avatar name={r.customer_name} avatarUrl={r.customer_avatar} size="sm" />
                        <div>
                          <p className="text-xs text-gray-400">Khách hàng</p>
                          <p className="text-sm font-semibold text-gray-700">{r.customer_name}</p>
                        </div>
                      </div>

                      <span className="text-gray-300">→</span>

                      {/* Helper */}
                      <div className="flex items-center gap-2">
                        <Avatar name={r.helper_name} avatarUrl={r.helper_avatar} size="sm" />
                        <div>
                          <p className="text-xs text-gray-400">Người giúp việc</p>
                          <p className="text-sm font-semibold text-gray-700">{r.helper_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rating + date */}
                    <div className="flex items-center gap-3 mb-2">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('vi-VN')} · Đơn {r.booking_id}
                      </span>
                      {!r.is_visible && (
                        <span className="text-xs bg-red-400/10 text-red-400 border border-red-400/20 px-2 py-0.5 rounded">Đang ẩn</span>
                      )}
                    </div>

                    {/* Comment */}
                    {r.comment ? (
                      <p className="text-sm text-gray-500 italic">"{r.comment}"</p>
                    ) : (
                      <p className="text-sm text-gray-300 italic">Không có nhận xét</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(r.review_id, r.is_visible)}
                      className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${
                        r.is_visible
                          ? 'text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10'
                          : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
                      }`}
                    >
                      {r.is_visible ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      onClick={() => handleDelete(r.review_id)}
                      className="text-xs px-3 py-1.5 rounded-md border font-medium transition-colors text-red-400 border-red-400/20 hover:bg-red-400/10"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
