// Business Rules Constants
export const MAX_RESERVATION_MINUTES = 180; // 3 hours
export const MAX_ADVANCE_DAYS = 14; // 2 weeks (14 days)

export const TIME_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
];

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMaxAdvanceDateString(): string {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  const year = maxDate.getFullYear();
  const month = String(maxDate.getMonth() + 1).padStart(2, '0');
  const day = String(maxDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return Math.max(0, end - start);
}

export function isWithinAdvanceLimit(dateStr: string): boolean {
  const today = getTodayString();
  const maxDate = getMaxAdvanceDateString();
  return dateStr >= today && dateStr <= maxDate;
}

export function isValidDuration(startTime: string, endTime: string): {
  valid: boolean;
  durationMinutes: number;
  message?: string;
} {
  const duration = calculateDuration(startTime, endTime);
  if (duration <= 0) {
    return {
      valid: false,
      durationMinutes: 0,
      message: '종료 시간은 시작 시간보다 이후여야 합니다.',
    };
  }
  if (duration > MAX_RESERVATION_MINUTES) {
    return {
      valid: false,
      durationMinutes: duration,
      message: `1회 예약은 정책상 최대 3시간(180분)까지 가능합니다. (현재: ${duration / 60}시간)`,
    };
  }
  return { valid: true, durationMinutes: duration };
}

export function formatDateKorean(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = dayNames[d.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

export function getNext14Days(): { date: string; label: string; dayName: string; isToday: boolean }[] {
  const days = [];
  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i <= MAX_ADVANCE_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = dayNames[d.getDay()];

    days.push({
      date: dateStr,
      label: `${month}/${day}`,
      dayName,
      isToday: i === 0,
    });
  }
  return days;
}

export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}
