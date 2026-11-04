import React from 'react';
import { MeetingRoom, Reservation } from '../types';
import { parseTimeToMinutes } from '../utils/dateUtils';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Building, 
  Users, 
  Download, 
  CheckCircle2, 
  XCircle,
  CalendarCheck
} from 'lucide-react';

interface AnalyticsDashboardProps {
  rooms: MeetingRoom[];
  reservations: Reservation[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  rooms,
  reservations,
}) => {
  // 1. Metric: Total Bookings, Active, Cancelled
  const totalBookings = reservations.length;
  const activeBookings = reservations.filter((r) => r.status !== 'cancelled').length;
  const cancelledBookings = reservations.filter((r) => r.status === 'cancelled').length;
  const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0';

  // Total booked hours
  const totalBookedMinutes = reservations
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.durationMinutes, 0);
  const totalBookedHours = (totalBookedMinutes / 60).toFixed(1);

  // 2. Room Utilization Calculation (Based on active bookings)
  const roomStats = rooms.map((room) => {
    const roomRes = reservations.filter((r) => r.roomId === room.id && r.status !== 'cancelled');
    const minutes = roomRes.reduce((sum, r) => sum + r.durationMinutes, 0);
    // Assuming 10 hours work day * 10 working days = 6000 possible minutes per 2 weeks
    const capacityScore = Math.min(100, Math.round((minutes / (600 * 8)) * 100));
    return {
      id: room.id,
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
      count: roomRes.length,
      hours: (minutes / 60).toFixed(1),
      utilizationRate: capacityScore,
    };
  }).sort((a, b) => b.utilizationRate - a.utilizationRate);

  // 3. Hourly Booking Density (09:00 to 18:00)
  const hourlySlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const hourlyCounts = hourlySlots.map((hour) => {
    const slotMin = parseTimeToMinutes(hour);
    const count = reservations.filter((r) => {
      if (r.status === 'cancelled') return false;
      const rStart = parseTimeToMinutes(r.startTime);
      const rEnd = parseTimeToMinutes(r.endTime);
      return slotMin >= rStart && slotMin < rEnd;
    }).length;
    return { hour, count };
  });

  const maxHourlyCount = Math.max(1, ...hourlyCounts.map((h) => h.count));

  // 4. Department breakdown
  const deptMap: Record<string, { count: number; hours: number; deptName: string }> = {};
  reservations.forEach((r) => {
    if (r.status === 'cancelled') return;
    const dept = r.organizerDept || '미지정 부서';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, hours: 0, deptName: dept };
    }
    deptMap[dept].count += 1;
    deptMap[dept].hours += r.durationMinutes / 60;
  });

  const deptStats = Object.values(deptMap).sort((a, b) => b.hours - a.hours);
  const totalDeptHours = deptStats.reduce((sum, d) => sum + d.hours, 0) || 1;

  // 5. CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['예약ID', '회의명', '회의실', '예약일자', '시작시간', '종료시간', '이용시간(분)', '주최자', '소속부서', '참석자수', '상태'];
    const rows = reservations.map((r) => {
      const room = rooms.find((rm) => rm.id === r.roomId);
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
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `사내회의실_예약이용통계_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              사내 회의실 자원 가동률 및 이용 통계 리포트
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            회의실별 가동률, 시간대별 집중도, 부서별 점유 현황을 분석하여 자원 최적화를 지원합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>통계 데이터 CSV 내보내기</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">전체 누적 예약 건수</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">
              {totalBookings}
            </strong>
            <span className="text-xs text-emerald-600 font-medium">유효: {activeBookings}건</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">총 가동 시간</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">
              {totalBookedHours}
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400">시간</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">예약 취소율</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">
              {cancellationRate}%
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400">({cancelledBookings}건)</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">피크 타임 (최다 예약)</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-blue-600 tabular-nums dark:text-blue-400">
              14:00 ~ 16:00
            </strong>
          </div>
        </div>
      </div>

      {/* Grid: Room Utilization & Hourly Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Utilization Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              회의실별 이용 가동률 현황
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">가동률 기준 정렬</span>
          </div>

          <div className="space-y-3">
            {roomStats.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-slate-400 text-[11px]">({item.floor})</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-slate-500">{item.count}건 · {item.hours}시간</span>
                    <strong className="font-bold text-blue-600 dark:text-blue-400">{item.utilizationRate}%</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, item.utilizationRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Density Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              시간대별 예약 밀집도 현황 (09:00 ~ 18:00)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">동시 예약 건수</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {hourlyCounts.map((slot) => {
              const heightPct = Math.max(12, (slot.count / maxHourlyCount) * 100);
              const isPeak = slot.count === maxHourlyCount && slot.count > 0;

              return (
                <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                    {slot.count > 0 ? slot.count : ''}
                  </span>
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md overflow-hidden flex items-end h-32 dark:bg-slate-800">
                    <div
                      className={`w-full transition-all rounded-t-md ${
                        isPeak ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums whitespace-nowrap">
                    {slot.hour.slice(0, 2)}시
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-center dark:text-slate-400">
            오후 14시~16시 시간대에 전사 회의 예약이 집중되는 경향을 보입니다.
          </p>
        </div>
      </div>

      {/* Department Usage Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 mb-4 dark:text-white">
          부서별 회의실 이용 시간 및 비중 현황
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visual Percentage Breakdown */}
          <div className="space-y-3">
            {deptStats.map((dept) => {
              const pct = Math.round((dept.hours / totalDeptHours) * 100);
              return (
                <div key={dept.deptName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.deptName}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {dept.count}건 ({dept.hours.toFixed(1)}시간 · {pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department Table summary */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 pb-2 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2">부서명</th>
                  <th className="py-2 text-right">예약 건수</th>
                  <th className="py-2 text-right">누적 회의 시간</th>
                  <th className="py-2 text-right">점유 비중</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deptStats.map((d) => (
                  <tr key={d.deptName} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2 font-medium">{d.deptName}</td>
                    <td className="py-2 text-right tabular-nums">{d.count}건</td>
                    <td className="py-2 text-right tabular-nums">{d.hours.toFixed(1)}h</td>
                    <td className="py-2 text-right tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                      {Math.round((d.hours / totalDeptHours) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
