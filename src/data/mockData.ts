import { MeetingRoom, Employee, Reservation, EmailLog } from '../types';
import { getTodayString } from '../utils/dateUtils';

export const INITIAL_ROOMS: MeetingRoom[] = [
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
    imageUrl: '/src/assets/images/room_executive_board_1793771832524.jpg',
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
    imageUrl: '/src/assets/images/room_creative_projector_1793771834226.jpg',
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
    imageUrl: '/src/assets/images/room_focus_huddle_1793771835464.jpg',
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
    imageUrl: '/src/assets/images/room_large_townhall_1793771834830.jpg',
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
    imageUrl: '/src/assets/images/room_focus_huddle_1793771835464.jpg',
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
    imageUrl: '/src/assets/images/room_creative_projector_1793771834226.jpg',
    description: '고성능 빔프로젝터와 다자간 화상회의 코덱이 장착된 차세대 연구개발 전용 회의실입니다.',
  },
];

export const EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    name: '홍길동',
    department: '프로덕트기획팀',
    position: '책임',
    email: 'gildong.hong@company.internal',
  },
  {
    id: 'emp-02',
    name: '김민준',
    department: '플랫폼개발팀',
    position: '팀장',
    email: 'minjun.kim@company.internal',
  },
  {
    id: 'emp-03',
    name: '이서연',
    department: 'UX/UI디자인팀',
    position: '수석',
    email: 'seoyeon.lee@company.internal',
  },
  {
    id: 'emp-04',
    name: '박도현',
    department: '백엔드개발팀',
    position: '선임',
    email: 'dohyun.park@company.internal',
  },
  {
    id: 'emp-05',
    name: '최유진',
    department: '경영지원본부',
    position: '이사',
    email: 'yujin.choi@company.internal',
  },
  {
    id: 'emp-06',
    name: '정지훈',
    department: '데이터엔지니어링팀',
    position: '책임',
    email: 'jihoon.jung@company.internal',
  },
  {
    id: 'emp-07',
    name: '강다은',
    department: '글로벌마케팅팀',
    position: '매니저',
    email: 'daeun.kang@company.internal',
  },
  {
    id: 'emp-08',
    name: '윤재석',
    department: '클라우드인프라팀',
    position: '수석',
    email: 'jaeseok.yoon@company.internal',
  },
  {
    id: 'emp-09',
    name: '한소희',
    department: '전략사업추진팀',
    position: '책임',
    email: 'sohee.han@company.internal',
  },
  {
    id: 'emp-10',
    name: '이진호',
    department: '총무/IT자산관리팀',
    position: '팀장',
    email: 'jinho.lee@company.internal',
  },
];

export const CURRENT_USER: Employee = EMPLOYEES[0];
export const ADMIN_USER: Employee = EMPLOYEES[9];

export function getInitialReservations(): Reservation[] {
  const today = getTodayString();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const d2 = new Date();
  d2.setDate(d2.getDate() + 2);
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
      title: '전사 기술 공유회 (Tech Talk 11월 세션)',
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

export function getInitialEmailLogs(): EmailLog[] {
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
            <tr><td style="padding: 6px 0; font-weight: 600;">예약자</td><td>홍길동 책임 (프로덕트기획팀)</td></tr>
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
