import React from 'react';
import { ActiveTab, UserRole, Employee } from '../types';
import { 
  CalendarDays, 
  ListFilter, 
  BarChart3, 
  Settings2, 
  Mail, 
  User, 
  ShieldCheck, 
  Moon, 
  Sun,
  Smartphone,
  Laptop
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: Employee;
  unreadEmailCount: number;
  onOpenEmailInbox: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  currentUser,
  unreadEmailCount,
  onOpenEmailInbox,
  isDarkMode,
  setIsDarkMode,
  isMobilePreview,
  setIsMobilePreview,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setActiveTab('search'); }}
          className="text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600 whitespace-nowrap shrink-0 dark:text-white dark:hover:text-blue-400"
        >
          사내 회의실 자동 예약
        </a>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'search'
              ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          회의실 예약
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my-bookings')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'my-bookings'
              ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          내 예약 현황
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'analytics'
              ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          통계 대시보드
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin-rooms')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'admin-rooms'
              ? 'text-blue-600 font-semibold underline underline-offset-8 dark:text-blue-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          자원 관리 {userRole === 'admin' ? '(총무부)' : ''}
        </button>
      </nav>

      {/* Zone 3: Primary Actions & Essential Utilities */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile View Toggle */}
        <button
          type="button"
          onClick={() => setIsMobilePreview(!isMobilePreview)}
          title={isMobilePreview ? '데스크톱 뷰로 전환' : '모바일 뷰 미리보기'}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isMobilePreview ? <Laptop className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isMobilePreview ? '데스크톱' : '모바일 뷰'}</span>
        </button>

        {/* Email Notification Inbox Trigger */}
        <button
          type="button"
          onClick={onOpenEmailInbox}
          title="발송된 사내 이메일 알림 내역"
          className="relative flex items-center justify-center p-2 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Mail className="w-4 h-4" />
          {unreadEmailCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white tabular-nums">
              {unreadEmailCount}
            </span>
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? '라이트 모드' : '다크 모드'}
          className="flex items-center justify-center p-2 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Role Switcher (일반 임직원 <-> 관리자) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setUserRole('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              userRole === 'user'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">임직원</span>
          </button>
          <button
            type="button"
            onClick={() => setUserRole('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              userRole === 'admin'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">관리자</span>
          </button>
        </div>
      </div>
    </header>
  );
};
