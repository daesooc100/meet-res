import React, { useState } from 'react';
import { Reservation, MeetingRoom, Employee, EmailLog } from '../types';
import { formatDateKorean, getTodayString } from '../utils/dateUtils';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Repeat, 
  Edit3, 
  Trash2, 
  Mail, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History
} from 'lucide-react';

interface MyReservationsViewProps {
  reservations: Reservation[];
  rooms: MeetingRoom[];
  currentUser: Employee;
  onEdit: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
  onViewEmail: (resId: string) => void;
  onNewBookingClick: () => void;
}

export const MyReservationsView: React.FC<MyReservationsViewProps> = ({
  reservations,
  rooms,
  currentUser,
  onEdit,
  onCancel,
  onViewEmail,
  onNewBookingClick,
}) => {
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);

  const today = getTodayString();

  // Find room helper
  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId);

  // Filter reservations relevant to current user (as organizer or attendee)
  const myReservations = reservations.filter(
    (r) => r.organizerId === currentUser.id || r.attendees.some((a) => a.id === currentUser.id)
  );

  const filtered = myReservations.filter((r) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'cancelled') return r.status === 'cancelled';
    if (filterTab === 'upcoming') {
      return r.status !== 'cancelled' && r.date >= today;
    }
    if (filterTab === 'past') {
      return r.status !== 'cancelled' && r.date < today;
    }
    return true;
  });

  const confirmCancel = () => {
    if (cancellingReservation) {
      onCancel(cancellingReservation);
      setCancellingReservation(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            내 예약 및 참여 일정 관리
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser.name} {currentUser.position} ({currentUser.department}) 님의 회의 예약 현황입니다.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'upcoming'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            예정된 회의
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('past')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'past'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            지난 회의
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('cancelled')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'cancelled'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            취소 내역
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            전체 ({myReservations.length})
          </button>
        </div>
      </div>

      {/* Reservation List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3 dark:text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1 dark:text-slate-200">
            조회된 예약 내역이 없습니다
          </h3>
          <p className="text-xs text-slate-500 mb-4 dark:text-slate-400">
            새로운 회의 일정을 등록하고 회의실을 예약해 보세요.
          </p>
          <button
            type="button"
            onClick={onNewBookingClick}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            새 회의실 예약하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((res) => {
            const room = getRoom(res.roomId);
            const isOrganizer = res.organizerId === currentUser.id;
            const isCancelled = res.status === 'cancelled';
            const isPast = res.date < today;

            return (
              <div
                key={res.id}
                className={`p-5 bg-white border rounded-xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-900 ${
                  isCancelled
                    ? 'border-slate-200 opacity-60 dark:border-slate-800'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-bold text-slate-900 dark:text-white ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                      {res.title}
                    </h3>

                    {/* Status text */}
                    {isCancelled ? (
                      <span className="text-xs text-red-600 font-semibold dark:text-red-400">
                        [예약 취소됨]
                      </span>
                    ) : isPast ? (
                      <span className="text-xs text-slate-400 font-medium">
                        [종료됨]
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold dark:text-emerald-400">
                        [예약 확정]
                      </span>
                    )}

                    {res.isRecurring && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        <Repeat className="w-3 h-3" /> 매주 반복
                      </span>
                    )}
                  </div>

                  {/* Date & Time & Room info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatDateKorean(res.date)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-medium text-slate-800 dark:text-slate-200">
                      {res.startTime} ~ {res.endTime} ({res.durationMinutes}분)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {room ? `${room.name} (${room.floor})` : '회의실'}
                    </span>
                  </div>

                  {/* Attendees & Description */}
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 dark:text-slate-400 pt-1">
                    <span>
                      주최: <strong>{res.organizerName}</strong> ({res.organizerDept})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      참석자 ({res.attendees.length}명):{' '}
                      {res.attendees.map((a) => a.name).join(', ')}
                    </span>
                  </div>

                  {res.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 italic dark:text-slate-400">
                      &quot;{res.description}&quot;
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* View Email Notification button */}
                  <button
                    type="button"
                    onClick={() => onViewEmail(res.id)}
                    title="발송된 이메일 알림 내용 보기"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>발송 메일 확인</span>
                  </button>

                  {!isCancelled && !isPast && isOrganizer && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(res)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>수정</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingReservation(res)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap shrink-0 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>예약 취소</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 mb-3 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                회의실 예약을 취소하시겠습니까?
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 dark:text-slate-400 leading-relaxed">
              취소 즉시 참석자({cancellingReservation.attendees.map((a) => a.name).join(', ')}) 전원에게 
              <strong> 예약 취소 안내 이메일</strong>이 자동 발송되며, 해당 시간대는 다른 임직원이 예약할 수 있도록 즉시 개방됩니다.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-4 dark:bg-slate-800 dark:border-slate-700">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {cancellingReservation.title}
              </div>
              <div className="text-slate-500 mt-1 tabular-nums">
                {formatDateKorean(cancellingReservation.date)} {cancellingReservation.startTime} ~ {cancellingReservation.endTime}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingReservation(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                취소 확정 및 취소 메일 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
