import { useRef, useEffect } from 'react';

// 6 ô OTP riêng biệt, tự nhảy ô khi nhập, tự submit khi đủ 6 số
export default function OtpInput({ value, onChange, onComplete, disabled }) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const refs = useRef([]);

  useEffect(() => {
    // Focus ô đầu tiên khi mount
    refs.current[0]?.focus();
  }, []);

  const handleChange = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === idx ? char : d));
    const joined = next.join('');
    onChange(joined);

    if (char && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
    if (joined.length === 6 && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        // Xóa ô hiện tại
        const next = digits.map((d, i) => (i === idx ? '' : d));
        onChange(next.join(''));
      } else if (idx > 0) {
        // Ô rỗng → lùi về ô trước và xóa
        const next = digits.map((d, i) => (i === idx - 1 ? '' : d));
        onChange(next.join(''));
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6).replace(/ /g, ''));
    // Di chuyển focus sang ô cuối cùng được điền
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
    if (pasted.length === 6 && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
            ${digit ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-900'}
            focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
            disabled:opacity-50`}
        />
      ))}
    </div>
  );
}
