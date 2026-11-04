import React, { useState } from 'react';
import { MeetingRoom, Reservation } from '../types';
import { Users, MapPin, Monitor, Projector, Video, FileSpreadsheet, Wrench, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { checkTimeOverlap } from '../utils/dateUtils';

interface RoomCardProps {
  room: MeetingRoom;
  selectedDate: string;
  startTime: string;
  endTime: string;
  reservations: Reservation[];
  onBook: (room: MeetingRoom) => void;
  onViewSchedule: (room: MeetingRoom) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  selectedDate,
  startTime,
  endTime,
  reservations,
  onBook,
  onViewSchedule,
}) => {
  const [imgError, setImgError] = useState(false);

  // Check maintenance status
  const isMaintenance = room.status === 'maintenance';

  // Check if room is reserved at selected time
  const conflictingRes = reservations.find(
    (r) =>
      r.roomId === room.id &&
      r.date === selectedDate &&
      r.status !== 'cancelled' &&
      checkTimeOverlap(startTime, endTime, r.startTime, r.endTime)
  );

  const isAvailable = !isMaintenance && !conflictingRes;

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700">
      {/* Room Photo / Fallback */}
      <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden dark:bg-slate-800">
        {!imgError && room.imageUrl ? (
          <img
            src={room.imageUrl}
            alt={room.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Users className="w-8 h-8 mb-1" />
            <span className="text-xs">{room.name}</span>
          </div>
        )}

        {/* Status Indicator Bar */}
        <div className="absolute top-2.5 right-2.5">
          {isMaintenance ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500/95 text-white rounded-md shadow-xs backdrop-blur-xs">
              <Wrench className="w-3 h-3" /> 시설 점검 중
            </span>
          ) : conflictingRes ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-600/90 text-white rounded-md shadow-xs backdrop-blur-xs">
              <XCircle className="w-3 h-3" /> 예약 마감
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600/90 text-white rounded-md shadow-xs backdrop-blur-xs">
              <CheckCircle2 className="w-3 h-3" /> 예약 가능
            </span>
          )}
        </div>

        {/* Floor tag overlay */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-black/60 text-white rounded-md backdrop-blur-xs">
            <MapPin className="w-3 h-3" /> {room.floor}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Room Title & Capacity */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight dark:text-white">
              {room.name}
            </h3>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
              최대 {room.capacity}인
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 dark:text-slate-400">
            {room.description}
          </p>

          {/* Zero-Pill Equipment Specs */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mb-4 dark:text-slate-300">
            {room.hasMonitor && (
              <span className="inline-flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>대형 모니터</span>
              </span>
            )}
            {room.hasProjector && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Projector className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>빔프로젝터</span>
                </span>
              </>
            )}
            {room.hasVideoConference && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>화상회의</span>
                </span>
              </>
            )}
            {room.hasWhiteboard && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>화이트보드</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Maintenance Message or Conflict Notice */}
        {isMaintenance ? (
          <div className="p-2.5 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
            <span className="font-semibold block mb-0.5">점검 사유:</span>
            <span>{room.maintenanceReason || '정기 시설/장비 유지보수 작업 중'}</span>
          </div>
        ) : conflictingRes ? (
          <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
            <span className="font-semibold block mb-0.5">선택 시간대 충돌 예약:</span>
            <span className="tabular-nums font-medium">
              {conflictingRes.startTime} ~ {conflictingRes.endTime}
            </span>{' '}
            <span className="text-slate-600 dark:text-slate-400">({conflictingRes.organizerName} · {conflictingRes.title})</span>
          </div>
        ) : null}

        {/* Card Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onViewSchedule(room)}
            className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            타임라인 보기
          </button>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => onBook(room)}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'
            }`}
          >
            {isMaintenance ? '점검 중' : conflictingRes ? '시간대 변경' : '지금 예약하기'}
          </button>
        </div>
      </div>
    </div>
  );
};
