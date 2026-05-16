// Tiện ích gửi email sử dụng Nodemailer + Gmail SMTP
const nodemailer = require('nodemailer');

// Khởi tạo transporter với tài khoản Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (không phải mật khẩu thường)
  },
});

// Gửi email chứa mã OTP xác nhận đăng ký
const sendOtpEmail = async (toEmail, otpCode, fullName) => {
  const mailOptions = {
    from: `"CleanConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '[CleanConnect] Mã xác nhận đăng ký tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Xin chào <strong>${fullName}</strong>,</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #ea580c;">CleanConnect</strong>.
            Vui lòng sử dụng mã OTP bên dưới để xác nhận đăng ký:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #fff7ed; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #ea580c;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #6b7280; margin-top: 12px; font-size: 14px;">
              Mã có hiệu lực trong <strong>5 phút</strong>
            </p>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              ⚠️ Không chia sẻ mã này với bất kỳ ai. CleanConnect sẽ không bao giờ hỏi mã OTP của bạn.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            CleanConnect — Dịch vụ giúp việc gia đình theo giờ
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
