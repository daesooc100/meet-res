import React, { useState } from 'react';
import { MeetingRoom, RoomStatus } from '../types';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Monitor, 
  Projector, 
  Video, 
  FileSpreadsheet, 
  MapPin, 
  Users, 
  X,
  AlertTriangle,
  Building
} from 'lucide-react';

interface AdminRoomManagerProps {
  rooms: MeetingRoom[];
  onAddRoom: (room: MeetingRoom) => void;
  onUpdateRoom: (room: MeetingRoom) => void;
  onDeleteRoom: (roomId: string) => void;
  onToggleStatus: (roomId: string, status: RoomStatus, reason?: string) => void;
}

export const AdminRoomManager: React.FC<AdminRoomManagerProps> = ({
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onToggleStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  // Maintenance prompt state
  const [maintenanceTarget, setMaintenanceTarget] = useState<MeetingRoom | null>(null);
  const [maintenanceReasonInput, setMaintenanceReasonInput] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('3층');
  const [capacity, setCapacity] = useState(8);
  const [hasMonitor, setHasMonitor] = useState(true);
  const [hasProjector, setHasProjector] = useState(false);
  const [hasVideoConference, setHasVideoConference] = useState(true);
  const [hasWhiteboard, setHasWhiteboard] = useState(true);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/room_creative_projector_1793771834226.jpg');

  const openCreateModal = () => {
    setEditingRoom(null);
    setName('');
    setFloor('3층');
    setCapacity(8);
    setHasMonitor(true);
    setHasProjector(false);
    setHasVideoConference(true);
    setHasWhiteboard(true);
    setDescription('');
    setImageUrl('/src/assets/images/room_creative_projector_1793771834226.jpg');
    setIsModalOpen(true);
  };

  const openEditModal = (room: MeetingRoom) => {
    setEditingRoom(room);
    setName(room.name);
    setFloor(room.floor);
    setCapacity(room.capacity);
    setHasMonitor(room.hasMonitor);
    setHasProjector(room.hasProjector);
    setHasVideoConference(room.hasVideoConference);
    setHasWhiteboard(room.hasWhiteboard);
    setDescription(room.description);
    setImageUrl(room.imageUrl);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingRoom) {
      onUpdateRoom({
        ...editingRoom,
        name: name.trim(),
        floor,
        capacity,
        hasMonitor,
        hasProjector,
        hasVideoConference,
        hasWhiteboard,
        description: description.trim(),
        imageUrl,
      });
    } else {
      const newRoom: MeetingRoom = {
        id: `room-${Date.now()}`,
        name: name.trim(),
        floor,
        capacity,
        hasMonitor,
        hasProjector,
        hasVideoConference,
        hasWhiteboard,
        status: 'available',
        description: description.trim(),
        imageUrl,
      };
      onAddRoom(newRoom);
    }
    setIsModalOpen(false);
  };

  const handleMaintenanceClick = (room: MeetingRoom) => {
    if (room.status === 'available') {
      setMaintenanceTarget(room);
      setMaintenanceReasonInput(room.maintenanceReason || '시설/장비 정기 점검 및 청소 진행');
    } else {
      // Toggle back to available
      onToggleStatus(room.id, 'available');
    }
  };

  const confirmMaintenance = () => {
    if (maintenanceTarget) {
      onToggleStatus(maintenanceTarget.id, 'maintenance', maintenanceReasonInput);
      setMaintenanceTarget(null);
    }
  };

  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      {/* Admin Header with KPI & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              사내 회의실 자원 관리 (총무 / 시설운영팀)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>총 등록 회의실 <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">{rooms.length}개소</strong></span>
            <span aria-hidden="true">·</span>
            <span>사용 가능 <strong className="font-semibold text-emerald-600 tabular-nums">{availableCount}</strong></span>
            <span aria-hidden="true">·</span>
            <span>점검 중 <strong className="font-semibold text-amber-600 tabular-nums">{maintenanceCount}</strong></span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>신규 회의실 등록</span>
        </button>
      </div>

      {/* Room Table / List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="p-3.5 font-semibold">회의실명</th>
                <th className="p-3.5 font-semibold">위치 / 층</th>
                <th className="p-3.5 font-semibold text-center">수용 인원</th>
                <th className="p-3.5 font-semibold">보유 장비</th>
                <th className="p-3.5 font-semibold text-center">운영 상태</th>
                <th className="p-3.5 font-semibold text-right">관리 작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rooms.map((room) => {
                const isMaint = room.status === 'maintenance';
                return (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                    {/* Name & Photo preview */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-8 rounded-md object-cover bg-slate-100 shrink-0 dark:bg-slate-800"
                        />
                        <div>
                          <strong className="text-sm font-bold text-slate-900 block dark:text-white">
                            {room.name}
                          </strong>
                          <span className="text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">
                            {room.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Floor */}
                    <td className="p-3.5 text-slate-700 whitespace-nowrap dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{room.floor}</span>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-800 tabular-nums dark:text-slate-200">
                        {room.capacity}인
                      </span>
                    </td>

                    {/* Equipment Specs */}
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        {room.hasMonitor && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">모니터</span>}
                        {room.hasProjector && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">빔프로젝터</span>}
                        {room.hasVideoConference && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">화상회의</span>}
                        {room.hasWhiteboard && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">화이트보드</span>}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleMaintenanceClick(room)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          isMaint
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                        title="클릭하여 상태 변경"
                      >
                        {isMaint ? (
                          <>
                            <Wrench className="w-3 h-3" />
                            <span>점검 중</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>정상 운영</span>
                          </>
                        )}
                      </button>
                      {isMaint && room.maintenanceReason && (
                        <span className="block text-[10px] text-amber-600 truncate max-w-[150px] mx-auto mt-0.5 dark:text-amber-400" title={room.maintenanceReason}>
                          {room.maintenanceReason}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(room)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
                          title="회의실 정보 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRoomId(room.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40"
                          title="회의실 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRoom ? '회의실 자원 정보 수정' : '신규 회의실 자원 등록'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  회의실명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 전략기획 회의실 (Zeta)"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                    위치 / 층수
                  </label>
                  <input
                    type="text"
                    required
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="예: 4층 동편"
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                    최대 수용 인원 (명)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Equipment Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                  보유 기기 및 시설 설정
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasMonitor}
                      onChange={(e) => setHasMonitor(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>대형 모니터 (TV)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasProjector}
                      onChange={(e) => setHasProjector(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>빔프로젝터</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasVideoConference}
                      onChange={(e) => setHasVideoConference(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>화상회의 시스템</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasWhiteboard}
                      onChange={(e) => setHasWhiteboard(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>화이트보드</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  회의실 소개 및 이용 안내
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="회의실 용도, 비치 품목 등 안내 설명"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {editingRoom ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Reason Prompt Modal */}
      {maintenanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 text-amber-600 mb-2 dark:text-amber-400">
              <Wrench className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                회의실 점검 모드 전환
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 dark:text-slate-400">
              <strong>{maintenanceTarget.name}</strong>을(를) [시설 점검 중] 상태로 변경합니다.
              점검 중에는 일반 임직원의 신규 예약이 차단됩니다.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                점검 사유 및 완료 예정 안내
              </label>
              <input
                type="text"
                value={maintenanceReasonInput}
                onChange={(e) => setMaintenanceReasonInput(e.target.value)}
                placeholder="예: 빔프로젝터 렌즈 교체 및 네트워크 점검 (11/05 15:00 완료)"
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMaintenanceTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmMaintenance}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                점검 모드로 전환
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 text-red-600 mb-2 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                회의실 자원을 영구 삭제하시겠습니까?
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 dark:text-slate-400">
              해당 회의실의 모든 정보가 시스템에서 삭제됩니다. 신중하게 결정해 주세요.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingRoomId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRoom(deletingRoomId);
                  setDeletingRoomId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
