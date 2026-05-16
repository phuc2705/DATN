// Unit test cho state machine trạng thái booking — yêu cầu coverage >= 90%
const { assertValidTransition, VALID_TRANSITIONS } = require('../src/controllers/booking.controller');

describe('VALID_TRANSITIONS — cấu trúc state machine', () => {
  test('pending có thể chuyển sang confirmed và cancelled', () => {
    expect(VALID_TRANSITIONS.pending).toEqual(expect.arrayContaining(['confirmed', 'cancelled']));
  });

  test('confirmed có thể chuyển sang in_progress và cancelled', () => {
    expect(VALID_TRANSITIONS.confirmed).toEqual(expect.arrayContaining(['in_progress', 'cancelled']));
  });

  test('in_progress chỉ được chuyển sang completed', () => {
    expect(VALID_TRANSITIONS.in_progress).toEqual(['completed']);
  });

  test('completed và cancelled là trạng thái kết thúc (không có chuyển tiếp)', () => {
    expect(VALID_TRANSITIONS.completed).toHaveLength(0);
    expect(VALID_TRANSITIONS.cancelled).toHaveLength(0);
  });
});

describe('assertValidTransition — chuyển trạng thái hợp lệ', () => {
  test('pending → confirmed không throw', () => {
    expect(() => assertValidTransition('pending', 'confirmed')).not.toThrow();
  });

  test('pending → cancelled không throw', () => {
    expect(() => assertValidTransition('pending', 'cancelled')).not.toThrow();
  });

  test('confirmed → in_progress không throw', () => {
    expect(() => assertValidTransition('confirmed', 'in_progress')).not.toThrow();
  });

  test('confirmed → cancelled không throw', () => {
    expect(() => assertValidTransition('confirmed', 'cancelled')).not.toThrow();
  });

  test('in_progress → completed không throw', () => {
    expect(() => assertValidTransition('in_progress', 'completed')).not.toThrow();
  });
});

describe('assertValidTransition — chuyển trạng thái không hợp lệ (throw 422)', () => {
  const expectInvalid = (from, to) => {
    expect(() => assertValidTransition(from, to)).toThrow();
    try {
      assertValidTransition(from, to);
    } catch (err) {
      expect(err.statusCode).toBe(422);
    }
  };

  test('pending → in_progress bỏ qua bước confirmed', () => {
    expectInvalid('pending', 'in_progress');
  });

  test('pending → completed nhảy nhiều bước', () => {
    expectInvalid('pending', 'completed');
  });

  test('confirmed → completed bỏ qua in_progress', () => {
    expectInvalid('confirmed', 'completed');
  });

  test('in_progress → cancelled (đang làm không được hủy)', () => {
    expectInvalid('in_progress', 'cancelled');
  });

  test('completed → pending (không thể quay lui)', () => {
    expectInvalid('completed', 'pending');
  });

  test('cancelled → confirmed (không thể khôi phục)', () => {
    expectInvalid('cancelled', 'confirmed');
  });
});
