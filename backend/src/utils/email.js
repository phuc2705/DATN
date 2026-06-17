// Gửi email qua Gmail REST API (HTTPS port 443) — tránh SMTP bị Render block
const { google } = require('googleapis');

const getGmailClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

const makeRaw = (to, from, subject, html) => {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-Type: text/html; charset=UTF-8`,
    `MIME-Version: 1.0`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    html,
  ];
  return Buffer.from(lines.join('\r\n')).toString('base64url');
};

const sendMail = async (toEmail, subject, html) => {
  const from = `"CleanConnect" <${process.env.EMAIL_USER}>`;
  const raw = makeRaw(toEmail, from, subject, html);
  const gmail = getGmailClient();
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

// Badge trạng thái booking
const statusBadge = (label, color) =>
  `<span style="display:inline-block;background:${color}1a;color:${color};border:1px solid ${color}40;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;letter-spacing:0.3px;">${label}</span>`;

// Nút CTA
const ctaButton = (text, color = '#ea580c') =>
  `<div style="text-align:center;margin:28px 0;">
    <a href="#" style="display:inline-block;background:${color};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">
      ${text}
    </a>
  </div>`;

// Bảng thông tin booking
const bookingTable = ({ bookingId, serviceName, bookingDate, startTime, endTime, address, totalPrice }) => `
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:700;color:#374151;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">
          Chi tiết đơn hàng
        </td>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:12px 16px;color:#6b7280;width:38%;font-size:13px;">Mã đơn</td>
        <td style="padding:12px 16px;font-weight:700;color:#111827;font-size:13px;">#${bookingId}</td>
      </tr>
      <tr style="background:#fafafa;border-bottom:1px solid #f3f4f6;">
        <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Dịch vụ</td>
        <td style="padding:12px 16px;font-weight:600;color:#111827;font-size:13px;">${serviceName}</td>
      </tr>
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Ngày thực hiện</td>
        <td style="padding:12px 16px;color:#111827;font-size:13px;">${bookingDate}</td>
      </tr>
      <tr style="background:#fafafa;border-bottom:1px solid #f3f4f6;">
        <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Thời gian</td>
        <td style="padding:12px 16px;color:#111827;font-size:13px;">${startTime} – ${endTime}</td>
      </tr>
      <tr${totalPrice ? ' style="border-bottom:1px solid #f3f4f6;"' : ''}>
        <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Địa chỉ</td>
        <td style="padding:12px 16px;color:#111827;font-size:13px;">${address || '—'}</td>
      </tr>
      ${totalPrice ? `
      <tr style="background:#fffbf5;">
        <td style="padding:14px 16px;color:#6b7280;font-size:13px;font-weight:600;">Tổng tiền</td>
        <td style="padding:14px 16px;font-weight:800;color:#ea580c;font-size:16px;">${Number(totalPrice).toLocaleString('vi-VN')}đ</td>
      </tr>` : ''}
    </tbody>
  </table>
`;

// Layout chuẩn chuyên nghiệp (header + body + footer)
const layout = (content, accentColor = '#ea580c') => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:${accentColor};border-radius:12px 12px 0 0;padding:24px 40px;text-align:center;">
              <img src="https://connectclean.onrender.com/logo.png" alt="CleanConnect" width="56" height="56"
                style="display:block;margin:0 auto 10px;border-radius:12px;object-fit:cover;" />
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Clean<span style="color:${accentColor === '#ea580c' ? '#fed7aa' : '#bbf7d0'}">Connect</span>
              </span>
              <p style="margin:5px 0 0;font-size:12px;color:${accentColor === '#ea580c' ? '#fdba74' : '#86efac'};letter-spacing:0.5px;">
                DỊCH VỤ GIÚP VIỆC GIA ĐÌNH THEO GIỜ
              </p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:1px solid #e5e7eb;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding-bottom:12px;">
                    <span style="font-size:14px;font-weight:700;color:#374151;">Clean<span style="color:${accentColor}">Connect</span></span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:10px;">
                    <span style="font-size:12px;color:#9ca3af;">Hà Nội, Việt Nam</span>
                    <span style="font-size:12px;color:#d1d5db;margin:0 8px;">|</span>
                    <a href="mailto:phuc9cham@gmail.com" style="font-size:12px;color:${accentColor};text-decoration:none;">phuc9cham@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
                      Đây là email tự động từ hệ thống CleanConnect. Vui lòng không trả lời trực tiếp email này.
                    </p>
                    <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                      © 2025 CleanConnect. Bảo lưu mọi quyền.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// SVG icons dùng trong hero email (lucide-style, stroke-based, 28×28)
const ICONS = {
  mail:       `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`,
  lock:       `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  check:      `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  star:       `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  calendar:   `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock:      `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  xcircle:    `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  ban:        `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  package:    `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  bell:       `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  wallet:     `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="17" cy="15" r="1" fill="currentColor"/></svg>`,
  card:       `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  clipboard:  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
  chat:       `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  refresh:    `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
};

// Hero section (SVG icon + tiêu đề lớn + phụ đề)
const hero = (iconKey, title, subtitle, accentColor = '#ea580c') => `
  <div style="text-align:center;padding:8px 0 32px;">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:${accentColor}18;color:${accentColor};margin-bottom:20px;">
      ${ICONS[iconKey] || ICONS.star}
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;line-height:1.3;">${title}</h1>
    ${subtitle ? `<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">${subtitle}</p>` : ''}
  </div>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 28px;" />
`;

// Lời chào + phần đóng chuẩn
const greeting = (name) =>
  `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Kính gửi <strong style="color:#111827;">${name}</strong>,</p>`;

const closing = () => `
  <p style="margin:28px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
    Trân trọng,<br />
    <strong style="color:#374151;">Đội ngũ CleanConnect</strong>
  </p>
`;

// ─── OTP ────────────────────────────────────────────────────────────────────

const sendOtpEmail = async (toEmail, otpCode, fullName, purpose = 'register') => {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? '[CleanConnect] Yêu cầu đặt lại mật khẩu'
    : '[CleanConnect] Xác minh địa chỉ email của bạn';

  const html = layout(`
    ${hero(
      isReset ? 'lock' : 'mail',
      isReset ? 'Đặt lại mật khẩu' : 'Xác minh email của bạn',
      isReset
        ? 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu từ tài khoản của bạn'
        : 'Vui lòng nhập mã xác minh bên dưới để hoàn tất đăng ký'
    )}
    ${greeting(fullName)}
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
      ${isReset
        ? 'Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản CleanConnect liên kết với địa chỉ email này. Sử dụng mã OTP bên dưới để tiếp tục.'
        : 'Cảm ơn bạn đã đăng ký tài khoản tại <strong>CleanConnect</strong>. Để kích hoạt tài khoản, vui lòng nhập mã xác minh bên dưới vào ứng dụng.'}
    </p>

    <!-- OTP Box -->
    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:32px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">Mã xác minh của bạn</p>
      <div style="font-size:44px;font-weight:900;letter-spacing:14px;color:#ea580c;font-family:'Courier New',monospace;line-height:1.2;">${otpCode}</div>
      <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">
        Mã có hiệu lực trong <strong style="color:#ef4444;">5 phút</strong>
      </p>
    </div>

    <!-- Warning -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
            <strong>Lưu ý bảo mật:</strong>
            ${isReset
              ? ' Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này và đổi mật khẩu ngay lập tức.'
              : ' Không chia sẻ mã này với bất kỳ ai. Nhân viên CleanConnect sẽ không bao giờ hỏi mã OTP của bạn.'}
          </p>
        </td>
      </tr>
    </table>

    ${closing()}
  `);

  await sendMail(toEmail, subject, html);
};

// ─── TÀI KHOẢN ──────────────────────────────────────────────────────────────

// Khách hàng: chào mừng sau khi xác minh OTP thành công
const sendCustomerWelcomeEmail = async (toEmail, fullName, promoCode = null) => {
  const voucherBlock = promoCode ? `
    <!-- Voucher chào mừng -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:2px dashed #ea580c;border-radius:12px;overflow:hidden;">
      <tr style="background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);">
        <td style="padding:20px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#c2410c;letter-spacing:1px;text-transform:uppercase;">🎁 Quà tặng chào mừng dành riêng cho bạn</p>
          <p style="margin:0 0 12px;font-size:28px;font-weight:900;color:#ea580c;letter-spacing:2px;">${promoCode}</p>
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#92400e;">Giảm 20% giá trị đơn hàng đầu tiên</p>
          <p style="margin:0;font-size:12px;color:#b45309;">Nhập mã này khi đặt lịch · Chỉ dùng được 1 lần · Có hiệu lực 1 năm</p>
        </td>
      </tr>
    </table>
  ` : '';

  const html = layout(`
    ${hero('star', 'Chào mừng đến với CleanConnect!', 'Tài khoản của bạn đã được kích hoạt thành công')}
    ${greeting(fullName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Chúng tôi rất vui khi có bạn trong cộng đồng CleanConnect. Tài khoản của bạn đã sẵn sàng — bạn có thể bắt đầu đặt lịch dịch vụ ngay bây giờ.
    </p>

    ${voucherBlock}

    <!-- Tính năng nổi bật -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <tr style="background:#fff7ed;">
        <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #fed7aa;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;letter-spacing:0.5px;text-transform:uppercase;">Dịch vụ của chúng tôi</p>
        </td>
      </tr>
      <tr>
        <td style="padding:13px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;width:50%;">· Dọn dẹp nhà cửa</td>
        <td style="padding:13px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">· Giặt ủi quần áo</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:13px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">· Nấu ăn theo yêu cầu</td>
        <td style="padding:13px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">· Chăm sóc trẻ em</td>
      </tr>
      <tr>
        <td style="padding:13px 16px;font-size:14px;color:#374151;">· Chăm sóc người cao tuổi</td>
        <td style="padding:13px 16px;font-size:14px;color:#374151;">· Vệ sinh công nghiệp</td>
      </tr>
    </table>

    <!-- Cam kết -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#fff7ed;border-left:4px solid #ea580c;border-radius:0 8px 8px 0;padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#c2410c;">Cam kết của CleanConnect</p>
          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.7;">
            ✔ Người giúp việc được xác minh CCCD &nbsp;·&nbsp; ✔ Thanh toán minh bạch &nbsp;·&nbsp; ✔ Đánh giá 2 chiều
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Đặt lịch ngay', '#ea580c')}
    ${closing()}
  `);
  await sendMail(toEmail, '[CleanConnect] Chào mừng bạn – Tài khoản đã được kích hoạt!', html).catch(() => {});
};

// Helper: đăng ký xong, đang chờ admin duyệt
const sendHelperPendingEmail = async (toEmail, fullName) => {
  const html = layout(`
    ${hero('clipboard', 'Hồ sơ đang chờ xét duyệt', 'Cảm ơn bạn đã đăng ký làm người giúp việc tại CleanConnect', '#16a34a')}
    ${greeting(fullName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Chúng tôi đã nhận được hồ sơ đăng ký của bạn và đang tiến hành xem xét. Đội ngũ CleanConnect sẽ kiểm tra thông tin và phản hồi trong thời gian sớm nhất.
    </p>

    <!-- Quy trình -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #d1fae5;border-radius:10px;overflow:hidden;">
      <tr style="background:#ecfdf5;">
        <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #a7f3d0;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#065f46;letter-spacing:0.5px;text-transform:uppercase;">Quy trình xét duyệt</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f0fdf4;width:40px;vertical-align:top;">
          <div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:700;">1</div>
        </td>
        <td style="padding:14px 16px 14px 0;border-bottom:1px solid #f0fdf4;font-size:14px;color:#374151;">
          <strong>Kiểm tra hồ sơ</strong><br />
          <span style="color:#6b7280;font-size:13px;">Đội ngũ xem xét thông tin cá nhân, CCCD và kinh nghiệm của bạn</span>
        </td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:14px 16px;border-bottom:1px solid #f0fdf4;vertical-align:top;">
          <div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:700;">2</div>
        </td>
        <td style="padding:14px 16px 14px 0;border-bottom:1px solid #f0fdf4;font-size:14px;color:#374151;">
          <strong>Thời gian xét duyệt</strong><br />
          <span style="color:#6b7280;font-size:13px;">Thường mất <strong style="color:#16a34a;">1–2 ngày làm việc</strong> kể từ khi nhận hồ sơ</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;vertical-align:top;">
          <div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:700;">3</div>
        </td>
        <td style="padding:14px 16px 14px 0;font-size:14px;color:#374151;">
          <strong>Thông báo kết quả</strong><br />
          <span style="color:#6b7280;font-size:13px;">Bạn sẽ nhận được email ngay khi hồ sơ được phê duyệt hoặc cần bổ sung</span>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
            Nếu bạn có câu hỏi trong thời gian chờ xét duyệt, vui lòng liên hệ chúng tôi qua email <a href="mailto:phuc9cham@gmail.com" style="color:#16a34a;font-weight:600;">phuc9cham@gmail.com</a>.
          </p>
        </td>
      </tr>
    </table>

    ${closing()}
  `, '#16a34a');
  await sendMail(toEmail, '[CleanConnect] Hồ sơ của bạn đang được xét duyệt', html).catch(() => {});
};

// Helper: được admin phê duyệt
const sendHelperApprovedEmail = async (toEmail, fullName) => {
  const html = layout(`
    ${hero('check', 'Hồ sơ đã được phê duyệt!', 'Chúc mừng! Bạn đã chính thức trở thành người giúp việc của CleanConnect', '#16a34a')}
    ${greeting(fullName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Chúng tôi vui mừng thông báo rằng hồ sơ đăng ký làm người giúp việc của bạn đã được <strong style="color:#16a34a;">xét duyệt thành công</strong>. Bạn có thể đăng nhập và bắt đầu nhận đơn ngay từ bây giờ.
    </p>

    <!-- Hướng dẫn bắt đầu -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #d1fae5;border-radius:10px;overflow:hidden;">
      <tr style="background:#ecfdf5;">
        <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #a7f3d0;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#065f46;letter-spacing:0.5px;text-transform:uppercase;">Bắt đầu ngay hôm nay</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f0fdf4;width:32px;vertical-align:top;">
          <div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:700;">1</div>
        </td>
        <td style="padding:14px 16px 14px 0;border-bottom:1px solid #f0fdf4;font-size:14px;color:#374151;">
          <strong>Đăng nhập tài khoản</strong><br />
          <span style="color:#6b7280;font-size:13px;">Dùng email và mật khẩu đã đăng ký để đăng nhập vào CleanConnect</span>
        </td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:14px 16px;border-bottom:1px solid #f0fdf4;vertical-align:top;">
          <div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:700;">2</div>
        </td>
        <td style="padding:14px 16px 14px 0;border-bottom:1px solid #f0fdf4;font-size:14px;color:#374151;">
          <strong>Hoàn thiện hồ sơ</strong><br />
          <span style="color:#6b7280;font-size:13px;">Cập nhật ảnh đại diện, mô tả kinh nghiệm và bật trạng thái sẵn sàng nhận việc</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;vertical-align:top;">
          <div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:700;">3</div>
        </td>
        <td style="padding:14px 16px 14px 0;font-size:14px;color:#374151;">
          <strong>Nhận đơn đầu tiên</strong><br />
          <span style="color:#6b7280;font-size:13px;">Theo dõi bảng việc làm và nhận đơn phù hợp với lịch của bạn</span>
        </td>
      </tr>
    </table>

    <!-- Thu nhập -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Thu nhập tham khảo</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#16a34a;line-height:1.2;">65.000 – 95.000đ</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">mỗi giờ làm việc</p>
        </td>
      </tr>
    </table>

    ${ctaButton('Đăng nhập và nhận việc ngay', '#16a34a')}
    ${closing()}
  `, '#16a34a');
  await sendMail(toEmail, '[CleanConnect] Chúc mừng! Hồ sơ của bạn đã được phê duyệt', html).catch(() => {});
};

// ─── BOOKING NOTIFICATIONS ────────────────────────────────────────────────────

// Khách hàng: xác nhận đặt lịch thành công
const sendBookingCreatedEmail = async (toEmail, customerName, booking) => {
  const html = layout(`
    ${hero('calendar', 'Đặt lịch thành công!', `Chúng tôi đã nhận đơn #${booking.bookingId} của bạn`)}
    ${greeting(customerName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Đơn đặt lịch của bạn đã được ghi nhận thành công. Chúng tôi đang tìm kiếm người giúp việc phù hợp và sẽ thông báo ngay khi có người xác nhận nhận đơn.
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#fff7ed;border-left:4px solid #ea580c;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
            Bạn có thể theo dõi trạng thái đơn hàng và nhận thông báo cập nhật trong mục <strong>Lịch sử đặt lịch</strong> trên CleanConnect.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `);
  await sendMail(toEmail, `[CleanConnect] Xác nhận đặt lịch – Đơn #${booking.bookingId}`, html).catch(() => {});
};

// Khách hàng: helper đã xác nhận nhận đơn
const sendBookingConfirmedEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    ${hero('check', 'Đơn hàng đã được xác nhận', `${helperName} sẽ thực hiện dịch vụ cho bạn`)}
    ${greeting(customerName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Tin vui! Người giúp việc <strong style="color:#16a34a;">${helperName}</strong> đã xác nhận nhận đơn của bạn.
      ${statusBadge('Đã xác nhận', '#16a34a')}
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
            Vui lòng có mặt tại địa chỉ đã đăng ký để đón tiếp người giúp việc đúng giờ hẹn.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `);
  await sendMail(toEmail, `[CleanConnect] Đơn #${booking.bookingId} đã được xác nhận`, html).catch(() => {});
};

// Khách hàng: helper đã check-in (đang làm việc)
const sendCheckinEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    ${hero('refresh', 'Dịch vụ đang được thực hiện', `${helperName} đã check-in và bắt đầu công việc`, '#2563eb')}
    ${greeting(customerName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Người giúp việc <strong style="color:#2563eb;">${helperName}</strong> đã check-in thành công và đang thực hiện công việc tại nhà bạn.
      ${statusBadge('Đang thực hiện', '#2563eb')}
    </p>
    ${bookingTable(booking)}
    ${closing()}
  `, '#2563eb');
  await sendMail(toEmail, `[CleanConnect] Đơn #${booking.bookingId} – Đang thực hiện`, html).catch(() => {});
};

// Khách hàng: hoàn thành công việc
const sendCompletedEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    ${hero('star', 'Dịch vụ đã hoàn thành!', 'Cảm ơn bạn đã sử dụng dịch vụ CleanConnect', '#16a34a')}
    ${greeting(customerName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      <strong>${helperName}</strong> đã hoàn thành công việc cho bạn.
      ${statusBadge('Hoàn thành', '#16a34a')}
      Hy vọng bạn hài lòng với chất lượng dịch vụ lần này.
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#fffbf5;border:1px solid #fed7aa;border-radius:10px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 8px;font-size:15px;color:#92400e;font-weight:600;">Đánh giá trải nghiệm của bạn</p>
          <p style="margin:0 0 16px;font-size:13px;color:#a16207;line-height:1.5;">Phản hồi của bạn giúp chúng tôi cải thiện chất lượng dịch vụ và hỗ trợ người giúp việc tốt hơn.</p>
          ${ctaButton('Để lại đánh giá ngay', '#ea580c')}
        </td>
      </tr>
    </table>
    ${closing()}
  `);
  await sendMail(toEmail, `[CleanConnect] Dịch vụ hoàn thành – Đơn #${booking.bookingId}`, html).catch(() => {});
};

// Thông báo hủy đơn (gửi cho bên bị ảnh hưởng)
const sendCancelledEmail = async (toEmail, recipientName, booking, cancelledBy) => {
  const html = layout(`
    ${hero('xcircle', 'Đơn hàng đã bị hủy', `Đơn #${booking.bookingId} đã bị hủy bởi ${cancelledBy}`, '#dc2626')}
    ${greeting(recipientName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Chúng tôi xin thông báo rằng đơn hàng dưới đây đã được hủy bởi <strong>${cancelledBy}</strong>.
      ${statusBadge('Đã hủy', '#dc2626')}
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
            Nếu bạn có thắc mắc về việc hủy đơn, vui lòng liên hệ đội ngũ hỗ trợ CleanConnect qua email <a href="mailto:phuc9cham@gmail.com" style="color:#dc2626;font-weight:600;">phuc9cham@gmail.com</a>.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `, '#dc2626');
  await sendMail(toEmail, `[CleanConnect] Thông báo hủy đơn – Đơn #${booking.bookingId}`, html).catch(() => {});
};

// Xác nhận hủy cho chính người hủy (customer tự hủy)
const sendCancellationReceiptEmail = async (toEmail, recipientName, booking) => {
  const html = layout(`
    ${hero('ban', 'Yêu cầu hủy đơn đã được xử lý', `Đơn #${booking.bookingId} đã được hủy theo yêu cầu của bạn`, '#6b7280')}
    ${greeting(recipientName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Đơn hàng của bạn đã được hủy thành công theo yêu cầu.
      ${statusBadge('Đã hủy', '#6b7280')}
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f9fafb;border-left:4px solid #9ca3af;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
            Nếu bạn cần đặt lại dịch vụ, hãy vào CleanConnect và tạo đơn mới bất cứ lúc nào. Chúng tôi luôn sẵn sàng phục vụ bạn.
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton('Đặt lịch mới', '#ea580c')}
    ${closing()}
  `, '#6b7280');
  await sendMail(toEmail, `[CleanConnect] Xác nhận hủy đơn – Đơn #${booking.bookingId}`, html).catch(() => {});
};

// ─── HELPER NOTIFICATIONS ─────────────────────────────────────────────────────

// Helper: được giao đơn (admin assign)
const sendHelperAssignedEmail = async (toEmail, helperName, booking) => {
  const html = layout(`
    ${hero('package', 'Bạn có đơn hàng mới!', 'Admin đã giao đơn cho bạn. Vui lòng xác nhận sớm.', '#16a34a')}
    ${greeting(helperName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Admin CleanConnect vừa giao cho bạn một đơn hàng mới. Vui lòng đăng nhập vào hệ thống để xem chi tiết và xác nhận nhận đơn.
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
            Hãy check-in đúng giờ khi đến địa điểm để khách hàng biết bạn đã có mặt. Đây là tiêu chí đánh giá chuyên nghiệp của bạn trên CleanConnect.
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton('Xem chi tiết đơn hàng', '#16a34a')}
    ${closing()}
  `, '#16a34a');
  await sendMail(toEmail, `[CleanConnect] Bạn được giao đơn mới – #${booking.bookingId}`, html).catch(() => {});
};

// Helper: tự xác nhận nhận đơn thành công
const sendHelperConfirmedEmail = async (toEmail, helperName, booking, customerName) => {
  const html = layout(`
    ${hero('check', 'Nhận đơn thành công!', `Bạn đã xác nhận nhận đơn của ${customerName}`, '#16a34a')}
    ${greeting(helperName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Bạn đã xác nhận nhận đơn của khách hàng <strong>${customerName}</strong>.
      ${statusBadge('Đã xác nhận', '#16a34a')}
      Vui lòng chuẩn bị và có mặt đúng giờ tại địa chỉ bên dưới.
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
            Nhớ check-in trên ứng dụng khi bạn đến nơi. Nếu có vấn đề phát sinh, hãy liên hệ CleanConnect ngay lập tức.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `, '#16a34a');
  await sendMail(toEmail, `[CleanConnect] Xác nhận nhận đơn #${booking.bookingId} thành công`, html).catch(() => {});
};

// Helper: hoàn thành công việc
const sendHelperCompletedEmail = async (toEmail, helperName, booking, customerName) => {
  const html = layout(`
    ${hero('wallet', 'Công việc hoàn thành!', `Cảm ơn bạn đã hoàn thành xuất sắc đơn #${booking.bookingId}`, '#16a34a')}
    ${greeting(helperName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Bạn đã hoàn thành công việc cho khách hàng <strong>${customerName}</strong>.
      ${statusBadge('Hoàn thành', '#16a34a')}
      Cảm ơn bạn đã cống hiến chất lượng dịch vụ tuyệt vời!
    </p>
    ${bookingTable(booking)}
    ${booking.totalPrice ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Thu nhập từ đơn này</p>
          <p style="margin:0;font-size:32px;font-weight:900;color:#16a34a;line-height:1.2;">${Number(booking.totalPrice).toLocaleString('vi-VN')}đ</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6b7280;">(Đã được cập nhật vào ví thu nhập của bạn)</p>
        </td>
      </tr>
    </table>` : ''}
    ${closing()}
  `, '#16a34a');
  await sendMail(toEmail, `[CleanConnect] Hoàn thành đơn #${booking.bookingId}`, html).catch(() => {});
};

// Helper: có đơn mới trên job board
const sendNewJobEmail = async (toEmail, helperName, booking) => {
  const html = layout(`
    ${hero('bell', 'Có đơn mới phù hợp với bạn!', 'Đăng nhập ngay để nhận đơn trước khi có người khác nhận', '#f97316')}
    ${greeting(helperName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Có một đơn <strong>${booking.serviceName}</strong> mới vừa được đăng và phù hợp với kỹ năng của bạn. Đây là cơ hội tốt để tăng thu nhập!
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#c2410c;line-height:1.6;">
            Đơn này có thể được nhận bởi người khác bất cứ lúc nào. Đăng nhập ngay để không bỏ lỡ cơ hội!
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton('Nhận đơn ngay', '#f97316')}
    ${closing()}
  `, '#f97316');
  await sendMail(toEmail, `[CleanConnect] Đơn mới – ${booking.serviceName} ngày ${booking.bookingDate}`, html).catch(() => {});
};

// Khách hàng: helper đã tự nhận đơn từ job board
const sendJobAcceptedEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    ${hero('check', 'Đơn hàng đã được nhận!', `${helperName} sẽ thực hiện dịch vụ cho bạn`)}
    ${greeting(customerName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Người giúp việc <strong style="color:#16a34a;">${helperName}</strong> đã nhận đơn của bạn và xác nhận thực hiện.
      ${statusBadge('Đã xác nhận', '#16a34a')}
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
            Vui lòng có mặt tại địa chỉ đã đặt để đón tiếp người giúp việc đúng giờ. Bạn sẽ nhận thông báo khi họ check-in.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `);
  await sendMail(toEmail, `[CleanConnect] Đơn #${booking.bookingId} đã được ${helperName} nhận`, html).catch(() => {});
};

// Nhắc lịch (dùng cho cả customer và helper)
const sendReminderEmail = async (toEmail, recipientName, booking, otherPartyName, role) => {
  const isHelper = role === 'helper';
  const dateStr = new Date(booking.bookingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = layout(`
    ${hero('clock', 'Nhắc nhở: Ca làm việc sắp bắt đầu', `Còn khoảng 30 phút nữa – ${booking.serviceName} lúc ${booking.startTime} ngày ${dateStr}`, '#2563eb')}
    ${greeting(recipientName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Bạn có ca làm việc đã đăng ký lúc <strong>${booking.startTime}</strong> ngày <strong>${dateStr}</strong>.
      ${statusBadge('Sắp bắt đầu', '#2563eb')}
    </p>
    ${bookingTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
            ${isHelper
              ? `Vui lòng chuẩn bị vào ca làm. Hãy đến đúng giờ và nhớ check-in khi tới nơi. Khách hàng của bạn là <strong>${otherPartyName}</strong>.`
              : `Vui lòng chuẩn bị sẵn sàng đón người giúp việc <strong>${otherPartyName}</strong>. Họ sẽ đến theo đúng lịch hẹn.`}
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `, '#2563eb');
  await sendMail(toEmail, `[CleanConnect] Nhắc nhở: Ca làm việc lúc ${booking.startTime} ngày ${dateStr} sắp bắt đầu`, html).catch(() => {});
};

// Helper: nhắc nhở ca đăng ký (shift) sắp bắt đầu — không gắn với booking cụ thể
const sendShiftReminderEmail = async (toEmail, helperName, shift) => {
  const dateStr  = new Date(shift.shiftDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = layout(`
    ${hero('bell', 'Ca làm việc sắp bắt đầu!', `Ca ${shift.startTime} – ${shift.endTime} ngày ${dateStr}`, '#f97316')}
    ${greeting(helperName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Còn khoảng <strong>30 phút</strong> nữa ca làm việc của bạn sẽ bắt đầu.
      ${statusBadge('Sắp bắt đầu', '#f97316')}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
      <tr>
        <td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#9ca3af;font-weight:600;width:40%;">Ngày làm việc</td>
              <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:700;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#9ca3af;font-weight:600;">Giờ bắt đầu</td>
              <td style="padding:6px 0;font-size:14px;color:#ea580c;font-weight:700;">${shift.startTime}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#9ca3af;font-weight:600;">Giờ kết thúc</td>
              <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:700;">${shift.endTime}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#c2410c;line-height:1.6;">
            Hãy chuẩn bị dụng cụ và di chuyển đúng giờ. Đừng quên <strong>check-in</strong> khi bắt đầu ca làm nhé!
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `, '#f97316');
  await sendMail(toEmail, `[CleanConnect] Ca làm việc lúc ${shift.startTime} ngày ${dateStr} sắp bắt đầu`, html).catch(() => {});
};

// Helper: xác nhận đã nhận thanh toán
const sendPaymentReceivedEmail = async (toEmail, helperName, amount, bookingId) => {
  const amountStr = Number(amount).toLocaleString('vi-VN');
  const html = layout(`
    ${hero('card', 'Thanh toán đã được ghi nhận', `Đơn #${bookingId} – Thu nhập đã vào ví của bạn`, '#16a34a')}
    ${greeting(helperName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Khách hàng đã hoàn tất thanh toán cho đơn <strong>#${bookingId}</strong>. Thu nhập của bạn đã được cập nhật vào ví CleanConnect.
      ${statusBadge('Đã thanh toán', '#16a34a')}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
      <tr>
        <td style="padding:28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Thu nhập nhận được</p>
          <p style="margin:0;font-size:38px;font-weight:900;color:#16a34a;line-height:1.2;">${amountStr}đ</p>
          <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">80% giá trị đơn hàng sau phí nền tảng 20%</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
            Số dư đã được cập nhật vào ví thu nhập của bạn. Bạn có thể xem chi tiết trong mục <strong>Ví thu nhập</strong> trên CleanConnect.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `, '#16a34a');
  await sendMail(toEmail, `[CleanConnect] Đã nhận thanh toán ${amountStr}đ – Đơn #${bookingId}`, html).catch(() => {});
};

// User: admin đã trả lời phản hồi
const sendFeedbackRepliedEmail = async (toEmail, userName, subject, adminNote, status) => {
  const statusMap   = { resolved: 'Đã giải quyết', closed: 'Đã đóng', in_progress: 'Đang xử lý', open: 'Mở' };
  const statusColor = { resolved: '#16a34a', closed: '#6b7280', in_progress: '#2563eb', open: '#f97316' };
  const color = statusColor[status] || '#6b7280';
  const html = layout(`
    ${hero('chat', 'Phản hồi của bạn đã được xử lý', `Chủ đề: "${subject}"`, color)}
    ${greeting(userName)}
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Cảm ơn bạn đã gửi phản hồi đến CleanConnect. Đội ngũ Admin đã xem xét và cập nhật trạng thái:
      ${statusBadge(statusMap[status] || status, color)}
    </p>

    ${adminNote ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1e40af;letter-spacing:0.3px;text-transform:uppercase;">Phản hồi từ Admin</p>
          <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.7;">${adminNote}</p>
        </td>
      </tr>
    </table>` : ''}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f9fafb;border-left:4px solid #9ca3af;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
            Bạn có thể xem toàn bộ lịch sử phản hồi trong mục <strong>Hồ sơ → Phản hồi của tôi</strong> trên CleanConnect.
          </p>
        </td>
      </tr>
    </table>
    ${closing()}
  `, color);
  await sendMail(toEmail, `[CleanConnect] Phản hồi "${subject}" đã được cập nhật`, html).catch(() => {});
};

module.exports = {
  sendOtpEmail,
  sendCustomerWelcomeEmail,
  sendHelperPendingEmail,
  sendHelperApprovedEmail,
  sendBookingCreatedEmail,
  sendBookingConfirmedEmail,
  sendHelperConfirmedEmail,
  sendCheckinEmail,
  sendCompletedEmail,
  sendHelperCompletedEmail,
  sendCancelledEmail,
  sendCancellationReceiptEmail,
  sendHelperAssignedEmail,
  sendNewJobEmail,
  sendJobAcceptedEmail,
  sendReminderEmail,
  sendShiftReminderEmail,
  sendPaymentReceivedEmail,
  sendFeedbackRepliedEmail,
};
