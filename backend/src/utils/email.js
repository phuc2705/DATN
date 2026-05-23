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

// Layout chung cho tất cả email
const layout = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${content}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        CleanConnect — Dịch vụ giúp việc gia đình theo giờ
      </p>
    </div>
  </div>
`;

// Badge trạng thái booking
const statusBadge = (label, color) =>
  `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:6px;padding:3px 10px;font-size:13px;font-weight:600;">${label}</span>`;

// Bảng thông tin booking
const bookingTable = ({ bookingId, serviceName, bookingDate, startTime, endTime, address, totalPrice }) => `
  <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
    <tr style="background:#f9fafb;">
      <td style="padding:10px 14px;color:#6b7280;width:40%;">Mã đơn</td>
      <td style="padding:10px 14px;font-weight:600;color:#1f2937;">${bookingId}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;color:#6b7280;">Dịch vụ</td>
      <td style="padding:10px 14px;font-weight:600;color:#1f2937;">${serviceName}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px 14px;color:#6b7280;">Ngày</td>
      <td style="padding:10px 14px;color:#1f2937;">${bookingDate}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;color:#6b7280;">Giờ</td>
      <td style="padding:10px 14px;color:#1f2937;">${startTime} – ${endTime}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px 14px;color:#6b7280;">Địa chỉ</td>
      <td style="padding:10px 14px;color:#1f2937;">${address || '—'}</td>
    </tr>
    ${totalPrice ? `<tr>
      <td style="padding:10px 14px;color:#6b7280;">Tổng tiền</td>
      <td style="padding:10px 14px;font-weight:700;color:#ea580c;">${Number(totalPrice).toLocaleString('vi-VN')}đ</td>
    </tr>` : ''}
  </table>
`;

// ─── OTP ────────────────────────────────────────────────────────────────────

const sendOtpEmail = async (toEmail, otpCode, fullName, purpose = 'register') => {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? '[CleanConnect] Mã đặt lại mật khẩu'
    : '[CleanConnect] Mã xác nhận đăng ký tài khoản';
  const description = isReset
    ? `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới để xác nhận:`
    : `Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #ea580c;">CleanConnect</strong>. Vui lòng sử dụng mã OTP bên dưới để xác nhận đăng ký:`;
  const cautionText = isReset
    ? '⚠️ Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và bảo mật tài khoản.'
    : '⚠️ Không chia sẻ mã này với bất kỳ ai. CleanConnect sẽ không bao giờ hỏi mã OTP của bạn.';

  const html = layout(`
    <h2 style="color: #1f2937; margin-top: 0;">Xin chào <strong>${fullName}</strong>,</h2>
    <p style="color: #4b5563; line-height: 1.6;">${description}</p>
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background: #fff7ed; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px 40px;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #ea580c;">${otpCode}</span>
      </div>
      <p style="color: #6b7280; margin-top: 12px; font-size: 14px;">Mã có hiệu lực trong <strong>5 phút</strong></p>
    </div>
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;">${cautionText}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
  `);

  await sendMail(toEmail, subject, html);
};

// ─── BOOKING NOTIFICATIONS ────────────────────────────────────────────────────

// Khách hàng: xác nhận đặt lịch thành công
const sendBookingCreatedEmail = async (toEmail, customerName, booking) => {
  const html = layout(`
    <h2 style="color:#1f2937;margin-top:0;">Xin chào <strong>${customerName}</strong>,</h2>
    <p style="color:#4b5563;line-height:1.6;">
      Đơn đặt lịch của bạn đã được ghi nhận thành công.
      Chúng tôi sẽ thông báo ngay khi có người giúp việc xác nhận nhận đơn.
    </p>
    ${bookingTable(booking)}
    <p style="color:#6b7280;font-size:14px;">Bạn có thể theo dõi trạng thái đơn hàng trên trang web CleanConnect.</p>
  `);
  await sendMail(toEmail, `[CleanConnect] Đặt lịch thành công – Đơn ${booking.bookingId}`, html).catch(() => {});
};

// Khách hàng: helper đã xác nhận nhận đơn
const sendBookingConfirmedEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    <h2 style="color:#1f2937;margin-top:0;">Xin chào <strong>${customerName}</strong>,</h2>
    <p style="color:#4b5563;line-height:1.6;">
      Tin vui! Người giúp việc <strong style="color:#16a34a;">${helperName}</strong>
      đã xác nhận nhận đơn của bạn. ${statusBadge('Đã xác nhận', '#16a34a')}
    </p>
    ${bookingTable(booking)}
    <p style="color:#6b7280;font-size:14px;">Vui lòng chuẩn bị sẵn để đón tiếp người giúp việc đúng giờ.</p>
  `);
  await sendMail(toEmail, `[CleanConnect] Đơn ${booking.bookingId} đã được xác nhận`, html).catch(() => {});
};

// Khách hàng: helper đã check-in (đang làm việc)
const sendCheckinEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    <h2 style="color:#1f2937;margin-top:0;">Xin chào <strong>${customerName}</strong>,</h2>
    <p style="color:#4b5563;line-height:1.6;">
      <strong style="color:#2563eb;">${helperName}</strong> đã check-in và bắt đầu công việc tại nhà bạn.
      ${statusBadge('Đang thực hiện', '#2563eb')}
    </p>
    ${bookingTable(booking)}
  `);
  await sendMail(toEmail, `[CleanConnect] Đơn ${booking.bookingId} đang được thực hiện`, html).catch(() => {});
};

// Khách hàng: hoàn thành công việc
const sendCompletedEmail = async (toEmail, customerName, booking, helperName) => {
  const html = layout(`
    <h2 style="color:#1f2937;margin-top:0;">Xin chào <strong>${customerName}</strong>,</h2>
    <p style="color:#4b5563;line-height:1.6;">
      <strong>${helperName}</strong> đã hoàn thành công việc. ${statusBadge('Hoàn thành', '#16a34a')}
    </p>
    ${bookingTable(booking)}
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;margin-top:8px;">
      <p style="margin:0;color:#15803d;font-size:14px;">
        Hãy để lại đánh giá để giúp chúng tôi cải thiện dịch vụ nhé! ⭐
      </p>
    </div>
  `);
  await sendMail(toEmail, `[CleanConnect] Đơn ${booking.bookingId} đã hoàn thành`, html).catch(() => {});
};

// Thông báo hủy đơn (gửi cho bên bị ảnh hưởng)
const sendCancelledEmail = async (toEmail, recipientName, booking, cancelledBy) => {
  const html = layout(`
    <h2 style="color:#1f2937;margin-top:0;">Xin chào <strong>${recipientName}</strong>,</h2>
    <p style="color:#4b5563;line-height:1.6;">
      Đơn hàng dưới đây đã bị hủy bởi <strong>${cancelledBy}</strong>.
      ${statusBadge('Đã hủy', '#dc2626')}
    </p>
    ${bookingTable(booking)}
    <p style="color:#6b7280;font-size:14px;">Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ CleanConnect.</p>
  `);
  await sendMail(toEmail, `[CleanConnect] Đơn ${booking.bookingId} đã bị hủy`, html).catch(() => {});
};

// Helper: được giao đơn (admin assign)
const sendHelperAssignedEmail = async (toEmail, helperName, booking) => {
  const html = layout(`
    <h2 style="color:#1f2937;margin-top:0;">Xin chào <strong>${helperName}</strong>,</h2>
    <p style="color:#4b5563;line-height:1.6;">
      Bạn vừa được Admin giao một đơn hàng mới. Vui lòng vào ứng dụng để xác nhận.
    </p>
    ${bookingTable(booking)}
    <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;margin-top:8px;">
      <p style="margin:0;color:#1d4ed8;font-size:14px;">
        Hãy đăng nhập vào CleanConnect để xác nhận và xem chi tiết đơn.
      </p>
    </div>
  `);
  await sendMail(toEmail, `[CleanConnect] Bạn có đơn mới – ${booking.bookingId}`, html).catch(() => {});
};

module.exports = {
  sendOtpEmail,
  sendBookingCreatedEmail,
  sendBookingConfirmedEmail,
  sendCheckinEmail,
  sendCompletedEmail,
  sendCancelledEmail,
  sendHelperAssignedEmail,
};
