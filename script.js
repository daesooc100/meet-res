/**
 * 사내 회의실 자동 예약 관리 시스템 - Vanilla JS (ES6+)
 * GitHub Pages 및 브라우저 직접 실행 지원 (빌드 불필요)
 */

(function () {
  'use strict';

  // --- 1. 상수 및 비즈니스 정책 규칙 ---
  const MAX_RESERVATION_MINUTES = 180; // 1회 최대 3시간 (180분)
  const MAX_ADVANCE_DAYS = 14; // 현재일 기준 최대 2주(14일) 이내 사전 예약

  const TIME_SLOTS = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00'
  ];

  // --- 2. 날짜/시간 유틸리티 함수 ---
  function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getMaxAdvanceDateString() {
    const d = new Date();
    d.setDate(d.getDate() + MAX_ADVANCE_DAYS);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function calculateDuration(start, end) {
    return Math.max(0, parseTimeToMinutes(end) - parseTimeToMinutes(start));
  }

  function formatDateKorean(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${y}년 ${m}월 ${d}일 (${dayNames[date.getDay()]})`;
  }

  function getNext14Days() {
    const days = [];
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 0; i <= MAX_ADVANCE_DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push({
        date: `${y}-${m}-${day}`,
        label: `${m}/${day}`,
        dayName: dayNames[d.getDay()],
        isToday: i === 0,
      });
    }
    return days;
  }

  function checkTimeOverlap(start1, end1, start2, end2) {
    const s1 = parseTimeToMinutes(start1);
    const e1 = parseTimeToMinutes(end1);
    const s2 = parseTimeToMinutes(start2);
    const e2 = parseTimeToMinutes(end2);
    return s1 < e2 && e1 > s2;
  }

  // --- 3. 초기 시드 데이터 ---
  const INITIAL_ROOMS = [
    {
      id: 'room-alpha',
      name: '대회의실 (Alpha)',
      floor: '5층 임원실 옆',
      capacity: 20,
      hasMonitor: true,
      hasProjector: false,
      hasVideoConference: true,
      hasWhiteboard: true,
      status: 'available',
      imageUrl: './src/assets/images/room_executive_board_1793771832524.jpg',
      description: '최고급 원목 회의 테이블, 85인치 4K 디스플레이 및 스피커폰 화상회의 설비가 완비된 최고 경영/임원 회의실입니다.',
    },
    {
      id: 'room-beta',
      name: '창의회의실 (Beta)',
      floor: '4층 애자일 허브',
      capacity: 12,
      hasMonitor: false,
      hasProjector: true,
      hasVideoConference: false,
      hasWhiteboard: true,
      status: 'available',
      imageUrl: './src/assets/images/room_creative_projector_1793771834226.jpg',
      description: '고화질 레이저 천장 빔프로젝터, 전면 유리 화이트보드가 설치되어 브레인스토밍 및 스프린트 기획에 최적화되어 있습니다.',
    },
    {
      id: 'room-gamma',
      name: '포커스 허들룸 (Gamma)',
      floor: '3층 개발본부',
      capacity: 4,
      hasMonitor: true,
      hasProjector: false,
      hasVideoConference: true,
      hasWhiteboard: false,
      status: 'available',
      imageUrl: './src/assets/images/room_focus_huddle_1793771835464.jpg',
      description: '소규모 1:1 면담, 코드 리뷰 및 집중 인터뷰용 원형 테이블과 55인치 스마트 모니터를 갖춘 아늑한 방음 룸입니다.',
    },
    {
      id: 'room-grand',
      name: '타운홀 컨퍼런스룸',
      floor: '본관 2층 대강당',
      capacity: 50,
      hasMonitor: false,
      hasProjector: true,
      hasVideoConference: true,
      hasWhiteboard: true,
      status: 'available',
      imageUrl: './src/assets/images/room_large_townhall_1793771834830.jpg',
      description: '전사 타운홀 미팅, 외부 고객사 세미나용 듀얼 대형 프로젝터 및 무선 마이크 사운드 시스템을 구비한 다목적 컨퍼런스룸입니다.',
    },
    {
      id: 'room-delta',
      name: '스마트 미팅룸 (Delta)',
      floor: '3층 기획본부',
      capacity: 8,
      hasMonitor: true,
      hasProjector: false,
      hasVideoConference: true,
      hasWhiteboard: true,
      status: 'available',
      imageUrl: './src/assets/images/room_focus_huddle_1793771835464.jpg',
      description: '팀 단위 주간 업무 회의 및 실시간 화면 미러링이 가능한 65인치 터치 모니터와 전자칠판이 제공됩니다.',
    },
    {
      id: 'room-epsilon',
      name: '혁신 랩실 (Epsilon)',
      floor: '4층 R&D 파크',
      capacity: 10,
      hasMonitor: true,
      hasProjector: true,
      hasVideoConference: true,
      hasWhiteboard: true,
      status: 'maintenance',
      maintenanceReason: '빔프로젝터 광원 램프 교체 및 네트워크 케이블링 정기 점검 중 (내일 오전 10시 완료 예정)',
      imageUrl: './src/assets/images/room_creative_projector_1793771834226.jpg',
      description: '고성능 빔프로젝터와 다자간 화상회의 코덱이 장착된 차세대 연구개발 전용 회의실입니다.',
    },
  ];

  const EMPLOYEES = [
    { id: 'emp-01', name: '홍길동', department: '프로덕트기획팀', position: '책임', email: 'gildong.hong@company.internal' },
    { id: 'emp-02', name: '김민준', department: '플랫폼개발팀', position: '팀장', email: 'minjun.kim@company.internal' },
    { id: 'emp-03', name: '이서연', department: 'UX/UI디자인팀', position: '수석', email: 'seoyeon.lee@company.internal' },
    { id: 'emp-04', name: '박도현', department: '백엔드개발팀', position: '선임', email: 'dohyun.park@company.internal' },
    { id: 'emp-05', name: '최유진', department: '경영지원본부', position: '이사', email: 'yujin.choi@company.internal' },
    { id: 'emp-06', name: '정지훈', department: '데이터엔지니어링팀', position: '책임', email: 'jihoon.jung@company.internal' },
    { id: 'emp-07', name: '강다은', department: '글로벌마케팅팀', position: '매니저', email: 'daeun.kang@company.internal' },
    { id: 'emp-08', name: '윤재석', department: '클라우드인프라팀', position: '수석', email: 'jaeseok.yoon@company.internal' },
    { id: 'emp-09', name: '한소희', department: '전략사업추진팀', position: '책임', email: 'sohee.han@company.internal' },
    { id: 'emp-10', name: '이진호', department: '총무/IT자산관리팀', position: '팀장', email: 'jinho.lee@company.internal' },
  ];

  const CURRENT_USER = EMPLOYEES[0];
  const ADMIN_USER = EMPLOYEES[9];

  function getInitialReservations() {
    const today = getTodayString();
    const d1 = new Date(); d1.setDate(d1.getDate() + 1);
    const tomorrow = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
    const d2 = new Date(); d2.setDate(d2.getDate() + 2);
    const dayAfter = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;

    return [
      {
        id: 'res-101',
        roomId: 'room-alpha',
        title: '2026 하반기 신규 서비스 전략 로드맵 검토',
        organizerId: CURRENT_USER.id,
        organizerName: CURRENT_USER.name,
        organizerDept: CURRENT_USER.department,
        organizerEmail: CURRENT_USER.email,
        date: today,
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        attendees: [EMPLOYEES[1], EMPLOYEES[2], EMPLOYEES[4]],
        description: '각 본부별 핵심 마일스톤 점검 및 3분기 예산 분배 회의입니다. 모니터로 기획서 공유 예정입니다.',
        isRecurring: false,
        status: 'confirmed',
        createdAt: '2026-11-03T09:00:00Z',
      },
      {
        id: 'res-102',
        roomId: 'room-beta',
        title: '신규 디자인 시스템 토큰 동기화 스프린트',
        organizerId: 'emp-03',
        organizerName: '이서연',
        organizerDept: 'UX/UI디자인팀',
        organizerEmail: 'seoyeon.lee@company.internal',
        date: today,
        startTime: '14:00',
        endTime: '16:00',
        durationMinutes: 120,
        attendees: [EMPLOYEES[0], EMPLOYEES[3]],
        description: '웹/모바일 일관성 강화를 위한 컬러 및 타이포그래피 토큰 코드 반영 논의.',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurringWeeksCount: 2,
        status: 'confirmed',
        createdAt: '2026-11-02T15:20:00Z',
      },
      {
        id: 'res-103',
        roomId: 'room-gamma',
        title: '백엔드 마이크로서비스 아키텍처 1:1 코드 리뷰',
        organizerId: 'emp-04',
        organizerName: '박도현',
        organizerDept: '백엔드개발팀',
        organizerEmail: 'dohyun.park@company.internal',
        date: today,
        startTime: '16:30',
        endTime: '17:30',
        durationMinutes: 60,
        attendees: [EMPLOYEES[1]],
        description: 'Redis 캐시 정책 및 비동기 메시지 큐 트랜잭션 롤백 정책 검증',
        isRecurring: false,
        status: 'confirmed',
        createdAt: '2026-11-03T08:15:00Z',
      },
      {
        id: 'res-104',
        roomId: 'room-delta',
        title: '주간 프로덕트 지표 분석 및 배포 플랜',
        organizerId: CURRENT_USER.id,
        organizerName: CURRENT_USER.name,
        organizerDept: CURRENT_USER.department,
        organizerEmail: CURRENT_USER.email,
        date: tomorrow,
        startTime: '13:00',
        endTime: '14:30',
        durationMinutes: 90,
        attendees: [EMPLOYEES[5], EMPLOYEES[6]],
        description: '지난주 전환율 분석 및 신규 기능 A/B 테스트 지표 점검',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurringWeeksCount: 2,
        status: 'confirmed',
        createdAt: '2026-11-03T11:00:00Z',
      },
      {
        id: 'res-105',
        roomId: 'room-grand',
        title: '전사 기술 공유회 (Tech Talk 세션)',
        organizerId: 'emp-02',
        organizerName: '김민준',
        organizerDept: '플랫폼개발팀',
        organizerEmail: 'minjun.kim@company.internal',
        date: dayAfter,
        startTime: '15:00',
        endTime: '17:00',
        durationMinutes: 120,
        attendees: [EMPLOYEES[0], EMPLOYEES[1], EMPLOYEES[2], EMPLOYEES[3], EMPLOYEES[4], EMPLOYEES[5]],
        description: '생성형 AI 기술 사내 파이프라인 적용 사례 발표 및 Q&A 세션',
        isRecurring: false,
        status: 'confirmed',
        createdAt: '2026-11-01T14:00:00Z',
      },
    ];
  }

  function getInitialEmailLogs() {
    const today = getTodayString();
    return [
      {
        id: 'mail-01',
        reservationId: 'res-101',
        type: 'confirmed',
        recipientEmails: [
          'gildong.hong@company.internal',
          'minjun.kim@company.internal',
          'seoyeon.lee@company.internal',
          'yujin.choi@company.internal',
        ],
        recipientNames: ['홍길동', '김민준', '이서연', '최유진'],
        subject: `[회의실 예약 확정] ${today} 10:00 대회의실 (Alpha) - 2026 하반기 신규 서비스 전략 로드맵 검토`,
        roomName: '대회의실 (Alpha)',
        meetingDate: today,
        meetingTime: '10:00 ~ 12:00 (120분)',
        bodyPreview: '사내 회의실 예약이 성공적으로 확정되었습니다. 참석자 분들은 시작 5분 전까지 5층 대회의실로 입실해 주시기 바랍니다.',
        bodyHtml: `
          <div style="font-family: Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-bottom: 8px;">[회의실 예약 확정 안내]</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 0;">사내 자동 예약 시스템에서 예약이 정상 승인되었습니다.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr><td style="padding: 6px 0; font-weight: 600; width: 100px;">회의명</td><td>2026 하반기 신규 서비스 전략 로드맵 검토</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">일시</td><td>${today} 10:00 ~ 12:00 (2시간)</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">장소</td><td>대회의실 (Alpha) (5층 임원실 옆)</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">주최자</td><td>홍길동 책임 (프로덕트기획팀)</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">참석자</td><td>홍길동, 김민준, 이서연, 최유진</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; color: #475569;">
              <strong>회의 개요:</strong> 각 본부별 핵심 마일스톤 점검 및 3분기 예산 분배 회의입니다. 모니터로 기획서 공유 예정입니다.
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">* 본 메일은 사내 회의실 자동 예약 관리 시스템에서 발송된 발신 전용 안내 메일입니다.</p>
          </div>
        `,
        sentAt: '2026-11-03 09:00:15',
      },
    ];
  }

  // --- 4. 로컬 스토리지 매니저 ---
  const STORAGE_KEYS = {
    ROOMS: 'vanilla_corp_meeting_rooms_v2',
    RESERVATIONS: 'vanilla_corp_reservations_v2',
    EMAIL_LOGS: 'vanilla_corp_email_logs_v2',
    DARK_MODE: 'vanilla_corp_dark_mode_v2',
  };

  function loadStorage(key, fallbackFn) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    const val = typeof fallbackFn === 'function' ? fallbackFn() : fallbackFn;
    saveStorage(key, val);
    return val;
  }

  function saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(e);
    }
  }

  // --- 5. 앱 통합 상태 객체 ---
  const state = {
    rooms: loadStorage(STORAGE_KEYS.ROOMS, INITIAL_ROOMS),
    reservations: loadStorage(STORAGE_KEYS.RESERVATIONS, getInitialReservations),
    emailLogs: loadStorage(STORAGE_KEYS.EMAIL_LOGS, getInitialEmailLogs),
    activeTab: 'search', // 'search' | 'my-bookings' | 'analytics' | 'admin-rooms'
    userRole: 'user', // 'user' | 'admin'
    isDarkMode: localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true',
    isMobilePreview: false,
    myBookingsFilter: 'upcoming', // 'upcoming' | 'past' | 'cancelled' | 'all'
    filter: {
      date: getTodayString(),
      startTime: '10:00',
      endTime: '11:30',
      minCapacity: 0,
      hasMonitor: false,
      hasProjector: false,
      hasVideoConference: false,
      hasWhiteboard: false,
      floor: 'all',
      viewMode: 'cards', // 'cards' | 'timeline'
    },
    modal: {
      reservationOpen: false,
      selectedRoomId: null,
      initialTime: null,
      editingReservation: null,
      emailInboxOpen: false,
      selectedEmailId: null,
      cancelTargetReservation: null,
      roomEditModalOpen: false,
      editingRoom: null,
      maintenanceTargetRoom: null,
      deleteTargetRoomId: null,
    },
    toast: null,
  };

  // --- 6. 헬퍼 함수들 ---
  function getCurrentUser() {
    return state.userRole === 'admin' ? ADMIN_USER : CURRENT_USER;
  }

  function showToast(type, title, message) {
    state.toast = { type, title, message, id: Date.now() };
    renderToast();
    setTimeout(() => {
      if (state.toast && Date.now() - state.toast.id >= 4000) {
        state.toast = null;
        renderToast();
      }
    }, 4500);
  }

  function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(state.isDarkMode));
    applyTheme();
    renderApp();
  }

  function applyTheme() {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.EMAIL_LOGS);
    state.rooms = INITIAL_ROOMS;
    state.reservations = getInitialReservations();
    state.emailLogs = getInitialEmailLogs();
    saveStorage(STORAGE_KEYS.ROOMS, state.rooms);
    saveStorage(STORAGE_KEYS.RESERVATIONS, state.reservations);
    saveStorage(STORAGE_KEYS.EMAIL_LOGS, state.emailLogs);
    showToast('info', '데이터 초기화', '초기 회의실 자원 및 시드 예약 데이터가 복원되었습니다.');
    renderApp();
  }

  // --- 7. 메인 렌더링 엔진 ---
  function renderApp() {
    applyTheme();
    const root = document.getElementById('root');
    if (!root) return;

    const currentUser = getCurrentUser();
    const availableFloors = Array.from(new Set(state.rooms.map((r) => r.floor)));

    root.className = `min-h-screen flex flex-col bg-slate-50 transition-colors dark:bg-slate-950 ${
      state.isMobilePreview ? 'py-6 px-4 flex items-center justify-center' : ''
    }`;

    root.innerHTML = `
      <div class="w-full flex-1 flex flex-col ${
        state.isMobilePreview
          ? 'max-w-[420px] rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 min-h-[820px]'
          : ''
      }">
        <!-- Top Bar Header -->
        <header class="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
          <div class="flex items-center gap-3 shrink-0">
            <a href="#" id="brand-logo" class="text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600 whitespace-nowrap shrink-0 dark:text-white dark:hover:text-blue-400">
              사내 회의실 자동 예약
            </a>
          </div>

          <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button type="button" data-nav="search" class="cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              state.activeTab === 'search'
                ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }">회의실 예약</button>
            <button type="button" data-nav="my-bookings" class="cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              state.activeTab === 'my-bookings'
                ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }">내 예약 현황</button>
            <button type="button" data-nav="analytics" class="cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              state.activeTab === 'analytics'
                ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }">통계 대시보드</button>
            <button type="button" data-nav="admin-rooms" class="cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              state.activeTab === 'admin-rooms'
                ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }">자원 관리 ${state.userRole === 'admin' ? '(총무부)' : ''}</button>
          </nav>

          <div class="flex items-center gap-3 shrink-0">
            <!-- Mobile Preview Switch -->
            <button type="button" id="toggle-mobile-preview" class="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800" title="모바일 뷰 전환">
              <i data-lucide="${state.isMobilePreview ? 'laptop' : 'smartphone'}" class="w-3.5 h-3.5"></i>
              <span>${state.isMobilePreview ? '데스크톱' : '모바일 뷰'}</span>
            </button>

            <!-- Email Notification Inbox Trigger -->
            <button type="button" id="open-email-inbox" class="relative flex items-center justify-center p-2 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800" title="발송된 사내 이메일 알림 내역">
              <i data-lucide="mail" class="w-4 h-4"></i>
              ${
                state.emailLogs.length > 0
                  ? `<span class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white tabular-nums">${state.emailLogs.length}</span>`
                  : ''
              }
            </button>

            <!-- Dark/Light Mode -->
            <button type="button" id="toggle-dark-mode" class="flex items-center justify-center p-2 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800" title="화면 테마 전환">
              <i data-lucide="${state.isDarkMode ? 'sun' : 'moon'}" class="w-4 h-4 ${state.isDarkMode ? 'text-amber-400' : ''}"></i>
            </button>

            <!-- Role Switcher -->
            <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
              <button type="button" id="role-user-btn" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                state.userRole === 'user'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }">
                <i data-lucide="user" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">임직원</span>
              </button>
              <button type="button" id="role-admin-btn" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                state.userRole === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">관리자</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Current User Banner -->
        <div class="bg-white border-b border-slate-200 px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 dark:bg-slate-900/60 dark:border-slate-800">
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span class="font-semibold text-slate-800 dark:text-slate-200">현재 사용자:</span>
            <span>${currentUser.name} ${currentUser.position}</span>
            <span aria-hidden="true">·</span>
            <span>${currentUser.department}</span>
            <span aria-hidden="true">·</span>
            <span class="tabular-nums text-slate-500">${currentUser.email}</span>
            ${
              state.userRole === 'admin'
                ? '<span class="text-[11px] font-semibold text-blue-600 dark:text-blue-400">(총무/IT 관리 권한 활성화)</span>'
                : ''
            }
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="reset-data-btn" class="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer" title="초기 테스트 데이터로 리셋">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>데이터 초기화</span>
            </button>
          </div>
        </div>

        <!-- Main Content Area -->
        <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6" id="main-content">
          ${renderActiveTabContent()}
        </main>

        <!-- Mobile Bottom Nav Bar -->
        <div class="md:hidden sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2 flex items-center justify-around text-xs dark:border-slate-800 dark:bg-slate-900/95">
          <button type="button" data-nav="search" class="flex flex-col items-center gap-1 ${state.activeTab === 'search' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}">
            <i data-lucide="calendar-days" class="w-4 h-4"></i>
            <span>예약</span>
          </button>
          <button type="button" data-nav="my-bookings" class="flex flex-col items-center gap-1 ${state.activeTab === 'my-bookings' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}">
            <i data-lucide="clock" class="w-4 h-4"></i>
            <span>내 예약</span>
          </button>
          <button type="button" data-nav="analytics" class="flex flex-col items-center gap-1 ${state.activeTab === 'analytics' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}">
            <i data-lucide="layers" class="w-4 h-4"></i>
            <span>통계</span>
          </button>
          <button type="button" data-nav="admin-rooms" class="flex flex-col items-center gap-1 ${state.activeTab === 'admin-rooms' ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500'}">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>자원 관리</span>
          </button>
        </div>
      </div>

      <!-- Modals and Toasts Containers -->
      <div id="modal-container"></div>
      <div id="toast-container"></div>
    `;

    attachGlobalEvents();
    renderModals();
    renderToast();

    // Lucide Icons 초기화
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- 8. 각 탭 화면 렌더링 ---
  function renderActiveTabContent() {
    if (state.activeTab === 'search') return renderSearchTab();
    if (state.activeTab === 'my-bookings') return renderMyBookingsTab();
    if (state.activeTab === 'analytics') return renderAnalyticsTab();
    if (state.activeTab === 'admin-rooms') return renderAdminRoomsTab();
    return '';
  }

  // [TAB 1] 회의실 예약 검색 및 타임테이블
  function renderSearchTab() {
    const next14Days = getNext14Days();
    const duration = calculateDuration(state.filter.startTime, state.filter.endTime);
    const isOverDuration = duration > MAX_RESERVATION_MINUTES;
    const isInvalidTime = duration <= 0;
    const availableFloors = Array.from(new Set(state.rooms.map((r) => r.floor)));

    // 필터링된 회의실
    const filteredRooms = state.rooms.filter((r) => {
      if (state.filter.minCapacity > 0 && r.capacity < state.filter.minCapacity) return false;
      if (state.filter.floor !== 'all' && r.floor !== state.filter.floor) return false;
      if (state.filter.hasMonitor && !r.hasMonitor) return false;
      if (state.filter.hasProjector && !r.hasProjector) return false;
      if (state.filter.hasVideoConference && !r.hasVideoConference) return false;
      if (state.filter.hasWhiteboard && !r.hasWhiteboard) return false;
      return true;
    });

    const activeUserBookingsCount = state.reservations.filter(
      (r) => r.organizerId === getCurrentUser().id && r.status !== 'cancelled'
    ).length;

    return `
      <div class="space-y-6">
        <!-- Hero Introduction Banner -->
        <div class="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
          <div class="relative z-10 max-w-2xl">
            <span class="text-xs font-semibold text-blue-300 tracking-wider block mb-1">
              SMART CORPORATE MEETING SPACES
            </span>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              회의실 자동 예약 관리 시스템
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
              1회 최대 3시간, 최대 2주(14일) 이내 사전 예약 정책을 자동 검증하며, 
              예약 즉시 참석자 전원에게 실시간 사내 알림 메일이 발송됩니다.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <button type="button" id="hero-quick-book-btn" class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-sm cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>빠른 회의실 예약 신청</span>
              </button>
              <button type="button" data-nav="my-bookings" class="flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/15">
                <i data-lucide="calendar" class="w-4 h-4"></i>
                <span>내 예약 일정 보기 (${activeUserBookingsCount}건)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Filter Controls Container -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-colors dark:bg-slate-900 dark:border-slate-800">
          <!-- Policy Notice Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-700 dark:text-slate-200">예약 핵심 정책:</span>
              <span>1회 최대 3시간</span>
              <span aria-hidden="true">·</span>
              <span>현재일 기준 14일 이내 사전 예약</span>
              <span aria-hidden="true">·</span>
              <span>자체 사내 DB 실시간 연동</span>
            </div>
            
            <!-- View Mode Switcher -->
            <div class="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg dark:bg-slate-800">
              <button type="button" id="btn-view-cards" class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                state.filter.viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                <span>카드 뷰</span>
              </button>
              <button type="button" id="btn-view-timeline" class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                state.filter.viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }">
                <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
                <span>타임테이블 뷰</span>
              </button>
            </div>
          </div>

          <!-- Date Carousel (14-day limit) -->
          <div class="mb-4">
            <label class="block text-xs font-semibold text-slate-700 mb-2 dark:text-slate-300">
              예약 희망 일자 (최대 14일 사전 예약)
            </label>
            <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              ${next14Days
                .map((d) => {
                  const isSelected = state.filter.date === d.date;
                  return `
                    <button type="button" data-date="${d.date}" class="date-chip flex flex-col items-center justify-center min-w-[72px] px-2.5 py-2 rounded-lg border text-xs transition-all whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }">
                      <span class="text-[11px] opacity-75">${d.dayName}요일</span>
                      <span class="text-sm font-semibold tabular-nums mt-0.5">${d.label}</span>
                      ${d.isToday ? '<span class="text-[10px] text-blue-600 dark:text-blue-400 font-medium">오늘</span>' : ''}
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>

          <!-- Time, Capacity & Floor Filters -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <!-- Time Range -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                회의 희망 시간 (1회 최대 3시간)
              </label>
              <div class="flex items-center gap-2">
                <select id="filter-start-time" class="flex-1 h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  ${TIME_SLOTS.slice(0, -1)
                    .map((t) => `<option value="${t}" ${t === state.filter.startTime ? 'selected' : ''}>시작: ${t}</option>`)
                    .join('')}
                </select>
                <span class="text-slate-400 text-xs">~</span>
                <select id="filter-end-time" class="flex-1 h-9 px-3 text-xs font-medium border rounded-lg bg-white focus:outline-none dark:bg-slate-800 ${
                  isOverDuration || isInvalidTime
                    ? 'border-red-500 text-red-600 dark:border-red-500 dark:text-red-400'
                    : 'border-slate-200 text-slate-800 focus:border-blue-600 dark:border-slate-700 dark:text-slate-200'
                }">
                  ${TIME_SLOTS.filter((t) => t > state.filter.startTime)
                    .map((t) => `<option value="${t}" ${t === state.filter.endTime ? 'selected' : ''}>종료: ${t}</option>`)
                    .join('')}
                </select>
              </div>
              <div class="mt-1 text-[11px] flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400">
                  선택 회의 시간: <strong class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">${duration}분</strong> (${(duration / 60).toFixed(1)}시간)
                </span>
                ${
                  isOverDuration
                    ? '<span class="text-red-600 font-medium flex items-center gap-1 dark:text-red-400"><i data-lucide="alert-circle" class="w-3 h-3"></i> 최대 3시간 초과 불가</span>'
                    : ''
                }
              </div>
            </div>

            <!-- Capacity Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">최소 수용 인원</label>
              <select id="filter-capacity" class="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="0" ${state.filter.minCapacity === 0 ? 'selected' : ''}>인원 무관 (전체)</option>
                <option value="4" ${state.filter.minCapacity === 4 ? 'selected' : ''}>4인 이상 (소형/허들)</option>
                <option value="8" ${state.filter.minCapacity === 8 ? 'selected' : ''}>8인 이상 (중형)</option>
                <option value="12" ${state.filter.minCapacity === 12 ? 'selected' : ''}>12인 이상 (대형)</option>
                <option value="20" ${state.filter.minCapacity === 20 ? 'selected' : ''}>20인 이상 (임원/세미나)</option>
                <option value="40" ${state.filter.minCapacity === 40 ? 'selected' : ''}>40인 이상 (대강당)</option>
              </select>
            </div>

            <!-- Floor Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">층 / 위치 구역</label>
              <select id="filter-floor" class="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="all" ${state.filter.floor === 'all' ? 'selected' : ''}>전체 층 및 구역</option>
                ${availableFloors
                  .map((fl) => `<option value="${fl}" ${state.filter.floor === fl ? 'selected' : ''}>${fl}</option>`)
                  .join('')}
              </select>
            </div>
          </div>

          <!-- Equipment Checkboxes -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-2">필수 장비 옵션:</span>
            <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input type="checkbox" id="chk-monitor" class="rounded text-blue-600" ${state.filter.hasMonitor ? 'checked' : ''}>
              <span>대형 모니터</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input type="checkbox" id="chk-projector" class="rounded text-blue-600" ${state.filter.hasProjector ? 'checked' : ''}>
              <span>빔프로젝터</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input type="checkbox" id="chk-video" class="rounded text-blue-600" ${state.filter.hasVideoConference ? 'checked' : ''}>
              <span>화상회의</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input type="checkbox" id="chk-whiteboard" class="rounded text-blue-600" ${state.filter.hasWhiteboard ? 'checked' : ''}>
              <span>화이트보드</span>
            </label>
            <button type="button" id="btn-reset-filters" class="text-xs text-blue-600 hover:underline dark:text-blue-400 ml-auto cursor-pointer">
              필터 초기화
            </button>
          </div>
        </div>

        <!-- Result Overview Bar -->
        <div class="flex items-center justify-between text-xs text-slate-600 px-1 dark:text-slate-400">
          <div>
            선택 일자: <strong class="text-slate-900 dark:text-white">${formatDateKorean(state.filter.date)}</strong>
            <span class="mx-2" aria-hidden="true">·</span>
            선택 시간: <strong class="text-slate-900 dark:text-white tabular-nums">${state.filter.startTime} ~ ${state.filter.endTime}</strong>
            <span class="mx-2" aria-hidden="true">·</span>
            조회된 회의실: <strong class="text-blue-600 dark:text-blue-400 tabular-nums">${filteredRooms.length}개</strong>
          </div>
        </div>

        <!-- View Mode Display -->
        ${
          state.filter.viewMode === 'cards'
            ? renderRoomCardsGrid(filteredRooms)
            : renderTimetableMatrix(filteredRooms)
        }
      </div>
    `;
  }

  // 회의실 카드 그리드
  function renderRoomCardsGrid(rooms) {
    if (rooms.length === 0) {
      return `
        <div class="p-12 text-center bg-white border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">선택하신 검색 조건에 부합하는 회의실이 없습니다.</p>
          <p class="text-xs text-slate-400 mt-1">인원 수용량 또는 필수 장비 필터를 완화해 보세요.</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${rooms.map((room) => renderSingleRoomCard(room)).join('')}
      </div>
    `;
  }

  // 단일 회의실 카드 렌더링
  function renderSingleRoomCard(room) {
    const isMaintenance = room.status === 'maintenance';
    const conflictingRes = state.reservations.find(
      (r) =>
        r.roomId === room.id &&
        r.date === state.filter.date &&
        r.status !== 'cancelled' &&
        checkTimeOverlap(state.filter.startTime, state.filter.endTime, r.startTime, r.endTime)
    );
    const isAvailable = !isMaintenance && !conflictingRes;

    return `
      <div class="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700">
        <div class="relative aspect-16/9 w-full bg-slate-100 overflow-hidden dark:bg-slate-800">
          <img src="${room.imageUrl}" alt="${room.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" onerror="this.src='./src/assets/images/room_creative_projector_1793771834226.jpg'">
          
          <div class="absolute top-2.5 right-2.5">
            ${
              isMaintenance
                ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500/95 text-white rounded-md shadow-xs"><i data-lucide="wrench" class="w-3 h-3"></i> 시설 점검 중</span>'
                : conflictingRes
                ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-600/90 text-white rounded-md shadow-xs"><i data-lucide="x-circle" class="w-3 h-3"></i> 예약 마감</span>'
                : '<span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600/90 text-white rounded-md shadow-xs"><i data-lucide="check-circle-2" class="w-3 h-3"></i> 예약 가능</span>'
            }
          </div>

          <div class="absolute bottom-2.5 left-2.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-black/60 text-white rounded-md backdrop-blur-xs">
              <i data-lucide="map-pin" class="w-3 h-3"></i> ${room.floor}
            </span>
          </div>
        </div>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <h3 class="text-base font-bold text-slate-900 tracking-tight dark:text-white">${room.name}</h3>
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">최대 ${room.capacity}인</span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2 mb-3 dark:text-slate-400">${room.description}</p>
            
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mb-4 dark:text-slate-300">
              ${room.hasMonitor ? '<span class="inline-flex items-center gap-1"><i data-lucide="monitor" class="w-3.5 h-3.5 text-blue-600"></i> 대형 모니터</span>' : ''}
              ${room.hasProjector ? '<span class="inline-flex items-center gap-1"><i data-lucide="projector" class="w-3.5 h-3.5 text-purple-600"></i> 빔프로젝터</span>' : ''}
              ${room.hasVideoConference ? '<span class="inline-flex items-center gap-1"><i data-lucide="video" class="w-3.5 h-3.5 text-emerald-600"></i> 화상회의</span>' : ''}
              ${room.hasWhiteboard ? '<span class="inline-flex items-center gap-1"><i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-amber-600"></i> 화이트보드</span>' : ''}
            </div>
          </div>

          ${
            isMaintenance
              ? `<div class="p-2.5 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
                  <span class="font-semibold block mb-0.5">점검 사유:</span>
                  <span>${room.maintenanceReason || '정기 시설/장비 유지보수 작업 중'}</span>
                </div>`
              : conflictingRes
              ? `<div class="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
                  <span class="font-semibold block mb-0.5">선택 시간대 충돌 예약:</span>
                  <span class="tabular-nums font-medium">${conflictingRes.startTime} ~ ${conflictingRes.endTime}</span>
                  <span class="text-slate-600 dark:text-slate-400">(${conflictingRes.organizerName} · ${conflictingRes.title})</span>
                </div>`
              : ''
          }

          <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" data-room-schedule="${room.id}" class="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              타임라인 보기
            </button>
            <button type="button" data-book-room="${room.id}" ${!isAvailable ? 'disabled' : ''} class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'
            }">
              ${isMaintenance ? '점검 중' : conflictingRes ? '시간대 변경' : '지금 예약하기'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 타임테이블 매트릭스 뷰
  function renderTimetableMatrix(rooms) {
    const visibleSlots = TIME_SLOTS.slice(0, -1);
    const dayReservations = state.reservations.filter(
      (r) => r.date === state.filter.date && r.status !== 'cancelled'
    );

    return `
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 dark:border-slate-800">
          <div>
            <h2 class="text-sm font-bold text-slate-900 dark:text-white">
              ${formatDateKorean(state.filter.date)} 회의실별 예약 타임라인
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              빈 시간 슬롯을 클릭하면 해당 회의실 및 시간으로 즉시 예약창이 열립니다.
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-50 border border-emerald-300"></span> 예약 가능</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-600"></span> 예약 완료</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-400/30 border border-amber-400"></span> 시설 점검 중</span>
          </div>
        </div>

        <div class="overflow-x-auto scrollbar-thin">
          <div class="min-w-[1000px]">
            <div class="flex border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <div class="w-48 p-2.5 shrink-0 border-r border-slate-200 font-semibold dark:border-slate-800">회의실 목록</div>
              <div class="flex-1 grid grid-cols-23">
                ${visibleSlots
                  .map(
                    (t) => `<div class="p-1 text-center border-r border-slate-200/60 tabular-nums dark:border-slate-800/60 last:border-r-0">${t}</div>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="divide-y divide-slate-100 dark:divide-slate-800">
              ${rooms
                .map((room) => {
                  const isMaintenance = room.status === 'maintenance';
                  const roomRes = dayReservations.filter((r) => r.roomId === room.id);

                  return `
                    <div class="flex hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                      <div class="w-48 p-3 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-center">
                        <span class="text-xs font-bold text-slate-900 truncate dark:text-white">${room.name}</span>
                        <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
                          <span>${room.floor}</span>
                          <span aria-hidden="true">·</span>
                          <span class="tabular-nums">최대 ${room.capacity}인</span>
                        </div>
                      </div>

                      <div class="flex-1 relative min-h-[56px] flex">
                        ${
                          isMaintenance
                            ? `<div class="w-full flex items-center justify-center bg-amber-50/80 text-amber-800 text-xs font-medium dark:bg-amber-950/20 dark:text-amber-300">
                                <i data-lucide="wrench" class="w-3.5 h-3.5 mr-1.5"></i> 시설/장비 점검 진행 중 (예약 불가)
                              </div>`
                            : `<div class="w-full grid grid-cols-23 relative">
                                ${visibleSlots
                                  .map((time) => {
                                    const sMin = parseTimeToMinutes(time);
                                    const eMin = sMin + 30;
                                    const isBooked = roomRes.some((r) => {
                                      const rs = parseTimeToMinutes(r.startTime);
                                      const re = parseTimeToMinutes(r.endTime);
                                      return sMin < re && eMin > rs;
                                    });
                                    return `
                                      <button type="button" data-slot-room="${room.id}" data-slot-time="${time}" ${
                                        isBooked ? 'disabled' : ''
                                      } class="h-full border-r border-slate-100 transition-colors dark:border-slate-800/50 last:border-r-0 ${
                                        isBooked
                                          ? 'cursor-not-allowed bg-slate-50/20'
                                          : 'hover:bg-blue-50/80 cursor-pointer flex items-center justify-center text-transparent hover:text-blue-600 dark:hover:bg-blue-950/30'
                                      }">
                                        <i data-lucide="plus" class="w-3 h-3"></i>
                                      </button>
                                    `;
                                  })
                                  .join('')}

                                ${roomRes
                                  .map((res) => {
                                    const baseStart = parseTimeToMinutes('08:30');
                                    const baseEnd = parseTimeToMinutes('20:00');
                                    const total = baseEnd - baseStart;
                                    const rStart = parseTimeToMinutes(res.startTime);
                                    const rEnd = parseTimeToMinutes(res.endTime);
                                    const leftPct = Math.max(0, ((rStart - baseStart) / total) * 100);
                                    const widthPct = Math.min(100 - leftPct, ((rEnd - rStart) / total) * 100);

                                    return `
                                      <button type="button" data-view-reservation="${res.id}" style="left: ${leftPct}%; width: ${widthPct}%;" class="absolute top-1.5 bottom-1.5 z-10 mx-0.5 rounded-md bg-blue-600 text-white text-[11px] font-medium p-1.5 text-left flex flex-col justify-center overflow-hidden hover:bg-blue-700 transition-colors shadow-xs cursor-pointer">
                                        <span class="font-semibold truncate">${res.title}</span>
                                        <span class="text-[10px] opacity-90 truncate tabular-nums">${res.startTime}~${res.endTime} · ${res.organizerName}</span>
                                      </button>
                                    `;
                                  })
                                  .join('')}
                              </div>`
                        }
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // [TAB 2] 내 예약 현황
  function renderMyBookingsTab() {
    const today = getTodayString();
    const currentUser = getCurrentUser();
    const myBookings = state.reservations.filter(
      (r) => r.organizerId === currentUser.id || r.attendees.some((a) => a.id === currentUser.id)
    );

    const filtered = myBookings.filter((r) => {
      if (state.myBookingsFilter === 'all') return true;
      if (state.myBookingsFilter === 'cancelled') return r.status === 'cancelled';
      if (state.myBookingsFilter === 'upcoming') return r.status !== 'cancelled' && r.date >= today;
      if (state.myBookingsFilter === 'past') return r.status !== 'cancelled' && r.date < today;
      return true;
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">내 예약 및 참여 일정 관리</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              ${currentUser.name} ${currentUser.position} (${currentUser.department}) 님의 회의 예약 현황입니다.
            </p>
          </div>

          <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
            <button type="button" data-myfilter="upcoming" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              state.myBookingsFilter === 'upcoming'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }">예정된 회의</button>
            <button type="button" data-myfilter="past" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              state.myBookingsFilter === 'past'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }">지난 회의</button>
            <button type="button" data-myfilter="cancelled" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              state.myBookingsFilter === 'cancelled'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }">취소 내역</button>
            <button type="button" data-myfilter="all" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              state.myBookingsFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }">전체 (${myBookings.length})</button>
          </div>
        </div>

        ${
          filtered.length === 0
            ? `<div class="p-12 text-center bg-white border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
                <i data-lucide="calendar" class="w-10 h-10 text-slate-300 mx-auto mb-3 dark:text-slate-600"></i>
                <h3 class="text-sm font-semibold text-slate-800 mb-1 dark:text-slate-200">조회된 예약 내역이 없습니다</h3>
                <p class="text-xs text-slate-500 mb-4 dark:text-slate-400">새로운 회의 일정을 등록하고 회의실을 예약해 보세요.</p>
                <button type="button" data-nav="search" class="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">새 회의실 예약하기</button>
              </div>`
            : `<div class="space-y-3">
                ${filtered
                  .map((res) => {
                    const room = state.rooms.find((r) => r.id === res.roomId);
                    const isCancelled = res.status === 'cancelled';
                    const isPast = res.date < today;
                    const isOrganizer = res.organizerId === currentUser.id;

                    return `
                      <div class="p-5 bg-white border rounded-xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-900 ${
                        isCancelled
                          ? 'border-slate-200 opacity-60 dark:border-slate-800'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                      }">
                        <div class="space-y-1.5 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white ${isCancelled ? 'line-through text-slate-500' : ''}">
                              ${res.title}
                            </h3>
                            ${
                              isCancelled
                                ? '<span class="text-xs text-red-600 font-semibold">[예약 취소됨]</span>'
                                : isPast
                                ? '<span class="text-xs text-slate-400 font-medium">[종료됨]</span>'
                                : '<span class="text-xs text-emerald-600 font-semibold">[예약 확정]</span>'
                            }
                            ${res.isRecurring ? '<span class="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium"><i data-lucide="repeat" class="w-3 h-3"></i> 매주 반복</span>' : ''}
                          </div>

                          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span class="font-semibold text-slate-800 dark:text-slate-200">${formatDateKorean(res.date)}</span>
                            <span aria-hidden="true">·</span>
                            <span class="tabular-nums font-medium text-slate-800 dark:text-slate-200">${res.startTime} ~ ${res.endTime} (${res.durationMinutes}분)</span>
                            <span aria-hidden="true">·</span>
                            <span>${room ? `${room.name} (${room.floor})` : '회의실'}</span>
                          </div>

                          <div class="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 dark:text-slate-400">
                            <span>주최: <strong>${res.organizerName}</strong> (${res.organizerDept})</span>
                            <span aria-hidden="true">·</span>
                            <span>참석자 (${res.attendees.length}명): ${res.attendees.map((a) => a.name).join(', ')}</span>
                          </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                          <button type="button" data-check-email="${res.id}" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                            <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                            <span>발송 메일 확인</span>
                          </button>
                          ${
                            !isCancelled && !isPast && isOrganizer
                              ? `<button type="button" data-edit-reservation="${res.id}" class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> <span>수정</span>
                                </button>
                                <button type="button" data-cancel-reservation="${res.id}" class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
                                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> <span>예약 취소</span>
                                </button>`
                              : ''
                          }
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>`
        }
      </div>
    `;
  }

  // [TAB 3] 통계 대시보드
  function renderAnalyticsTab() {
    const totalBookings = state.reservations.length;
    const activeBookings = state.reservations.filter((r) => r.status !== 'cancelled').length;
    const cancelledBookings = state.reservations.filter((r) => r.status === 'cancelled').length;
    const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0';
    const totalMinutes = state.reservations
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // 회의실별 가동률 계산
    const roomStats = state.rooms
      .map((room) => {
        const roomRes = state.reservations.filter((r) => r.roomId === room.id && r.status !== 'cancelled');
        const mins = roomRes.reduce((sum, r) => sum + r.durationMinutes, 0);
        const capacityScore = Math.min(100, Math.round((mins / (600 * 8)) * 100));
        return {
          id: room.id,
          name: room.name,
          floor: room.floor,
          count: roomRes.length,
          hours: (mins / 60).toFixed(1),
          utilizationRate: capacityScore,
        };
      })
      .sort((a, b) => b.utilizationRate - a.utilizationRate);

    // 시간대별 분포 (09:00 ~ 18:00)
    const hourlySlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const hourlyCounts = hourlySlots.map((h) => {
      const min = parseTimeToMinutes(h);
      const count = state.reservations.filter((r) => {
        if (r.status === 'cancelled') return false;
        const rs = parseTimeToMinutes(r.startTime);
        const re = parseTimeToMinutes(r.endTime);
        return min >= rs && min < re;
      }).length;
      return { hour: h, count };
    });
    const maxHour = Math.max(1, ...hourlyCounts.map((x) => x.count));

    // 부서별 분포
    const deptMap = {};
    state.reservations.forEach((r) => {
      if (r.status === 'cancelled') return;
      const d = r.organizerDept || '미지정 부서';
      if (!deptMap[d]) deptMap[d] = { count: 0, hours: 0, dept: d };
      deptMap[d].count += 1;
      deptMap[d].hours += r.durationMinutes / 60;
    });
    const deptStats = Object.values(deptMap).sort((a, b) => b.hours - a.hours);
    const totalDeptHours = deptStats.reduce((s, d) => s + d.hours, 0) || 1;

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-blue-600"></i>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">사내 회의실 자원 가동률 및 이용 통계 리포트</h2>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">회의실별 가동률, 시간대별 집중도, 부서별 점유 현황을 분석합니다.</p>
          </div>
          <button type="button" id="btn-export-csv" class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <i data-lucide="download" class="w-4 h-4 text-slate-500"></i>
            <span>통계 데이터 CSV 내보내기</span>
          </button>
        </div>

        <!-- KPI Strip -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <span class="text-xs text-slate-500 block mb-1">전체 누적 예약 건수</span>
            <div class="flex items-baseline gap-2">
              <strong class="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">${totalBookings}</strong>
              <span class="text-xs text-emerald-600 font-medium">유효: ${activeBookings}건</span>
            </div>
          </div>
          <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <span class="text-xs text-slate-500 block mb-1">총 가동 시간</span>
            <div class="flex items-baseline gap-2">
              <strong class="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">${totalHours}</strong>
              <span class="text-xs text-slate-500">시간</span>
            </div>
          </div>
          <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <span class="text-xs text-slate-500 block mb-1">예약 취소율</span>
            <div class="flex items-baseline gap-2">
              <strong class="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">${cancellationRate}%</strong>
              <span class="text-xs text-slate-500">(${cancelledBookings}건)</span>
            </div>
          </div>
          <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <span class="text-xs text-slate-500 block mb-1">피크 타임 (최다 예약)</span>
            <div class="flex items-baseline gap-2">
              <strong class="text-2xl font-bold text-blue-600 tabular-nums">14:00 ~ 16:00</strong>
            </div>
          </div>
        </div>

        <!-- 2 Column Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-900 mb-4 dark:text-white">회의실별 이용 가동률 현황</h3>
            <div class="space-y-3">
              ${roomStats
                .map(
                  (item) => `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold text-slate-800 dark:text-slate-200">${item.name} (${item.floor})</span>
                    <span class="text-slate-500 tabular-nums">${item.count}건 · ${item.hours}h · <strong class="text-blue-600 font-bold">${item.utilizationRate}%</strong></span>
                  </div>
                  <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                    <div class="h-full bg-blue-600 rounded-full" style="width: ${Math.max(5, item.utilizationRate)}%;"></div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-900 mb-4 dark:text-white">시간대별 예약 밀집도 현황 (09:00 ~ 18:00)</h3>
            <div class="flex items-end justify-between gap-2 h-44 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              ${hourlyCounts
                .map((slot) => {
                  const pct = Math.max(12, (slot.count / maxHour) * 100);
                  const isPeak = slot.count === maxHour && slot.count > 0;
                  return `
                    <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span class="text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">${slot.count > 0 ? slot.count : ''}</span>
                      <div class="w-full max-w-[28px] bg-slate-100 rounded-t-md overflow-hidden flex items-end h-32 dark:bg-slate-800">
                        <div class="w-full rounded-t-md ${isPeak ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}" style="height: ${pct}%;"></div>
                      </div>
                      <span class="text-[10px] text-slate-500 tabular-nums">${slot.hour.slice(0, 2)}시</span>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <p class="text-[11px] text-slate-500 mt-2 text-center">오후 14시~16시 시간대에 전사 회의 예약이 집중되는 경향을 보입니다.</p>
          </div>
        </div>

        <!-- Department Usage -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 mb-4 dark:text-white">부서별 회의실 이용 시간 및 비중 현황</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              ${deptStats
                .map((d) => {
                  const pct = Math.round((d.hours / totalDeptHours) * 100);
                  return `
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-slate-800 dark:text-slate-200">${d.dept}</span>
                        <span class="text-slate-500 tabular-nums">${d.count}건 (${d.hours.toFixed(1)}시간 · ${pct}%)</span>
                      </div>
                      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                        <div class="h-full bg-blue-500 rounded-full" style="width: ${Math.max(4, pct)}%;"></div>
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-200 text-slate-500 pb-2 dark:border-slate-800">
                    <th class="py-2">부서명</th>
                    <th class="py-2 text-right">예약 건수</th>
                    <th class="py-2 text-right">누적 회의 시간</th>
                    <th class="py-2 text-right">점유 비중</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  ${deptStats
                    .map(
                      (d) => `
                    <tr class="text-slate-700 dark:text-slate-300">
                      <td class="py-2 font-medium">${d.dept}</td>
                      <td class="py-2 text-right tabular-nums">${d.count}건</td>
                      <td class="py-2 text-right tabular-nums">${d.hours.toFixed(1)}h</td>
                      <td class="py-2 text-right tabular-nums font-semibold text-blue-600">${Math.round(
                        (d.hours / totalDeptHours) * 100
                      )}%</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // [TAB 4] 관리자 회의실 자원 관리 (CRUD)
  function renderAdminRoomsTab() {
    const availableCount = state.rooms.filter((r) => r.status === 'available').length;
    const maintenanceCount = state.rooms.filter((r) => r.status === 'maintenance').length;

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <i data-lucide="building" class="w-5 h-5 text-blue-600"></i>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">사내 회의실 자원 관리 (총무 / 시설운영팀)</h2>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>총 등록 회의실 <strong class="font-semibold text-slate-900 dark:text-white tabular-nums">${state.rooms.length}개소</strong></span>
              <span aria-hidden="true">·</span>
              <span>사용 가능 <strong class="font-semibold text-emerald-600 tabular-nums">${availableCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>점검 중 <strong class="font-semibold text-amber-600 tabular-nums">${maintenanceCount}</strong></span>
            </div>
          </div>
          <button type="button" id="btn-create-room" class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>신규 회의실 등록</span>
          </button>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th class="p-3.5 font-semibold">회의실명</th>
                  <th class="p-3.5 font-semibold">위치 / 층</th>
                  <th class="p-3.5 font-semibold text-center">수용 인원</th>
                  <th class="p-3.5 font-semibold">보유 장비</th>
                  <th class="p-3.5 font-semibold text-center">운영 상태</th>
                  <th class="p-3.5 font-semibold text-right">관리 작업</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${state.rooms
                  .map((room) => {
                    const isMaint = room.status === 'maintenance';
                    return `
                      <tr class="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                        <td class="p-3.5">
                          <div class="flex items-center gap-3">
                            <img src="${room.imageUrl}" alt="${room.name}" class="w-12 h-8 rounded-md object-cover bg-slate-100 shrink-0" onerror="this.src='./src/assets/images/room_creative_projector_1793771834226.jpg'">
                            <div>
                              <strong class="text-sm font-bold text-slate-900 block dark:text-white">${room.name}</strong>
                              <span class="text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">${room.description}</span>
                            </div>
                          </div>
                        </td>
                        <td class="p-3.5 text-slate-700 dark:text-slate-300">
                          <div class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i><span>${room.floor}</span></div>
                        </td>
                        <td class="p-3.5 text-center whitespace-nowrap"><span class="font-semibold text-slate-800 tabular-nums dark:text-slate-200">${room.capacity}인</span></td>
                        <td class="p-3.5">
                          <div class="flex flex-wrap items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                            ${room.hasMonitor ? '<span class="bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800">모니터</span>' : ''}
                            ${room.hasProjector ? '<span class="bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800">빔프로젝터</span>' : ''}
                            ${room.hasVideoConference ? '<span class="bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800">화상회의</span>' : ''}
                            ${room.hasWhiteboard ? '<span class="bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800">화이트보드</span>' : ''}
                          </div>
                        </td>
                        <td class="p-3.5 text-center whitespace-nowrap">
                          <button type="button" data-toggle-maint="${room.id}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                            isMaint
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }">
                            <i data-lucide="${isMaint ? 'wrench' : 'check-circle-2'}" class="w-3 h-3"></i>
                            <span>${isMaint ? '점검 중' : '정상 운영'}</span>
                          </button>
                        </td>
                        <td class="p-3.5 text-right whitespace-nowrap">
                          <div class="flex items-center justify-end gap-1.5">
                            <button type="button" data-edit-room="${room.id}" class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                            <button type="button" data-delete-room="${room.id}" class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                          </div>
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- 9. 모달 관리 및 렌더링 ---
  function renderModals() {
    const container = document.getElementById('modal-container');
    if (!container) return;
    container.innerHTML = `
      ${renderReservationModalHtml()}
      ${renderEmailInboxModalHtml()}
      ${renderCancelConfirmModalHtml()}
      ${renderRoomEditModalHtml()}
      ${renderMaintenanceReasonModalHtml()}
      ${renderDeleteConfirmModalHtml()}
    `;
  }

  // 회의실 예약 신청/수정 모달
  function renderReservationModalHtml() {
    if (!state.modal.reservationOpen) return '';

    const editing = state.modal.editingReservation;
    const initialRoomId = editing ? editing.roomId : state.modal.selectedRoomId || state.rooms[0]?.id;
    const initialDate = editing ? editing.date : state.filter.date;
    const initialStart = editing ? editing.startTime : state.modal.initialTime || state.filter.startTime;
    const initialEnd = editing ? editing.endTime : state.filter.endTime;

    const currentRoom = state.rooms.find((r) => r.id === initialRoomId);
    const currentUser = getCurrentUser();

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 dark:bg-slate-900 dark:border-slate-800">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">
                ${editing ? '회의실 예약 정보 수정' : '신규 회의실 예약 신청'}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                1회 최대 3시간 · 14일 사전 예약 준수 · 참석자 알림 메일 자동 발송
              </p>
            </div>
            <button type="button" id="close-reservation-modal" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form id="reservation-form" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div id="reservation-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"></div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">회의실 선택</label>
              <select id="modal-room-id" class="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                ${state.rooms
                  .map(
                    (r) =>
                      `<option value="${r.id}" ${r.id === initialRoomId ? 'selected' : ''} ${
                        r.status === 'maintenance' ? 'disabled' : ''
                      }>${r.name} · ${r.floor} · 수용 ${r.capacity}인 ${r.status === 'maintenance' ? '(점검 중)' : ''}</option>`
                  )
                  .join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">회의 제목 <span class="text-red-500">*</span></label>
              <input type="text" id="modal-title" required value="${editing ? editing.title : ''}" placeholder="예: 2026 하반기 신규 프로덕트 스프린트 킥오프" class="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">예약 일자 (최대 14일 이내)</label>
                <input type="date" id="modal-date" required min="${getTodayString()}" max="${getMaxAdvanceDateString()}" value="${initialDate}" class="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">시작 시간</label>
                <select id="modal-start-time" class="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                  ${TIME_SLOTS.slice(0, -1)
                    .map((t) => `<option value="${t}" ${t === initialStart ? 'selected' : ''}>${t}</option>`)
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">종료 시간 (최대 3시간)</label>
                <select id="modal-end-time" class="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                  ${TIME_SLOTS.filter((t) => t > initialStart)
                    .map((t) => `<option value="${t}" ${t === initialEnd ? 'selected' : ''}>${t}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/60 dark:border-slate-700">
              <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input type="checkbox" id="modal-recurring" class="rounded text-blue-600" ${editing?.isRecurring ? 'checked' : ''}>
                <i data-lucide="repeat" class="w-4 h-4 text-slate-500"></i>
                <span>매주 반복 예약 (사전 예약 14일 한도 내 2주간 자동 등록)</span>
              </label>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">참석자 초대 (사내 임직원 검색 추가)</label>
              <div id="modal-attendees-list" class="flex flex-wrap gap-2 mb-2">
                <!-- Attendees will be rendered dynamically -->
              </div>
              <div class="relative">
                <input type="text" id="modal-employee-search" placeholder="임직원 이름 또는 부서 검색 (예: 김민준, 디자인팀)..." class="w-full h-8 px-3 text-xs border border-slate-200 rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                <div id="modal-employee-dropdown" class="hidden absolute left-0 right-0 top-9 z-20 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto dark:bg-slate-800 dark:border-slate-700"></div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">회의 안건 / 비고 (선택 사항)</label>
              <textarea id="modal-desc" rows="2" placeholder="회의 안건, 준비물 등 메모" class="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">${editing?.description || ''}</textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">취소</button>
              <button type="submit" class="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer">
                <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                <span>${editing ? '예약 수정 및 변경 메일 발송' : '예약 확정 및 이메일 발송'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 발송된 사내 이메일 알림 보관함 모달
  function renderEmailInboxModalHtml() {
    if (!state.modal.emailInboxOpen) return '';

    const activeMail =
      state.emailLogs.find((e) => e.id === state.modal.selectedEmailId) || state.emailLogs[0];

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[85vh] max-h-[750px] flex flex-col overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div class="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-950 dark:text-blue-400">
                <i data-lucide="mail" class="w-4 h-4"></i>
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">사내 자동 발송 이메일 알림 보관함</h2>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">예약 확정/변경/취소 시 참석자에게 발송된 실제 메일 내역입니다.</p>
              </div>
            </div>
            <button type="button" id="close-email-modal" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="flex-1 flex overflow-hidden">
            <div class="w-1/3 min-w-[260px] border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 dark:border-slate-800">
              ${
                state.emailLogs.length === 0
                  ? '<div class="p-8 text-center text-xs text-slate-400">발송된 이메일 알림이 없습니다.</div>'
                  : state.emailLogs
                      .map((log) => {
                        const isSelected = log.id === activeMail?.id;
                        return `
                          <button type="button" data-select-mail="${log.id}" class="w-full text-left p-3.5 transition-colors cursor-pointer block ${
                            isSelected ? 'bg-blue-50/70 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }">
                            <div class="flex items-center justify-between text-[11px] mb-1">
                              <span class="font-semibold ${
                                log.type === 'confirmed'
                                  ? 'text-emerald-600'
                                  : log.type === 'updated'
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                              }">
                                ${log.type === 'confirmed' ? '예약 확정' : log.type === 'updated' ? '일정 변경' : '예약 취소'}
                              </span>
                              <span class="text-slate-400 tabular-nums">${log.sentAt.slice(5, 16)}</span>
                            </div>
                            <div class="text-xs font-bold text-slate-900 truncate mb-1 dark:text-white">${log.subject}</div>
                            <div class="text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">수신: ${log.recipientNames.join(', ')}</div>
                          </button>
                        `;
                      })
                      .join('')
              }
            </div>

            <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              ${
                activeMail
                  ? `<div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 dark:bg-slate-900 dark:border-slate-800">
                      <div class="border-b border-slate-200 pb-4 mb-5 dark:border-slate-800">
                        <div class="flex items-start justify-between gap-4 mb-3">
                          <h1 class="text-base font-bold text-slate-900 dark:text-white">${activeMail.subject}</h1>
                          <button type="button" id="btn-download-ics" data-mail-id="${activeMail.id}" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i>
                            <span>.ics 캘린더 등록</span>
                          </button>
                        </div>
                        <div class="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <div><strong>발신:</strong> 사내 회의실 예약 시스템 &lt;noreply-meeting@company.internal&gt;</div>
                          <div><strong>수신:</strong> ${activeMail.recipientEmails.join(', ')}</div>
                          <div class="text-[11px] text-slate-400 tabular-nums">발송 일시: ${activeMail.sentAt}</div>
                        </div>
                      </div>
                      <div class="email-body text-xs text-slate-800 dark:text-slate-200">${activeMail.bodyHtml}</div>
                    </div>`
                  : '<div class="h-full flex items-center justify-center text-xs text-slate-400">선택된 메일이 없습니다.</div>'
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 예약 취소 확인 모달
  function renderCancelConfirmModalHtml() {
    const res = state.modal.cancelTargetReservation;
    if (!res) return '';

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
          <div class="flex items-center gap-3 text-red-600 mb-3">
            <i data-lucide="alert-triangle" class="w-6 h-6 shrink-0"></i>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">회의실 예약을 취소하시겠습니까?</h3>
          </div>
          <p class="text-xs text-slate-600 mb-4 dark:text-slate-400 leading-relaxed">
            취소 즉시 참석자 전원에게 <strong>예약 취소 안내 이메일</strong>이 자동 발송되며, 해당 회의실 시간대는 다른 임직원이 즉시 예약할 수 있도록 개방됩니다.
          </p>
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-4 dark:bg-slate-800 dark:border-slate-700">
            <div class="font-semibold text-slate-800 dark:text-slate-200">${res.title}</div>
            <div class="text-slate-500 mt-1 tabular-nums">${formatDateKorean(res.date)} ${res.startTime} ~ ${res.endTime}</div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button type="button" id="close-cancel-confirm" class="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">닫기</button>
            <button type="button" id="confirm-cancel-btn" class="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
              취소 확정 및 취소 메일 발송
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 회의실 신규 등록 / 수정 모달
  function renderRoomEditModalHtml() {
    if (!state.modal.roomEditModalOpen) return '';
    const room = state.modal.editingRoom;

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              ${room ? '회의실 자원 정보 수정' : '신규 회의실 자원 등록'}
            </h3>
            <button type="button" id="close-room-edit-modal" class="p-1 text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="room-edit-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">회의실명 <span class="text-red-500">*</span></label>
              <input type="text" id="edit-room-name" required value="${room ? room.name : ''}" placeholder="예: 전략기획 회의실 (Zeta)" class="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">위치 / 층수</label>
                <input type="text" id="edit-room-floor" required value="${room ? room.floor : '3층'}" class="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">최대 수용 인원 (명)</label>
                <input type="number" id="edit-room-capacity" min="2" max="100" required value="${room ? room.capacity : 8}" class="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">보유 기기 및 시설 설정</label>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <label class="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="checkbox" id="edit-room-monitor" class="rounded text-blue-600" ${room?.hasMonitor !== false ? 'checked' : ''}>
                  <span>대형 모니터 (TV)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="checkbox" id="edit-room-projector" class="rounded text-blue-600" ${room?.hasProjector ? 'checked' : ''}>
                  <span>빔프로젝터</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="checkbox" id="edit-room-video" class="rounded text-blue-600" ${room?.hasVideoConference !== false ? 'checked' : ''}>
                  <span>화상회의 시스템</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="checkbox" id="edit-room-whiteboard" class="rounded text-blue-600" ${room?.hasWhiteboard !== false ? 'checked' : ''}>
                  <span>화이트보드</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">회의실 설명</label>
              <textarea id="edit-room-desc" rows="2" placeholder="회의실 용도, 비치 품목 등 안내 설명" class="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white">${room?.description || ''}</textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" id="btn-close-room-edit" class="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg">취소</button>
              <button type="submit" class="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer">
                ${room ? '수정 완료' : '등록 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 시설 점검 사유 입력 모달
  function renderMaintenanceReasonModalHtml() {
    const target = state.modal.maintenanceTargetRoom;
    if (!target) return '';

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
          <div class="flex items-center gap-2 text-amber-600 mb-2">
            <i data-lucide="wrench" class="w-5 h-5"></i>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">회의실 점검 모드 전환</h3>
          </div>
          <p class="text-xs text-slate-600 mb-4 dark:text-slate-400">
            <strong>${target.name}</strong>을(를) [시설 점검 중] 상태로 변경합니다. 점검 중에는 신규 예약이 차단됩니다.
          </p>
          <div class="mb-4">
            <label class="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">점검 사유 및 완료 예정 안내</label>
            <input type="text" id="maint-reason-input" value="시설/장비 정기 점검 및 청소 진행 중" class="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          </div>
          <div class="flex items-center justify-end gap-2">
            <button type="button" id="close-maint-reason" class="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg">취소</button>
            <button type="button" id="confirm-maint-reason-btn" class="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer">
              점검 모드로 전환
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 회의실 삭제 확인 모달
  function renderDeleteConfirmModalHtml() {
    if (!state.modal.deleteTargetRoomId) return '';
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
          <div class="flex items-center gap-2 text-red-600 mb-2">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">회의실 자원을 영구 삭제하시겠습니까?</h3>
          </div>
          <p class="text-xs text-slate-600 mb-4 dark:text-slate-400">해당 회의실의 모든 정보가 시스템에서 삭제됩니다.</p>
          <div class="flex items-center justify-end gap-2">
            <button type="button" id="close-delete-confirm" class="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg">취소</button>
            <button type="button" id="confirm-delete-room-btn" class="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">삭제 확정</button>
          </div>
        </div>
      </div>
    `;
  }

  // 알림 토스트 렌더링
  function renderToast() {
    const container = document.getElementById('toast-container');
    if (!container) return;
    if (!state.toast) {
      container.innerHTML = '';
      return;
    }
    const t = state.toast;
    container.innerHTML = `
      <div class="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-xl border border-slate-200 shadow-xl p-4 flex items-start gap-3 dark:bg-slate-900 dark:border-slate-800">
        <div class="shrink-0 mt-0.5">
          ${
            t.type === 'success'
              ? '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600"></i>'
              : t.type === 'error'
              ? '<i data-lucide="alert-circle" class="w-5 h-5 text-red-600"></i>'
              : '<i data-lucide="info" class="w-5 h-5 text-blue-600"></i>'
          }
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-slate-900 dark:text-white">${t.title}</h4>
          <p class="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">${t.message}</p>
        </div>
        <button type="button" id="close-toast-btn" class="p-1 text-slate-400 hover:text-slate-600">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('close-toast-btn')?.addEventListener('click', () => {
      state.toast = null;
      renderToast();
    });
  }

  // --- 10. 글로벌 이벤트 리스너 바인딩 ---
  let tempModalAttendees = [];

  function attachGlobalEvents() {
    // 탭 이동
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const nav = e.currentTarget.getAttribute('data-nav');
        state.activeTab = nav;
        renderApp();
      });
    });

    // 로고 클릭 -> 홈으로
    document.getElementById('brand-logo')?.addEventListener('click', (e) => {
      e.preventDefault();
      state.activeTab = 'search';
      renderApp();
    });

    // 롤 전환 (일반 임직원 <-> 관리자)
    document.getElementById('role-user-btn')?.addEventListener('click', () => {
      state.userRole = 'user';
      renderApp();
    });
    document.getElementById('role-admin-btn')?.addEventListener('click', () => {
      state.userRole = 'admin';
      renderApp();
    });

    // 다크 모드 토글
    document.getElementById('toggle-dark-mode')?.addEventListener('click', toggleDarkMode);

    // 모바일 뷰 토글
    document.getElementById('toggle-mobile-preview')?.addEventListener('click', () => {
      state.isMobilePreview = !state.isMobilePreview;
      renderApp();
    });

    // 메일함 열기
    document.getElementById('open-email-inbox')?.addEventListener('click', () => {
      state.modal.emailInboxOpen = true;
      state.modal.selectedEmailId = state.emailLogs[0]?.id || null;
      renderModals();
      if (window.lucide) window.lucide.createIcons();
    });

    // 데이터 초기화
    document.getElementById('reset-data-btn')?.addEventListener('click', resetToDefault);

    // Hero 빠른 예약 버튼
    document.getElementById('hero-quick-book-btn')?.addEventListener('click', () => {
      openReservationModal(state.rooms[0]?.id, state.filter.startTime);
    });

    // 카드 / 타임라인 뷰 전환
    document.getElementById('btn-view-cards')?.addEventListener('click', () => {
      state.filter.viewMode = 'cards';
      renderApp();
    });
    document.getElementById('btn-view-timeline')?.addEventListener('click', () => {
      state.filter.viewMode = 'timeline';
      renderApp();
    });

    // 14일 날짜 칩 클릭
    document.querySelectorAll('.date-chip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.filter.date = e.currentTarget.getAttribute('data-date');
        renderApp();
      });
    });

    // 필터 체인지
    document.getElementById('filter-start-time')?.addEventListener('change', (e) => {
      state.filter.startTime = e.target.value;
      const [h, m] = e.target.value.split(':').map(Number);
      const nextH = Math.min(20, h + 1);
      state.filter.endTime = `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      renderApp();
    });
    document.getElementById('filter-end-time')?.addEventListener('change', (e) => {
      state.filter.endTime = e.target.value;
      renderApp();
    });
    document.getElementById('filter-capacity')?.addEventListener('change', (e) => {
      state.filter.minCapacity = Number(e.target.value);
      renderApp();
    });
    document.getElementById('filter-floor')?.addEventListener('change', (e) => {
      state.filter.floor = e.target.value;
      renderApp();
    });
    document.getElementById('chk-monitor')?.addEventListener('change', (e) => {
      state.filter.hasMonitor = e.target.checked;
      renderApp();
    });
    document.getElementById('chk-projector')?.addEventListener('change', (e) => {
      state.filter.hasProjector = e.target.checked;
      renderApp();
    });
    document.getElementById('chk-video')?.addEventListener('change', (e) => {
      state.filter.hasVideoConference = e.target.checked;
      renderApp();
    });
    document.getElementById('chk-whiteboard')?.addEventListener('change', (e) => {
      state.filter.hasWhiteboard = e.target.checked;
      renderApp();
    });
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      state.filter.minCapacity = 0;
      state.filter.floor = 'all';
      state.filter.hasMonitor = false;
      state.filter.hasProjector = false;
      state.filter.hasVideoConference = false;
      state.filter.hasWhiteboard = false;
      renderApp();
    });

    // 방 카드에서 예약 / 타임라인 보기
    document.querySelectorAll('[data-book-room]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const roomId = e.currentTarget.getAttribute('data-book-room');
        openReservationModal(roomId, state.filter.startTime);
      });
    });
    document.querySelectorAll('[data-room-schedule]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.filter.viewMode = 'timeline';
        renderApp();
      });
    });

    // 타임라인 슬롯 클릭 -> 해당 방 및 시간으로 예약
    document.querySelectorAll('[data-slot-room]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const roomId = e.currentTarget.getAttribute('data-slot-room');
        const time = e.currentTarget.getAttribute('data-slot-time');
        openReservationModal(roomId, time);
      });
    });

    // 타임라인 예약 블록 클릭 -> 상세/수정
    document.querySelectorAll('[data-view-reservation]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const resId = e.currentTarget.getAttribute('data-view-reservation');
        const res = state.reservations.find((r) => r.id === resId);
        if (res) openReservationModal(res.roomId, res.startTime, res);
      });
    });

    // 내 예약 탭 필터
    document.querySelectorAll('[data-myfilter]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.myBookingsFilter = e.currentTarget.getAttribute('data-myfilter');
        renderApp();
      });
    });

    // 내 예약: 발송 메일 확인, 수정, 취소
    document.querySelectorAll('[data-check-email]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const resId = e.currentTarget.getAttribute('data-check-email');
        const log = state.emailLogs.find((m) => m.reservationId === resId);
        state.modal.selectedEmailId = log ? log.id : state.emailLogs[0]?.id || null;
        state.modal.emailInboxOpen = true;
        renderModals();
        if (window.lucide) window.lucide.createIcons();
      });
    });

    document.querySelectorAll('[data-edit-reservation]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const resId = e.currentTarget.getAttribute('data-edit-reservation');
        const res = state.reservations.find((r) => r.id === resId);
        if (res) openReservationModal(res.roomId, res.startTime, res);
      });
    });

    document.querySelectorAll('[data-cancel-reservation]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const resId = e.currentTarget.getAttribute('data-cancel-reservation');
        const res = state.reservations.find((r) => r.id === resId);
        if (res) {
          state.modal.cancelTargetReservation = res;
          renderModals();
          if (window.lucide) window.lucide.createIcons();
          attachModalEvents();
        }
      });
    });

    // CSV 내보내기 버튼
    document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);

    // 관리자: 신규 회의실 등록
    document.getElementById('btn-create-room')?.addEventListener('click', () => {
      state.modal.editingRoom = null;
      state.modal.roomEditModalOpen = true;
      renderModals();
      if (window.lucide) window.lucide.createIcons();
      attachModalEvents();
    });

    // 관리자: 회의실 수정
    document.querySelectorAll('[data-edit-room]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const roomId = e.currentTarget.getAttribute('data-edit-room');
        const room = state.rooms.find((r) => r.id === roomId);
        if (room) {
          state.modal.editingRoom = room;
          state.modal.roomEditModalOpen = true;
          renderModals();
          if (window.lucide) window.lucide.createIcons();
          attachModalEvents();
        }
      });
    });

    // 관리자: 회의실 삭제
    document.querySelectorAll('[data-delete-room]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.modal.deleteTargetRoomId = e.currentTarget.getAttribute('data-delete-room');
        renderModals();
        if (window.lucide) window.lucide.createIcons();
        attachModalEvents();
      });
    });

    // 관리자: 점검 모드 토글
    document.querySelectorAll('[data-toggle-maint]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const roomId = e.currentTarget.getAttribute('data-toggle-maint');
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) return;
        if (room.status === 'available') {
          state.modal.maintenanceTargetRoom = room;
          renderModals();
          if (window.lucide) window.lucide.createIcons();
          attachModalEvents();
        } else {
          room.status = 'available';
          room.maintenanceReason = undefined;
          saveStorage(STORAGE_KEYS.ROOMS, state.rooms);
          showToast('success', '정상 운영 복구', `${room.name} 회의실이 정상 운영 상태로 전환되었습니다.`);
          renderApp();
        }
      });
    });

    attachModalEvents();
  }

  // --- 11. 모달별 세부 이벤트 바인딩 ---
  function openReservationModal(roomId, startTime, editingRes = null) {
    state.modal.reservationOpen = true;
    state.modal.selectedRoomId = roomId;
    state.modal.initialTime = startTime;
    state.modal.editingReservation = editingRes;
    tempModalAttendees = editingRes ? [...editingRes.attendees] : [getCurrentUser()];
    renderModals();
    if (window.lucide) window.lucide.createIcons();
    attachModalEvents();
    renderModalAttendees();
  }

  function renderModalAttendees() {
    const box = document.getElementById('modal-attendees-list');
    if (!box) return;
    const currentUser = getCurrentUser();

    box.innerHTML = tempModalAttendees
      .map((a) => {
        const isOrganizer = a.id === currentUser.id;
        return `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
            <span>${a.name}</span>
            <span class="text-[11px] opacity-75">${a.position}</span>
            ${
              isOrganizer
                ? '<span class="text-[10px] text-blue-600 font-semibold dark:text-blue-400">(주최자)</span>'
                : `<button type="button" data-remove-attendee="${a.id}" class="text-slate-400 hover:text-red-500 p-0.5 ml-0.5">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>`
            }
          </div>
        `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();

    box.querySelectorAll('[data-remove-attendee]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-remove-attendee');
        tempModalAttendees = tempModalAttendees.filter((x) => x.id !== id);
        renderModalAttendees();
      });
    });
  }

  function attachModalEvents() {
    // 예약 모달 닫기
    document.getElementById('close-reservation-modal')?.addEventListener('click', () => {
      state.modal.reservationOpen = false;
      renderModals();
    });
    document.getElementById('btn-cancel-modal')?.addEventListener('click', () => {
      state.modal.reservationOpen = false;
      renderModals();
    });

    // 메일 보관함 닫기
    document.getElementById('close-email-modal')?.addEventListener('click', () => {
      state.modal.emailInboxOpen = false;
      renderModals();
    });

    // 메일 선택
    document.querySelectorAll('[data-select-mail]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.modal.selectedEmailId = e.currentTarget.getAttribute('data-select-mail');
        renderModals();
        if (window.lucide) window.lucide.createIcons();
        attachModalEvents();
      });
    });

    // .ics 캘린더 다운로드
    document.getElementById('btn-download-ics')?.addEventListener('click', (e) => {
      const mailId = e.currentTarget.getAttribute('data-mail-id');
      const mail = state.emailLogs.find((m) => m.id === mailId);
      if (mail) downloadIcs(mail);
    });

    // 예약 취소 확인 모달 닫기 & 확정
    document.getElementById('close-cancel-confirm')?.addEventListener('click', () => {
      state.modal.cancelTargetReservation = null;
      renderModals();
    });
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', () => {
      const target = state.modal.cancelTargetReservation;
      if (!target) return;
      target.status = 'cancelled';
      saveStorage(STORAGE_KEYS.RESERVATIONS, state.reservations);

      // 취소 메일 생성
      const room = state.rooms.find((r) => r.id === target.roomId);
      const cancelEmail = {
        id: `mail-${Date.now()}`,
        reservationId: target.id,
        type: 'cancelled',
        recipientEmails: Array.from(new Set([target.organizerEmail, ...target.attendees.map((a) => a.email)])),
        recipientNames: Array.from(new Set([target.organizerName, ...target.attendees.map((a) => a.name)])),
        subject: `[회의실 예약 취소] ${formatDateKorean(target.date)} ${target.startTime} ${room?.name} - ${target.title}`,
        roomName: room?.name || '회의실',
        meetingDate: target.date,
        meetingTime: `${target.startTime} ~ ${target.endTime}`,
        bodyPreview: '해당 회의실 예약이 정상적으로 취소 처리되었습니다.',
        bodyHtml: `
          <div style="font-family: Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">[회의실 예약 취소 안내]</h2>
            <p style="color: #475569; font-size: 14px;">신청하신 아래 회의실 일정이 취소되었습니다.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155; margin-top: 12px;">
              <tr><td style="padding: 6px 0; font-weight: 600; width: 100px;">회의명</td><td><del>${target.title}</del></td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">일시</td><td>${formatDateKorean(target.date)} ${target.startTime} ~ ${target.endTime}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">회의실</td><td>${room?.name} (${room?.floor})</td></tr>
            </table>
          </div>
        `,
        sentAt: new Date().toLocaleString('ko-KR', { hour12: false }),
      };

      state.emailLogs.unshift(cancelEmail);
      saveStorage(STORAGE_KEYS.EMAIL_LOGS, state.emailLogs);

      state.modal.cancelTargetReservation = null;
      showToast('info', '예약 취소 완료', '회의실 예약이 취소되었으며, 참석자에게 취소 메일이 발송되었습니다.');
      renderApp();
    });

    // 임직원 검색 인풋
    const searchInput = document.getElementById('modal-employee-search');
    const dropdown = document.getElementById('modal-employee-dropdown');
    if (searchInput && dropdown) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
          dropdown.classList.add('hidden');
          return;
        }
        const matches = EMPLOYEES.filter(
          (emp) =>
            !tempModalAttendees.some((a) => a.id === emp.id) &&
            (emp.name.toLowerCase().includes(q) ||
              emp.department.toLowerCase().includes(q) ||
              emp.position.toLowerCase().includes(q))
        );
        if (matches.length === 0) {
          dropdown.innerHTML = '<div class="p-2.5 text-center text-xs text-slate-400">검색 결과가 없습니다.</div>';
        } else {
          dropdown.innerHTML = matches
            .map(
              (m) => `
              <button type="button" data-add-emp="${m.id}" class="w-full py-1.5 px-3 flex items-center justify-between text-left hover:bg-slate-100 text-xs dark:hover:bg-slate-700">
                <span><strong>${m.name}</strong> ${m.position} · ${m.department}</span>
                <span class="text-blue-600 font-semibold">+ 추가</span>
              </button>
            `
            )
            .join('');

          dropdown.querySelectorAll('[data-add-emp]').forEach((b) => {
            b.addEventListener('click', (ev) => {
              const empId = ev.currentTarget.getAttribute('data-add-emp');
              const found = EMPLOYEES.find((x) => x.id === empId);
              if (found) {
                tempModalAttendees.push(found);
                renderModalAttendees();
                searchInput.value = '';
                dropdown.classList.add('hidden');
              }
            });
          });
        }
        dropdown.classList.remove('hidden');
      });
    }

    // 예약 모달 폼 제출 (비즈니스 규칙 검증: 3시간 제한, 14일 한도, 충돌 방지)
    document.getElementById('reservation-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const errBox = document.getElementById('reservation-error');
      const title = document.getElementById('modal-title').value.trim();
      const roomId = document.getElementById('modal-room-id').value;
      const date = document.getElementById('modal-date').value;
      const startTime = document.getElementById('modal-start-time').value;
      const endTime = document.getElementById('modal-end-time').value;
      const isRecurring = document.getElementById('modal-recurring').checked;
      const desc = document.getElementById('modal-desc').value.trim();
      const room = state.rooms.find((r) => r.id === roomId);
      const editing = state.modal.editingReservation;

      // 1. 사전 예약 정책 (14일 이내) 검증
      const today = getTodayString();
      const maxDate = getMaxAdvanceDateString();
      if (date < today || date > maxDate) {
        errBox.textContent = '사전 예약 정책: 현재일 기준 14일 이내의 날짜만 예약 가능합니다.';
        errBox.classList.remove('hidden');
        return;
      }

      // 2. 1회 예약 최대 3시간(180분) 정책 검증
      const duration = calculateDuration(startTime, endTime);
      if (duration <= 0) {
        errBox.textContent = '종료 시간은 시작 시간보다 이후여야 합니다.';
        errBox.classList.remove('hidden');
        return;
      }
      if (duration > MAX_RESERVATION_MINUTES) {
        errBox.textContent = `1회 예약은 정책상 최대 3시간(180분)까지 가능합니다. (현재: ${(duration / 60).toFixed(1)}시간)`;
        errBox.classList.remove('hidden');
        return;
      }

      // 3. 점검 중 여부 검증
      if (room?.status === 'maintenance') {
        errBox.textContent = '선택하신 회의실은 시설/장비 점검 중으로 예약이 불가능합니다.';
        errBox.classList.remove('hidden');
        return;
      }

      // 4. 충돌 여부 검증
      const conflict = state.reservations.some((r) => {
        if (editing && r.id === editing.id) return false;
        return (
          r.roomId === roomId &&
          r.date === date &&
          r.status !== 'cancelled' &&
          checkTimeOverlap(startTime, endTime, r.startTime, r.endTime)
        );
      });
      if (conflict) {
        errBox.textContent = '선택하신 시간대에 이미 다른 예약이 존재합니다. 다른 시간이나 회의실을 선택해 주세요.';
        errBox.classList.remove('hidden');
        return;
      }

      // 저장 처리
      const currentUser = getCurrentUser();
      const recipientEmails = Array.from(new Set([currentUser.email, ...tempModalAttendees.map((a) => a.email)]));
      const recipientNames = Array.from(new Set([currentUser.name, ...tempModalAttendees.map((a) => a.name)]));

      if (editing) {
        // 수정
        editing.title = title;
        editing.roomId = roomId;
        editing.date = date;
        editing.startTime = startTime;
        editing.endTime = endTime;
        editing.durationMinutes = duration;
        editing.attendees = tempModalAttendees;
        editing.description = desc;
        editing.isRecurring = isRecurring;

        saveStorage(STORAGE_KEYS.RESERVATIONS, state.reservations);

        // 변경 이메일 발송
        const updateMail = {
          id: `mail-${Date.now()}`,
          reservationId: editing.id,
          type: 'updated',
          recipientEmails,
          recipientNames,
          subject: `[회의실 예약 변경] ${formatDateKorean(date)} ${startTime} ${room?.name} - ${title}`,
          roomName: room?.name || '회의실',
          meetingDate: date,
          meetingTime: `${startTime} ~ ${endTime} (${duration}분)`,
          bodyPreview: '회의실 예약 정보가 변경되었습니다.',
          bodyHtml: `
            <div style="font-family: Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #bfdbfe; border-radius: 8px;">
              <h2 style="color: #1d4ed8; margin-top: 0;">[회의실 예약 변경 안내]</h2>
              <p style="color: #475569; font-size: 14px;">회의실 예약 정보가 성공적으로 변경되었습니다.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155; margin-top: 12px;">
                <tr><td style="padding: 6px 0; font-weight: 600; width: 100px;">회의명</td><td><strong>${title}</strong></td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">일시</td><td>${formatDateKorean(date)} ${startTime} ~ ${endTime} (${duration}분)</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">회의실</td><td>${room?.name} (${room?.floor})</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">참석자</td><td>${recipientNames.join(', ')}</td></tr>
              </table>
            </div>
          `,
          sentAt: new Date().toLocaleString('ko-KR', { hour12: false }),
        };
        state.emailLogs.unshift(updateMail);
        saveStorage(STORAGE_KEYS.EMAIL_LOGS, state.emailLogs);

        state.modal.reservationOpen = false;
        showToast('success', '예약 정보 수정 완료', '회의 일정이 변경되었으며 참석자에게 변경 안내 메일이 발송되었습니다.');
        renderApp();
      } else {
        // 신규 예약 등록
        const newRes = {
          id: `res-${Date.now()}`,
          roomId,
          title,
          organizerId: currentUser.id,
          organizerName: currentUser.name,
          organizerDept: currentUser.department,
          organizerEmail: currentUser.email,
          date,
          startTime,
          endTime,
          durationMinutes: duration,
          attendees: tempModalAttendees,
          description: desc,
          isRecurring,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };

        const newItems = [newRes];

        // 2주간 매주 반복 예약 처리 (충돌 없을 경우)
        if (isRecurring) {
          const d2 = new Date(date);
          d2.setDate(d2.getDate() + 7);
          const secondDate = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(
            d2.getDate()
          ).padStart(2, '0')}`;
          const conflictWeek2 = state.reservations.some(
            (r) =>
              r.roomId === roomId &&
              r.date === secondDate &&
              r.status !== 'cancelled' &&
              checkTimeOverlap(startTime, endTime, r.startTime, r.endTime)
          );
          if (!conflictWeek2) {
            newItems.push({
              ...newRes,
              id: `res-${Date.now()}-w2`,
              date: secondDate,
            });
          }
        }

        state.reservations.unshift(...newItems);
        saveStorage(STORAGE_KEYS.RESERVATIONS, state.reservations);

        // 확정 이메일 자동 생성
        const confirmMail = {
          id: `mail-${Date.now()}`,
          reservationId: newRes.id,
          type: 'confirmed',
          recipientEmails,
          recipientNames,
          subject: `[회의실 예약 확정] ${formatDateKorean(date)} ${startTime} ${room?.name} - ${title}`,
          roomName: room?.name || '회의실',
          meetingDate: date,
          meetingTime: `${startTime} ~ ${endTime} (${duration}분)`,
          bodyPreview: '회의실 예약이 정상 승인되었습니다.',
          bodyHtml: `
            <div style="font-family: Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">[회의실 예약 확정 안내]</h2>
              <p style="color: #475569; font-size: 14px;">사내 회의실 예약이 내부 DB에 성공적으로 등록되었습니다.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155; margin-top: 12px;">
                <tr><td style="padding: 6px 0; font-weight: 600; width: 100px;">회의명</td><td><strong>${title}</strong></td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">일시</td><td>${formatDateKorean(date)} ${startTime} ~ ${endTime} (${duration}분)</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">회의실</td><td>${room?.name} (${room?.floor})</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">주최자</td><td>${currentUser.name} (${currentUser.department})</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600;">참석자</td><td>${recipientNames.join(', ')}</td></tr>
              </table>
            </div>
          `,
          sentAt: new Date().toLocaleString('ko-KR', { hour12: false }),
        };
        state.emailLogs.unshift(confirmMail);
        saveStorage(STORAGE_KEYS.EMAIL_LOGS, state.emailLogs);

        state.modal.reservationOpen = false;
        showToast('success', '회의실 예약 완료', `${title} 일정이 확정되었으며 참석자 ${recipientNames.length}명에게 이메일이 발송되었습니다.`);
        renderApp();
      }
    });

    // 관리자: 회의실 등록/수정 모달 이벤트
    document.getElementById('close-room-edit-modal')?.addEventListener('click', () => {
      state.modal.roomEditModalOpen = false;
      renderModals();
    });
    document.getElementById('btn-close-room-edit')?.addEventListener('click', () => {
      state.modal.roomEditModalOpen = false;
      renderModals();
    });
    document.getElementById('room-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const rName = document.getElementById('edit-room-name').value.trim();
      const rFloor = document.getElementById('edit-room-floor').value.trim();
      const rCap = Number(document.getElementById('edit-room-capacity').value);
      const rMon = document.getElementById('edit-room-monitor').checked;
      const rProj = document.getElementById('edit-room-projector').checked;
      const rVid = document.getElementById('edit-room-video').checked;
      const rWb = document.getElementById('edit-room-whiteboard').checked;
      const rDesc = document.getElementById('edit-room-desc').value.trim();
      const editing = state.modal.editingRoom;

      if (editing) {
        editing.name = rName;
        editing.floor = rFloor;
        editing.capacity = rCap;
        editing.hasMonitor = rMon;
        editing.hasProjector = rProj;
        editing.hasVideoConference = rVid;
        editing.hasWhiteboard = rWb;
        editing.description = rDesc;
        showToast('success', '회의실 수정 완료', `${rName} 정보가 업데이트되었습니다.`);
      } else {
        const newR = {
          id: `room-${Date.now()}`,
          name: rName,
          floor: rFloor,
          capacity: rCap,
          hasMonitor: rMon,
          hasProjector: rProj,
          hasVideoConference: rVid,
          hasWhiteboard: rWb,
          status: 'available',
          description: rDesc,
          imageUrl: './src/assets/images/room_creative_projector_1793771834226.jpg',
        };
        state.rooms.unshift(newR);
        showToast('success', '회의실 신규 등록', `${rName} 회의실이 자원 목록에 등록되었습니다.`);
      }

      saveStorage(STORAGE_KEYS.ROOMS, state.rooms);
      state.modal.roomEditModalOpen = false;
      renderApp();
    });

    // 관리자: 점검 모드 전환 모달 이벤트
    document.getElementById('close-maint-reason')?.addEventListener('click', () => {
      state.modal.maintenanceTargetRoom = null;
      renderModals();
    });
    document.getElementById('confirm-maint-reason-btn')?.addEventListener('click', () => {
      const room = state.modal.maintenanceTargetRoom;
      if (!room) return;
      const reason = document.getElementById('maint-reason-input').value.trim();
      room.status = 'maintenance';
      room.maintenanceReason = reason || '정기 시설 점검 중';
      saveStorage(STORAGE_KEYS.ROOMS, state.rooms);
      state.modal.maintenanceTargetRoom = null;
      showToast('error', '점검 모드 전환', `${room.name} 신규 예약이 차단되었습니다.`);
      renderApp();
    });

    // 관리자: 삭제 확인 모달 이벤트
    document.getElementById('close-delete-confirm')?.addEventListener('click', () => {
      state.modal.deleteTargetRoomId = null;
      renderModals();
    });
    document.getElementById('confirm-delete-room-btn')?.addEventListener('click', () => {
      const id = state.modal.deleteTargetRoomId;
      if (!id) return;
      state.rooms = state.rooms.filter((r) => r.id !== id);
      saveStorage(STORAGE_KEYS.ROOMS, state.rooms);
      state.modal.deleteTargetRoomId = null;
      showToast('info', '회의실 삭제 완료', '회의실 자원이 영구 삭제되었습니다.');
      renderApp();
    });
  }

  // .ics 캘린더 파일 다운로드
  function downloadIcs(mail) {
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Company//Meeting Reservation System//KO\nBEGIN:VEVENT\nSUMMARY:${mail.subject}\nLOCATION:${mail.roomName}\nDESCRIPTION:${mail.bodyPreview}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${mail.meetingDate || 'reservation'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // CSV 내보내기 핸들러
  function exportCSV() {
    const headers = ['예약ID', '회의명', '회의실', '예약일자', '시작시간', '종료시간', '이용시간(분)', '주최자', '소속부서', '참석자수', '상태'];
    const rows = state.reservations.map((r) => {
      const room = state.rooms.find((rm) => rm.id === r.roomId);
      return [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${room?.name || r.roomId}"`,
        r.date,
        r.startTime,
        r.endTime,
        r.durationMinutes,
        `"${r.organizerName}"`,
        `"${r.organizerDept}"`,
        r.attendees.length,
        r.status === 'cancelled' ? '취소' : '확정',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `사내회의실_예약이용통계_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('success', 'CSV 내보내기 성공', '통계 데이터 파일이 성공적으로 다운로드되었습니다.');
  }

  // 초기 시작
  window.addEventListener('DOMContentLoaded', () => {
    renderApp();
  });
})();
