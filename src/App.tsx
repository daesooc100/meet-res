/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MeetingRoom, Reservation, EmailLog, ActiveTab, UserRole, Employee, RoomStatus } from './types';
import { 
  loadRooms, 
  saveRooms, 
  loadReservations, 
  saveReservations, 
  loadEmailLogs, 
  saveEmailLogs, 
  resetAllData 
} from './utils/storage';
import { CURRENT_USER, ADMIN_USER } from './data/mockData';
import { 
  getTodayString, 
  checkTimeOverlap, 
  calculateDuration, 
  formatDateKorean 
} from './utils/dateUtils';
import { Header } from './components/Header';
import { RoomSearchFilter } from './components/RoomSearchFilter';
import { RoomCard } from './components/RoomCard';
import { TimetableGrid } from './components/TimetableGrid';
import { ReservationModal } from './components/ReservationModal';
import { MyReservationsView } from './components/MyReservationsView';
import { AdminRoomManager } from './components/AdminRoomManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EmailSimulatorModal } from './components/EmailSimulatorModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Plus, 
  Layers, 
  Calendar,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function App() {
  // Persistent Data States
  const [rooms, setRooms] = useState<MeetingRoom[]>(() => loadRooms());
  const [reservations, setReservations] = useState<Reservation[]>(() => loadReservations());
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => loadEmailLogs());

  // UI Navigation & Persona States
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Filter State
  const [filter, setFilter] = useState({
    date: getTodayString(),
    startTime: '10:00',
    endTime: '11:30',
    minCapacity: 0,
    hasMonitor: false,
    hasProjector: false,
    hasVideoConference: false,
    hasWhiteboard: false,
    floor: 'all',
    viewMode: 'cards' as 'cards' | 'timeline',
  });

  // Modal & Toast States
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<MeetingRoom | undefined>();
  const [initialBookingTime, setInitialBookingTime] = useState<string | undefined>();
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync dark class on root html
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Current active user object depending on role
  const currentUser: Employee = userRole === 'admin' ? ADMIN_USER : CURRENT_USER;

  // Available floors list for filtering
  const availableFloors = Array.from(new Set(rooms.map((r) => r.floor)));

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (filter.minCapacity > 0 && r.capacity < filter.minCapacity) return false;
    if (filter.floor !== 'all' && r.floor !== filter.floor) return false;
    if (filter.hasMonitor && !r.hasMonitor) return false;
    if (filter.hasProjector && !r.hasProjector) return false;
    if (filter.hasVideoConference && !r.hasVideoConference) return false;
    if (filter.hasWhiteboard && !r.hasWhiteboard) return false;
    return true;
  });

  // Booking Handlers
  const handleOpenBooking = (room?: MeetingRoom, time?: string) => {
    setSelectedRoomForBooking(room);
    setInitialBookingTime(time || filter.startTime);
    setEditingReservation(null);
    setIsReservationModalOpen(true);
  };

  const handleEditReservation = (res: Reservation) => {
    setEditingReservation(res);
    const targetRoom = rooms.find((r) => r.id === res.roomId);
    setSelectedRoomForBooking(targetRoom);
    setIsReservationModalOpen(true);
  };

  const handleSaveReservation = (
    reservationData: Omit<Reservation, 'id' | 'createdAt'>,
    emailLog: EmailLog
  ) => {
    if (editingReservation) {
      // Update existing reservation
      const updatedList = reservations.map((r) =>
        r.id === editingReservation.id
          ? { ...r, ...reservationData }
          : r
      );
      setReservations(updatedList);
      saveReservations(updatedList);

      const updatedLogs = [emailLog, ...emailLogs];
      setEmailLogs(updatedLogs);
      saveEmailLogs(updatedLogs);

      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: '예약 정보 수정 완료',
        message: `회의 일정이 성공적으로 변경되었으며, 참석자 ${reservationData.attendees.length}명에게 변경 안내 메일이 발송되었습니다.`,
      });
    } else {
      // Create new reservation
      const newId = `res-${Date.now()}`;
      const newReservation: Reservation = {
        ...reservationData,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      let newItems: Reservation[] = [newReservation];

      // Handle weekly recurring booking (second week)
      if (reservationData.isRecurring && reservationData.recurringWeeksCount === 2) {
        const d = new Date(reservationData.date);
        d.setDate(d.getDate() + 7);
        const secondWeekDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        // Conflict check for second week
        const conflictSecondWeek = reservations.some(
          (r) =>
            r.roomId === reservationData.roomId &&
            r.date === secondWeekDate &&
            r.status !== 'cancelled' &&
            checkTimeOverlap(reservationData.startTime, reservationData.endTime, r.startTime, r.endTime)
        );

        if (!conflictSecondWeek) {
          const secondReservation: Reservation = {
            ...reservationData,
            id: `res-${Date.now()}-w2`,
            date: secondWeekDate,
            createdAt: new Date().toISOString(),
          };
          newItems.push(secondReservation);
        }
      }

      const updatedList = [...newItems, ...reservations];
      setReservations(updatedList);
      saveReservations(updatedList);

      const updatedLogs = [emailLog, ...emailLogs];
      setEmailLogs(updatedLogs);
      saveEmailLogs(updatedLogs);

      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: '회의실 예약 확정',
        message: `${reservationData.title} 예약이 확정되었습니다. 참석자 ${reservationData.attendees.length}명에게 확정 이메일이 발송되었습니다.`,
      });
    }

    setIsReservationModalOpen(false);
  };

  const handleCancelReservation = (res: Reservation) => {
    const updatedList = reservations.map((r) =>
      r.id === res.id ? { ...r, status: 'cancelled' as const } : r
    );
    setReservations(updatedList);
    saveReservations(updatedList);

    const room = rooms.find((r) => r.id === res.roomId);

    // Create cancellation email log
    const cancelEmailLog: EmailLog = {
      id: `mail-${Date.now()}`,
      reservationId: res.id,
      type: 'cancelled',
      recipientEmails: Array.from(new Set([res.organizerEmail, ...res.attendees.map((a) => a.email)])),
      recipientNames: Array.from(new Set([res.organizerName, ...res.attendees.map((a) => a.name)])),
      subject: `[회의실 예약 취소] ${formatDateKorean(res.date)} ${res.startTime} ${room?.name || '회의실'} - ${res.title}`,
      roomName: room?.name || '회의실',
      meetingDate: res.date,
      meetingTime: `${res.startTime} ~ ${res.endTime}`,
      bodyPreview: `해당 회의실 예약이 정상적으로 취소 처리되었습니다. 해당 시간대 예약이 해제되었습니다.`,
      bodyHtml: `
        <div style="font-family: Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 8px; background: #ffffff;">
          <h2 style="color: #dc2626; margin-top: 0;">[회의실 예약 취소 안내]</h2>
          <p style="color: #475569; font-size: 14px;">신청하신 아래 회의실 일정이 주최자에 의해 취소되었습니다.</p>
          <hr style="border: none; border-top: 1px solid #fee2e2; margin: 16px 0;" />
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr><td style="padding: 6px 0; font-weight: 600; width: 100px;">회의명</td><td><del>${res.title}</del></td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">일시</td><td>${formatDateKorean(res.date)} ${res.startTime} ~ ${res.endTime}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">회의실</td><td>${room?.name} (${room?.floor})</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">취소 주체</td><td>${currentUser.name} (${currentUser.department})</td></tr>
          </table>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">* 해당 회의실은 다른 임직원의 예약을 위해 즉시 사용 가능 상태로 전환되었습니다.</p>
        </div>
      `,
      sentAt: new Date().toLocaleString('ko-KR', { hour12: false }),
    };

    const updatedLogs = [cancelEmailLog, ...emailLogs];
    setEmailLogs(updatedLogs);
    saveEmailLogs(updatedLogs);

    setToast({
      id: `toast-${Date.now()}`,
      type: 'info',
      title: '회의실 예약 취소 완료',
      message: '예약이 취소되었으며, 참석자 전원에게 취소 안내 메일이 발송되었습니다.',
    });
  };

  // Admin Room CRUD
  const handleAddRoom = (newRoom: MeetingRoom) => {
    const updated = [newRoom, ...rooms];
    setRooms(updated);
    saveRooms(updated);
    setToast({
      id: `toast-${Date.now()}`,
      type: 'success',
      title: '신규 회의실 등록 완료',
      message: `${newRoom.name} 회의실이 자원 목록에 성공적으로 추가되었습니다.`,
    });
  };

  const handleUpdateRoom = (updatedRoom: MeetingRoom) => {
    const updated = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    setRooms(updated);
    saveRooms(updated);
    setToast({
      id: `toast-${Date.now()}`,
      type: 'success',
      title: '회의실 정보 수정 완료',
      message: `${updatedRoom.name} 정보가 갱신되었습니다.`,
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    const updated = rooms.filter((r) => r.id !== roomId);
    setRooms(updated);
    saveRooms(updated);
    setToast({
      id: `toast-${Date.now()}`,
      type: 'info',
      title: '회의실 삭제 완료',
      message: `${target?.name || '회의실'} 자원이 삭제되었습니다.`,
    });
  };

  const handleToggleRoomStatus = (roomId: string, status: RoomStatus, reason?: string) => {
    const updated = rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            status,
            maintenanceReason: status === 'maintenance' ? reason : undefined,
          }
        : r
    );
    setRooms(updated);
    saveRooms(updated);
    const target = rooms.find((r) => r.id === roomId);

    setToast({
      id: `toast-${Date.now()}`,
      type: status === 'maintenance' ? 'error' : 'success',
      title: status === 'maintenance' ? '점검 모드 전환' : '정상 운영 복구',
      message: `${target?.name}: ${
        status === 'maintenance' ? '신규 예약이 차단되었습니다.' : '임직원 예약이 재개되었습니다.'
      }`,
    });
  };

  const handleResetSampleData = () => {
    const reset = resetAllData();
    setRooms(reset.rooms);
    setReservations(reset.reservations);
    setEmailLogs(reset.emailLogs);
    setToast({
      id: `toast-${Date.now()}`,
      type: 'info',
      title: '샘플 데이터 초기화',
      message: '초기 회의실 목록 및 예약 시드 데이터가 복원되었습니다.',
    });
  };

  const handleViewEmail = (resId: string) => {
    const targetEmail = emailLogs.find((e) => e.reservationId === resId);
    setSelectedEmailId(targetEmail ? targetEmail.id : emailLogs[0]?.id || null);
    setIsEmailModalOpen(true);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 transition-colors dark:bg-slate-950 ${isMobilePreview ? 'py-6 px-4 flex items-center justify-center' : ''}`}>
      {/* Wrapper for optional Mobile Frame Preview */}
      <div className={`w-full flex-1 flex flex-col ${isMobilePreview ? 'max-w-[420px] rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 min-h-[820px]' : ''}`}>
        {/* Top Navigation Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
          setUserRole={setUserRole}
          currentUser={currentUser}
          unreadEmailCount={emailLogs.length}
          onOpenEmailInbox={() => {
            setSelectedEmailId(null);
            setIsEmailModalOpen(true);
          }}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isMobilePreview={isMobilePreview}
          setIsMobilePreview={setIsMobilePreview}
        />

        {/* User Persona & Role Banner */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 dark:bg-slate-900/60 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              현재 사용자:
            </span>
            <span>
              {currentUser.name} {currentUser.position}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentUser.department}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-slate-500">{currentUser.email}</span>
            {userRole === 'admin' && (
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                (총무/IT 관리 권한 활성화)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSampleData}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="초기 테스트 데이터로 리셋"
            >
              <RotateCcw className="w-3 h-3" />
              <span>데이터 초기화</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* TAB 1: 회의실 예약 (검색 및 타임테이블) */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Hero Introduction Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
                <div className="relative z-10 max-w-2xl">
                  <span className="text-xs font-semibold text-blue-300 tracking-wider block mb-1">
                    SMART CORPORATE MEETING SPACES
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    회의실 자동 예약 관리 시스템
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
                    1회 최대 3시간, 최대 2주(14일) 이내 사전 예약 정책을 자동 검증하며, 
                    예약 즉시 참석자 전원에게 실시간 사내 알림 메일이 발송됩니다.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenBooking()}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>빠른 회의실 예약 신청</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-bookings')}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/15"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>내 예약 일정 보기 ({reservations.filter(r => r.organizerId === currentUser.id && r.status !== 'cancelled').length}건)</span>
                    </button>
                  </div>
                </div>

                {/* Decorative subtle pattern */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>

              {/* Filter Controls */}
              <RoomSearchFilter
                filter={filter}
                setFilter={setFilter}
                availableFloors={availableFloors}
              />

              {/* Search Result Count */}
              <div className="flex items-center justify-between text-xs text-slate-600 px-1 dark:text-slate-400">
                <div>
                  선택 일자: <strong className="text-slate-900 dark:text-white">{formatDateKorean(filter.date)}</strong>
                  <span className="mx-2" aria-hidden="true">·</span>
                  선택 시간: <strong className="text-slate-900 dark:text-white tabular-nums">{filter.startTime} ~ {filter.endTime}</strong>
                  <span className="mx-2" aria-hidden="true">·</span>
                  조회된 회의실: <strong className="text-blue-600 dark:text-blue-400 tabular-nums">{filteredRooms.length}개</strong>
                </div>
              </div>

              {/* View Switch: Cards vs Timeline Matrix */}
              {filter.viewMode === 'cards' ? (
                filteredRooms.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      선택하신 검색 조건에 부합하는 회의실이 없습니다.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      인원 수용량 또는 필수 장비 필터를 완화해 보세요.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        selectedDate={filter.date}
                        startTime={filter.startTime}
                        endTime={filter.endTime}
                        reservations={reservations}
                        onBook={(r) => handleOpenBooking(r, filter.startTime)}
                        onViewSchedule={(r) => {
                          setFilter((p) => ({ ...p, viewMode: 'timeline' }));
                        }}
                      />
                    ))}
                  </div>
                )
              ) : (
                /* Timetable Matrix View */
                <TimetableGrid
                  rooms={filteredRooms}
                  reservations={reservations}
                  selectedDate={filter.date}
                  onSlotClick={(r, time) => handleOpenBooking(r, time)}
                  onReservationClick={(res) => {
                    handleEditReservation(res);
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 2: 내 예약 현황 */}
          {activeTab === 'my-bookings' && (
            <MyReservationsView
              reservations={reservations}
              rooms={rooms}
              currentUser={currentUser}
              onEdit={handleEditReservation}
              onCancel={handleCancelReservation}
              onViewEmail={handleViewEmail}
              onNewBookingClick={() => {
                setActiveTab('search');
                handleOpenBooking();
              }}
            />
          )}

          {/* TAB 3: 통계 대시보드 */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard rooms={rooms} reservations={reservations} />
          )}

          {/* TAB 4: 회의실 자원 관리 (Admin CRUD) */}
          {activeTab === 'admin-rooms' && (
            <AdminRoomManager
              rooms={rooms}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
              onToggleStatus={handleToggleRoomStatus}
            />
          )}
        </main>

        {/* Mobile Tab Bar (visible on small viewports) */}
        <div className="md:hidden sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2 flex items-center justify-around text-xs dark:border-slate-800 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'search' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>예약</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-bookings')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'my-bookings' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>내 예약</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'analytics' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>통계</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin-rooms')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'admin-rooms' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>자원 관리</span>
          </button>
        </div>
      </div>

      {/* Reservation Booking / Editing Modal */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        room={selectedRoomForBooking}
        rooms={rooms}
        reservations={reservations}
        currentUser={currentUser}
        initialDate={filter.date}
        initialStartTime={initialBookingTime}
        editingReservation={editingReservation}
        onSave={handleSaveReservation}
      />

      {/* Corporate Email Notification Simulator & Inbox */}
      <EmailSimulatorModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        emailLogs={emailLogs}
        selectedEmailId={selectedEmailId}
      />

      {/* Real-time Toast Feedback */}
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
