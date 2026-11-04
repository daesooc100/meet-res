import React from 'react';
import { MeetingRoom, Reservation } from '../types';
import { TIME_SLOTS, parseTimeToMinutes, formatDateKorean } from '../utils/dateUtils';
import { Users, Wrench, Plus, Info } from 'lucide-react';

interface TimetableGridProps {
  rooms: MeetingRoom[];
  reservations: Reservation[];
  selectedDate: string;
  onSlotClick: (room: MeetingRoom, startTime: string) => void;
  onReservationClick: (res: Reservation) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  rooms,
  reservations,
  selectedDate,
  onSlotClick,
  onReservationClick,
}) => {
  const visibleSlots = TIME_SLOTS.slice(0, -1); // 08:30 to 19:30 slot starts

  // Filter reservations for selected date
  const dayReservations = reservations.filter(
    (r) => r.date === selectedDate && r.status !== 'cancelled'
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs dark:bg-slate-900 dark:border-slate-800">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {formatDateKorean(selectedDate)} 회의실별 예약 타임라인
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            빈 시간 슬롯을 클릭하면 해당 회의실 및 시간으로 즉시 예약창이 열립니다.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700" />
            <span>예약 가능</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600" />
            <span>예약 완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400/30 border border-amber-400" />
            <span>시설 점검 중</span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[1000px]">
          {/* Header row: Time labels */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <div className="w-48 p-2.5 shrink-0 border-r border-slate-200 font-semibold dark:border-slate-800">
              회의실 목록
            </div>
            <div className="flex-1 grid grid-cols-23">
              {visibleSlots.map((time) => (
                <div
                  key={time}
                  className="p-1 text-center border-r border-slate-200/60 tabular-nums dark:border-slate-800/60 last:border-r-0"
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Room Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rooms.map((room) => {
              const isMaintenance = room.status === 'maintenance';
              const roomReservations = dayReservations.filter((r) => r.roomId === room.id);

              return (
                <div key={room.id} className="flex hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                  {/* Room Info Cell */}
                  <div className="w-48 p-3 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate dark:text-white">
                        {room.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
                      <span>{room.floor}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">최대 {room.capacity}인</span>
                    </div>
                  </div>

                  {/* Time Slots Area */}
                  <div className="flex-1 relative min-h-[56px] flex">
                    {isMaintenance ? (
                      <div className="w-full flex items-center justify-center bg-amber-50/80 text-amber-800 text-xs font-medium dark:bg-amber-950/20 dark:text-amber-300">
                        <Wrench className="w-3.5 h-3.5 mr-1.5" />
                        <span>시설/장비 점검 진행 중 (예약 불가)</span>
                      </div>
                    ) : (
                      <div className="w-full grid grid-cols-23 relative">
                        {/* Slot Click Targets */}
                        {visibleSlots.map((time) => {
                          const slotStartMin = parseTimeToMinutes(time);
                          const slotEndMin = slotStartMin + 30;

                          // Check if reserved
                          const isBooked = roomReservations.some((r) => {
                            const rStart = parseTimeToMinutes(r.startTime);
                            const rEnd = parseTimeToMinutes(r.endTime);
                            return slotStartMin < rEnd && slotEndMin > rStart;
                          });

                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={isBooked}
                              onClick={() => !isBooked && onSlotClick(room, time)}
                              className={`h-full border-r border-slate-100 transition-colors dark:border-slate-800/50 last:border-r-0 ${
                                isBooked
                                  ? 'cursor-not-allowed bg-slate-50/20'
                                  : 'hover:bg-blue-50/80 cursor-pointer group flex items-center justify-center text-transparent hover:text-blue-600 dark:hover:bg-blue-950/30'
                              }`}
                              title={isBooked ? '예약됨' : `${room.name} ${time} 예약하기`}
                            >
                              <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </button>
                          );
                        })}

                        {/* Reservation Overlay Blocks */}
                        {roomReservations.map((res) => {
                          const baseStart = parseTimeToMinutes('08:30');
                          const baseEnd = parseTimeToMinutes('20:00');
                          const totalMinutes = baseEnd - baseStart;

                          const rStart = parseTimeToMinutes(res.startTime);
                          const rEnd = parseTimeToMinutes(res.endTime);

                          // Calculate percentage offset & width
                          const leftPct = Math.max(0, ((rStart - baseStart) / totalMinutes) * 100);
                          const widthPct = Math.min(100 - leftPct, ((rEnd - rStart) / totalMinutes) * 100);

                          return (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => onReservationClick(res)}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className="absolute top-1.5 bottom-1.5 z-10 mx-0.5 rounded-md bg-blue-600 text-white text-[11px] font-medium p-1.5 text-left flex flex-col justify-center overflow-hidden hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                              title={`${res.title} (${res.startTime} ~ ${res.endTime}) - 예약자: ${res.organizerName}`}
                            >
                              <span className="font-semibold truncate">{res.title}</span>
                              <span className="text-[10px] opacity-90 truncate tabular-nums">
                                {res.startTime}~{res.endTime} · {res.organizerName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
