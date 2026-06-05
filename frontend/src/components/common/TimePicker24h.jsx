// Component chọn giờ 24h — giờ và phút đều nhập số tự do
// Giờ: 0-23 | Phút: 0-59, clamp về giới hạn min khi blur; gõ 2 chữ số giờ → tự nhảy sang ô phút
import { useRef } from 'react';

export default function TimePicker24h({ value = '', onChange, min = '', strict = false, className = '' }) {
  const minuteRef = useRef(null);
  const [h = '', m = ''] = value ? value.split(':') : [];
  const minHNum = min ? parseInt(min.split(':')[0], 10) : 0;
  const minMNum = min ? parseInt(min.split(':')[1], 10) : 0;

  const emit = (newH, newM) => {
    if (newH === '' || newH === undefined || newM === '' || newM === undefined) {
      onChange?.({ target: { value: '' } });
      return;
    }
    onChange?.({ target: { value: `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}` } });
  };

  // Phút nhỏ nhất hợp lệ cho giờ đang nhập
  const getMinMinute = (hNum) => {
    if (!min || isNaN(hNum)) return 0;
    if (hNum < minHNum) return 0;
    if (hNum === minHNum) return strict ? Math.min(minMNum + 1, 59) : minMNum;
    return 0;
  };

  // Giờ nhỏ nhất hợp lệ
  const minHourEffective = min ? minHNum : 0;

  const handleHourChange = (e) => {
    if (e.target.value === '') { onChange?.({ target: { value: '' } }); return; }
    const hNum = Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0));
    const mNum = m !== '' ? parseInt(m, 10) : NaN;
    const effMin = getMinMinute(hNum);
    const newM = isNaN(mNum) ? effMin : Math.max(effMin, mNum);
    emit(hNum, newM);
    // Gõ đủ 2 chữ số → tự chuyển sang ô phút
    if (e.target.value.length >= 2) minuteRef.current?.focus();
  };

  // Khi rời ô giờ: clamp về [minHour, 23] rồi điều chỉnh phút nếu cần
  const handleHourBlur = (e) => {
    if (e.target.value === '') return;
    const hNum = Math.min(23, Math.max(minHourEffective, parseInt(e.target.value, 10) || minHourEffective));
    const mNum = m !== '' ? parseInt(m, 10) : NaN;
    const effMin = getMinMinute(hNum);
    const newM = isNaN(mNum) ? effMin : Math.max(effMin, mNum);
    emit(hNum, newM);
  };

  const handleMinuteChange = (e) => {
    if (e.target.value === '') { onChange?.({ target: { value: '' } }); return; }
    const val = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
    emit(h !== '' ? parseInt(h, 10) : 0, val);
  };

  // Khi rời ô phút: clamp về đúng giới hạn min
  const handleMinuteBlur = (e) => {
    if (e.target.value === '') return;
    const hNum   = h !== '' ? parseInt(h, 10) : 0;
    const effMin = getMinMinute(hNum);
    const val    = Math.min(59, Math.max(effMin, parseInt(e.target.value, 10) || effMin));
    emit(hNum, val);
  };

  const hDisplay   = h === '' ? '' : parseInt(h, 10);
  const mDisplay   = m === '' ? '' : parseInt(m, 10);
  const minMinute  = getMinMinute(h !== '' ? parseInt(h, 10) : NaN);

  const inputCls = 'flex-1 bg-transparent border-none outline-none focus:outline-none text-center ' +
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <input
        type="number"
        min={minHourEffective}
        max={23}
        value={hDisplay}
        onChange={handleHourChange}
        onBlur={handleHourBlur}
        placeholder="giờ"
        className={inputCls}
      />
      <span className="shrink-0 select-none text-gray-400 font-medium px-0.5">:</span>
      <input
        ref={minuteRef}
        type="number"
        min={minMinute}
        max={59}
        value={mDisplay}
        onChange={handleMinuteChange}
        onBlur={handleMinuteBlur}
        placeholder="ph"
        className={inputCls}
      />
    </div>
  );
}
