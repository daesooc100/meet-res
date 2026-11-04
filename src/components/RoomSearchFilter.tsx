import React from 'react';
import { TIME_SLOTS, getNext14Days, calculateDuration, MAX_RESERVATION_MINUTES, getTodayString, getMaxAdvanceDateString } from '../utils/dateUtils';
import { Search, Calendar, Clock, Users, Monitor, Projector, Video, FileSpreadsheet, LayoutGrid, CalendarRange, AlertCircle } from 'lucide-react';

interface FilterState {
  date: string;
  startTime: string;
  endTime: string;
  minCapacity: number;
  hasMonitor: boolean;
  hasProjector: boolean;
  hasVideoConference: boolean;
  hasWhiteboard: boolean;
  floor: string;
  viewMode: 'cards' | 'timeline';
}

interface RoomSearchFilterProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  availableFloors: string[];
}

export const RoomSearchFilter: React.FC<RoomSearchFilterProps> = ({
  filter,
  setFilter,
  availableFloors,
}) => {
  const next14Days = getNext14Days();
  const duration = calculateDuration(filter.startTime, filter.endTime);
  const isOverDuration = duration > MAX_RESERVATION_MINUTES;
  const isInvalidTime = duration <= 0;

  const handleDateChange = (date: string) => {
    setFilter((prev) => ({ ...prev, date }));
  };

  const handleStartTimeChange = (startTime: string) => {
    setFilter((prev) => {
      // automatically adjust end time to start + 1 hr if needed
      const [sh, sm] = startTime.split(':').map(Number);
      let eh = sh + 1;
      if (eh > 20) eh = 20;
      const suggestedEnd = `${String(eh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
      return {
        ...prev,
        startTime,
        endTime: prev.endTime <= startTime ? suggestedEnd : prev.endTime,
      };
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6 transition-colors dark:bg-slate-900 dark:border-slate-800">
      {/* Policy Notice Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200">예약 핵심 정책:</span>
          <span>1회 최대 3시간</span>
          <span aria-hidden="true">·</span>
          <span>현재일 기준 14일 이내 사전 예약</span>
          <span aria-hidden="true">·</span>
          <span>자체 사내 DB 실시간 동기화</span>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setFilter((p) => ({ ...p, viewMode: 'cards' }))}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter.viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>카드 뷰</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter((p) => ({ ...p, viewMode: 'timeline' }))}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter.viewMode === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>타임테이블 뷰</span>
          </button>
        </div>
      </div>

      {/* Date Carousel (Strict 14-day limit) */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2 dark:text-slate-300">
          예약 희망 일자 (최대 14일 사전 예약)
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {next14Days.map((d) => {
            const isSelected = filter.date === d.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => handleDateChange(d.date)}
                className={`flex flex-col items-center justify-center min-w-[72px] px-2.5 py-2 rounded-lg border text-xs transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[11px] opacity-75">{d.dayName}요일</span>
                <span className="text-sm font-semibold tabular-nums mt-0.5">{d.label}</span>
                {d.isToday && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">오늘</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Time Range & Capacity & Floor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Time Selection */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
            회의 희망 시간 (1회 최대 3시간)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={filter.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {TIME_SLOTS.slice(0, -1).map((time) => (
                  <option key={time} value={time}>
                    시작: {time}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-slate-400 text-xs">~</span>
            <div className="relative flex-1">
              <select
                value={filter.endTime}
                onChange={(e) => setFilter((p) => ({ ...p, endTime: e.target.value }))}
                className={`w-full h-9 px-3 text-xs font-medium border rounded-lg bg-white focus:outline-none dark:bg-slate-800 ${
                  isOverDuration || isInvalidTime
                    ? 'border-red-500 text-red-600 dark:border-red-500 dark:text-red-400'
                    : 'border-slate-200 text-slate-800 focus:border-blue-600 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {TIME_SLOTS.filter((t) => t > filter.startTime).map((time) => (
                  <option key={time} value={time}>
                    종료: {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Duration Feedback */}
          <div className="mt-1 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              선택 회의 시간: <strong className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{duration}분</strong> ({duration / 60}시간)
            </span>
            {isOverDuration && (
              <span className="text-red-600 font-medium flex items-center gap-1 dark:text-red-400">
                <AlertCircle className="w-3 h-3" /> 최대 3시간 초과 불가
              </span>
            )}
          </div>
        </div>

        {/* Capacity Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
            최소 수용 인원
          </label>
          <select
            value={filter.minCapacity}
            onChange={(e) => setFilter((p) => ({ ...p, minCapacity: Number(e.target.value) }))}
            className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={0}>인원 무관 (전체)</option>
            <option value={4}>4인 이상 (소형/허들)</option>
            <option value={8}>8인 이상 (중형)</option>
            <option value={12}>12인 이상 (대형)</option>
            <option value={20}>20인 이상 (임원/세미나)</option>
            <option value={40}>40인 이상 (대강당)</option>
          </select>
        </div>

        {/* Floor Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
            층 / 위치 구역
          </label>
          <select
            value={filter.floor}
            onChange={(e) => setFilter((p) => ({ ...p, floor: e.target.value }))}
            className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">전체 층 및 구역</option>
            {availableFloors.map((fl) => (
              <option key={fl} value={fl}>
                {fl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Checkboxes */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="block text-xs font-semibold text-slate-700 mb-2 dark:text-slate-300">
          필수 장비 옵션 필터
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filter.hasMonitor}
              onChange={(e) => setFilter((p) => ({ ...p, hasMonitor: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <Monitor className="w-3.5 h-3.5 text-slate-500" />
            <span>대형 모니터 (TV)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filter.hasProjector}
              onChange={(e) => setFilter((p) => ({ ...p, hasProjector: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <Projector className="w-3.5 h-3.5 text-slate-500" />
            <span>빔프로젝터</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filter.hasVideoConference}
              onChange={(e) => setFilter((p) => ({ ...p, hasVideoConference: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <Video className="w-3.5 h-3.5 text-slate-500" />
            <span>화상회의 시스템 (Cam/Mic)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filter.hasWhiteboard}
              onChange={(e) => setFilter((p) => ({ ...p, hasWhiteboard: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>화이트보드</span>
          </label>

          {(filter.hasMonitor || filter.hasProjector || filter.hasVideoConference || filter.hasWhiteboard || filter.minCapacity > 0 || filter.floor !== 'all') && (
            <button
              type="button"
              onClick={() =>
                setFilter((p) => ({
                  ...p,
                  minCapacity: 0,
                  hasMonitor: false,
                  hasProjector: false,
                  hasVideoConference: false,
                  hasWhiteboard: false,
                  floor: 'all',
                }))
              }
              className="text-xs text-blue-600 hover:underline dark:text-blue-400 ml-auto cursor-pointer"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
