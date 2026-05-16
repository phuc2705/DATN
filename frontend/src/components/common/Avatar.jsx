// Component hiển thị avatar: ưu tiên ảnh, fallback về chữ cái đầu tên
const API_BASE = import.meta.env.VITE_API_URL || '';

// Đường dẫn /uploads/... được serve từ backend, cần thêm origin
const resolveUrl = (url) => (url?.startsWith('/uploads/') ? `${API_BASE}${url}` : url);

export default function Avatar({ name = '', avatarUrl = '', size = 'md', className = '' }) {
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }[size] || 'w-9 h-9 text-sm';
  const base = `${sizeClass} rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center font-bold bg-gradient-to-br from-green-100 to-green-200 text-green-700 ${className}`;

  const fallbackLetter = name?.[0]?.toUpperCase() || '?';

  if (avatarUrl) {
    return (
      <div className={base} style={{ position: 'relative' }}>
        <img
          src={resolveUrl(avatarUrl)}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
        />
        <span style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {fallbackLetter}
        </span>
      </div>
    );
  }

  return <div className={base}>{fallbackLetter}</div>;
}
