import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://connectclean.onrender.com';
const SITE_NAME = 'CleanConnect';
const DEFAULT_DESC = 'Đặt lịch giúp việc gia đình trong vài phút. Người giúp việc được xác minh CCCD, giá minh bạch, hỗ trợ 24/7. Phục vụ tại Hà Nội.';
const DEFAULT_IMG  = `${BASE_URL}/og-image.png`;

/**
 * @param {string}  title      – tên trang (không cần ghi tên site, tự append)
 * @param {string}  description
 * @param {string}  canonical  – path tuyệt đối, e.g. "/services/1"
 * @param {string}  image      – URL ảnh OG
 * @param {boolean} noindex    – true cho trang private / không cần index
 * @param {object}  jsonLd     – schema.org JSON-LD object
 */
export default function SEO({ title, description, canonical, image, noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Giúp Việc Gia Đình Theo Giờ tại Hà Nội`;
  const desc   = description || DEFAULT_DESC;
  const imgUrl = image || DEFAULT_IMG;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex
        ? <meta name="robots" content="noindex,nofollow" />
        : <meta name="robots" content="index,follow" />
      }
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={imgUrl} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:locale"      content="vi_VN" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={imgUrl} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
