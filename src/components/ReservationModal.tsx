import React, { useState, useId } from 'react';
import { MeetingRoom, Reservation, Employee, EmailLog } from '../types';
import { EMPLOYEES } from '../data/mockData';
import { 
  TIME_SLOTS, 
  calculateDuration, 
  isValidDuration, 
  isWithinAdvanceLimit, 
  getTodayString, 
  getMaxAdvanceDateString,
  checkTimeOverlap,
  formatDateKorean
} from '../utils/dateUtils';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertCircle, 
  Repeat, 
  Check, 
  Search, 
  Mail, 
  UserPlus, 
  Trash2,
  Sparkles
} from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: MeetingRoom;
  rooms: MeetingRoom[];
  reservations: Reservation[];
  currentUser: Employee;
  initialDate?: string;
  initialStartTime?: string;
  editingReservation?: Reservation | null;
  onSave: (reservationData: Omit<Reservation, 'id' | 'createdAt'>, emailLog: EmailLog) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  room,
  rooms,
  reservations,
  currentUser,
  initialDate,
  initialStartTime,
  editingReservation,
  onSave,
}) => {
  if (!isOpen) return null;

  // Selected Room
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    editingReservation ? editingReservation.roomId : room?.id || (rooms[0]?.id ?? '')
  );

  // Form Fields
  const [title, setTitle] = useState(editingReservation ? editingReservation.title : '');
  const [date, setDate] = useState(
    editingReservation ? editingReservation.date : initialDate || getTodayString()
  );
  const [startTime, setStartTime] = useState(
    editingReservation ? editingReservation.startTime : initialStartTime || '10:00'
  );
  const [endTime, setEndTime] = useState(
    editingReservation
      ? editingReservation.endTime
      : () => {
          const start = initialStartTime || '10:00';
          const [h, m] = start.split(':').map(Number);
          const nextH = Math.min(20, h + 1);
          return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
  );

  const [description, setDescription] = useState(editingReservation?.description || '');
  
  // Recurrence
  const [isRecurring, setIsRecurring] = useState(editingReservation?.isRecurring || false);
  const [recurringWeeks, setRecurringWeeks] = useState(editingReservation?.recurringWeeksCount || 2);

  // Attendees
  const [attendees, setAttendees] = useState<Employee[]>(
    editingReservation?.attendees || [currentUser]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Validation state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);

  // Duration check
  const durationValidation = isValidDuration(startTime, endTime);
  const duration = calculateDuration(startTime, endTime);

  // Check 14-day limit
  const isAdvanceValid = isWithinAdvanceLimit(date);

  // Conflict Detection
  const hasConflict = reservations.some((r) => {
    if (editingReservation && r.id === editingReservation.id) return false;
    return (
      r.roomId === selectedRoomId &&
      r.date === date &&
      r.status !== 'cancelled' &&
      checkTimeOverlap(startTime, endTime, r.startTime, r.endTime)
    );
  });

  // Conflicting reservation details
  const conflictingRes = reservations.find((r) => {
    if (editingReservation && r.id === editingReservation.id) return false;
    return (
      r.roomId === selectedRoomId &&
      r.date === date &&
      r.status !== 'cancelled' &&
      checkTimeOverlap(startTime, endTime, r.startTime, r.endTime)
    );
  });

  // Suggest alternative rooms if conflicting
  const alternativeRooms = rooms.filter((r) => {
    if (r.id === selectedRoomId || r.status === 'maintenance') return false;
    const isFree = !reservations.some(
      (res) =>
        res.roomId === r.id &&
        res.date === date &&
        res.status !== 'cancelled' &&
        checkTimeOverlap(startTime, endTime, res.startTime, res.endTime)
    );
    return isFree;
  });

  // Filtered employees for attendee search
  const filteredEmployees = EMPLOYEES.filter((emp) => {
    const isAlreadyAdded = attendees.some((a) => a.id === emp.id);
    if (isAlreadyAdded) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  });

  const handleAddAttendee = (emp: Employee) => {
    setAttendees((prev) => [...prev, emp]);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleRemoveAttendee = (empId: string) => {
    if (empId === currentUser.id) return; // Cannot remove organizer
    setAttendees((prev) => prev.filter((a) => a.id !== empId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('회의 제목을 입력해 주세요.');
      return;
    }

    if (!isAdvanceValid) {
      setErrorMessage('사전 예약 정책: 현재일 기준 14일(2주) 이내의 날짜만 예약 가능합니다.');
      return;
    }

    if (!durationValidation.valid) {
      setErrorMessage(durationValidation.message || '유효하지 않은 회의 시간입니다.');
      return;
    }

    if (currentRoom?.status === 'maintenance') {
      setErrorMessage('선택하신 회의실은 현재 시설 점검 중으로 예약이 불가능합니다.');
      return;
    }

    if (hasConflict) {
      setErrorMessage('선택하신 시간대에 이미 다른 예약이 존재합니다. 시간을 변경하거나 대체 회의실을 선택해 주세요.');
      return;
    }

    // Prepare reservation data
    const reservationData: Omit<Reservation, 'id' | 'createdAt'> = {
      roomId: selectedRoomId,
      title: title.trim(),
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerDept: currentUser.department,
      organizerEmail: currentUser.email,
      date,
      startTime,
      endTime,
      durationMinutes: duration,
      attendees,
      description: description.trim(),
      isRecurring,
      recurrenceType: isRecurring ? 'weekly' : 'none',
      recurringWeeksCount: isRecurring ? recurringWeeks : 1,
      status: 'confirmed',
    };

    // Prepare email notification log
    const emailRecipients = Array.from(
      new Set([currentUser.email, ...attendees.map((a) => a.email)])
    );
    const recipientNames = Array.from(
      new Set([currentUser.name, ...attendees.map((a) => a.name)])
    );

    const emailType = editingReservation ? 'updated' : 'confirmed';
    const actionLabel = editingReservation ? '변경' : '확정';

    const emailLog: EmailLog = {
      id: `mail-${Date.now()}`,
      reservationId: editingReservation?.id || `res-new`,
      type: emailType,
      recipientEmails: emailRecipients,
      recipientNames,
      subject: `[회의실 예약 ${actionLabel}] ${formatDateKorean(date)} ${startTime} ${currentRoom?.name} - ${title.trim()}`,
      roomName: currentRoom?.name || '회의실',
      meetingDate: date,
      meetingTime: `${startTime} ~ ${endTime} (${duration}분)`,
      bodyPreview: `회의실 예약이 성공적으로 ${actionLabel}되었습니다. 시작 시간 5분 전까지 회의실에 입실해 주시기 바랍니다.`,
      bodyHtml: `
        <div style="font-family: Pretendard, -apple-system, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="font-size: 11px; font-weight: 700; color: #2563eb; letter-spacing: 0.5px;">사내 회의실 예약 시스템</span>
            <h2 style="color: #0f172a; margin: 6px 0 0 0; font-size: 20px;">[회의실 예약 ${actionLabel} 안내]</h2>
          </div>
          <p style="color: #475569; font-size: 14px; margin-top: 0;">
            신청하신 회의실 일정이 내부 예약 데이터베이스에 <strong>${actionLabel}</strong> 등록되었습니다.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr><td style="padding: 6px 0; font-weight: 600; width: 100px; color: #64748b;">회의명</td><td><strong>${title.trim()}</strong></td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #64748b;">일시</td><td>${formatDateKorean(date)} ${startTime} ~ ${endTime} (${duration}분)</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #64748b;">회의실</td><td>${currentRoom?.name} (${currentRoom?.floor})</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #64748b;">주최자</td><td>${currentUser.name} ${currentUser.position} (${currentUser.department})</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #64748b;">참석자</td><td>${recipientNames.join(', ')} (${attendees.length}명)</td></tr>
              ${isRecurring ? `<tr><td style="padding: 6px 0; font-weight: 600; color: #64748b;">반복 설정</td><td>매주 ${recurringWeeks}주간 반복</td></tr>` : ''}
            </table>
          </div>
          ${description ? `
            <div style="padding: 12px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 13px; color: #475569; margin-bottom: 16px;">
              <strong>안건 / 메모:</strong> ${description}
            </div>
          ` : ''}
          <div style="font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <p style="margin: 0;">* 이용 수칙: 다음 사용자를 위해 회의 종료 5분 전 회의를 마무리하고 장비 전원 및 조명을 정돈해 주시기 바랍니다.</p>
            <p style="margin: 4px 0 0 0;">* 회의 일정 취소 또는 변경 시 사내 시스템에서 즉시 처리해 주시기 바랍니다.</p>
          </div>
        </div>
      `,
      sentAt: new Date().toLocaleString('ko-KR', { hour12: false }),
    };

    onSave(reservationData, emailLog);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 dark:bg-slate-900 dark:border-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingReservation ? '회의실 예약 정보 수정' : '신규 회의실 예약 신청'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              회의 예약 완료 시 주최자 및 참석자 전원에게 사내 알림 이메일이 자동 발송됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Room Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
              회의실 선택
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id} disabled={r.status === 'maintenance'}>
                  {r.name} · {r.floor} · 수용 {r.capacity}인 {r.status === 'maintenance' ? '(점검 중 - 불가)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
              회의 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 하반기 신규 프로덕트 스프린트 킥오프"
              className="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                예약 일자 (최대 14일 이내)
              </label>
              <input
                type="date"
                required
                min={getTodayString()}
                max={getMaxAdvanceDateString()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                시작 시간
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {TIME_SLOTS.slice(0, -1).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                종료 시간 (최대 3시간)
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full h-10 px-3 text-xs font-medium border rounded-lg bg-white focus:outline-none dark:bg-slate-800 ${
                  !durationValidation.valid
                    ? 'border-red-500 text-red-600 dark:border-red-500 dark:text-red-400'
                    : 'border-slate-200 text-slate-800 focus:border-blue-600 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {TIME_SLOTS.filter((t) => t > startTime).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration Feedback */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-600 dark:text-slate-400">
              회의 총 시간: <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">{duration}분</strong> ({duration / 60}시간)
            </span>
            {!durationValidation.valid ? (
              <span className="text-red-600 font-medium dark:text-red-400">
                {durationValidation.message}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" /> 3시간 이내 정책 준수
              </span>
            )}
          </div>

          {/* Conflict Alert & Smart Alternative Recommendation */}
          {hasConflict && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs dark:bg-red-950/40 dark:border-red-900">
              <div className="flex items-center gap-1.5 font-semibold text-red-800 dark:text-red-300 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>해당 시간대에 기존 예약이 있어 예약이 불가능합니다.</span>
              </div>
              <p className="text-red-700 dark:text-red-400 mb-2">
                기존 회의: {conflictingRes?.title} ({conflictingRes?.startTime} ~ {conflictingRes?.endTime} · {conflictingRes?.organizerName})
              </p>

              {alternativeRooms.length > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>추천 대체 회의실 (동일 시간대 예약 가능):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alternativeRooms.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => setSelectedRoomId(alt.id)}
                        className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md hover:border-blue-500 hover:text-blue-600 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400"
                      >
                        {alt.name} ({alt.floor} · {alt.capacity}인)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recurrence Option */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/60 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-700"
                />
                <Repeat className="w-4 h-4 text-slate-500" />
                <span>반복 예약 설정 (매주 특정 요일 정기 회의)</span>
              </label>

              {isRecurring && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">반복 기간:</span>
                  <select
                    value={recurringWeeks}
                    onChange={(e) => setRecurringWeeks(Number(e.target.value))}
                    className="h-7 px-2 text-xs border border-slate-200 rounded bg-white dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value={2}>2주간 매주 반복 (정책 허용 한도)</option>
                  </select>
                </div>
              )}
            </div>
            {isRecurring && (
              <p className="text-[11px] text-slate-500 mt-2 pl-6 dark:text-slate-400">
                * 사전 예약 정책(14일 이내)에 따라 최대 2주간 동일 요일/시간대로 자동 등록됩니다.
              </p>
            )}
          </div>

          {/* Attendees Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                회의 참석자 초대 ({attendees.length}명)
              </label>
              <button
                type="button"
                onClick={() => setIsSearching(!isSearching)}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 dark:text-blue-400 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> 사원 검색 추가
              </button>
            </div>

            {/* Attendee search box */}
            {isSearching && (
              <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="임직원 이름, 부서, 직급 또는 이메일 검색..."
                    className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900"
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredEmployees.length === 0 ? (
                    <div className="py-2 text-center text-xs text-slate-400">
                      검색 결과가 없거나 이미 추가된 사원입니다.
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleAddAttendee(emp)}
                        className="w-full py-1.5 px-2 flex items-center justify-between text-left hover:bg-slate-100 rounded transition-colors text-xs dark:hover:bg-slate-700"
                      >
                        <div>
                          <strong className="font-semibold text-slate-800 dark:text-slate-200">{emp.name}</strong>{' '}
                          <span className="text-slate-500">{emp.position} · {emp.department}</span>
                        </div>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400">+ 추가</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Added attendees chips */}
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => {
                const isOrganizer = a.id === currentUser.id;
                return (
                  <div
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  >
                    <span>{a.name}</span>
                    <span className="text-[11px] opacity-75">{a.position}</span>
                    {isOrganizer ? (
                      <span className="text-[10px] text-blue-600 font-semibold dark:text-blue-400">(주최자)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(a.id)}
                        className="text-slate-400 hover:text-red-500 p-0.5 ml-0.5"
                        title="참석자 제외"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
              회의 안건 및 비고 (선택 사항)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="회의 안건, 준비물, 화상회의 접속 링크 등을 입력해 주세요."
              className="w-full p-2.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={hasConflict || !durationValidation.valid}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                hasConflict || !durationValidation.valid
                  ? 'bg-slate-300 cursor-not-allowed dark:bg-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{editingReservation ? '예약 수정 및 알림 발송' : '예약 완료 및 이메일 발송'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
