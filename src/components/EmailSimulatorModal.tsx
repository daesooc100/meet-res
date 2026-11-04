import React, { useState } from 'react';
import { EmailLog } from '../types';
import { Mail, X, CheckCircle, RefreshCw, XCircle, Calendar, Download, Clock, Users, MapPin, ExternalLink } from 'lucide-react';

interface EmailSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailLogs: EmailLog[];
  selectedEmailId?: string | null;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  isOpen,
  onClose,
  emailLogs,
  selectedEmailId,
}) => {
  if (!isOpen) return null;

  const [activeLogId, setActiveLogId] = useState<string>(
    selectedEmailId || (emailLogs[0]?.id ?? '')
  );

  const activeEmail = emailLogs.find((e) => e.id === activeLogId) || emailLogs[0];

  // Download fake .ics calendar file
  const handleDownloadIcs = (email: EmailLog) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Company//Meeting Reservation System//KO
BEGIN:VEVENT
SUMMARY:${email.subject}
LOCATION:${email.roomName}
DESCRIPTION:${email.bodyPreview}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meeting_${email.meetingDate || 'event'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[85vh] max-h-[750px] flex flex-col overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-950 dark:text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                사내 자동 발송 이메일 알림 보관함
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                예약 확정, 일정 변경, 취소 시 주최자 및 참석자에게 자동 발송된 실제 메일 내역입니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split: Left List + Right Mail View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List Column */}
          <div className="w-1/3 min-w-[260px] border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800">
            {emailLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                발송된 이메일 알림이 없습니다.
              </div>
            ) : (
              emailLogs.map((log) => {
                const isSelected = log.id === activeEmail?.id;
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setActiveLogId(log.id)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer block ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-semibold ${
                        log.type === 'confirmed' ? 'text-emerald-600 dark:text-emerald-400' :
                        log.type === 'updated' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {log.type === 'confirmed' ? '예약 확정' : log.type === 'updated' ? '일정 변경' : '예약 취소'}
                      </span>
                      <span className="text-slate-400 tabular-nums">{log.sentAt.slice(5, 16)}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate mb-1 dark:text-white">
                      {log.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">
                      수신: {log.recipientNames.join(', ')} ({log.recipientEmails.length}명)
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Detail Column */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
            {activeEmail ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 dark:bg-slate-900 dark:border-slate-800">
                {/* Meta header */}
                <div className="border-b border-slate-200 pb-4 mb-5 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h1 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeEmail.subject}
                    </h1>
                    <button
                      type="button"
                      onClick={() => handleDownloadIcs(activeEmail)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 dark:bg-blue-950/60 dark:border-blue-900 dark:text-blue-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.ics 캘린더 등록</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">발신:</strong> 사내 회의실 예약 시스템 &lt;noreply-meeting@company.internal&gt;
                    </div>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">수신:</strong> {activeEmail.recipientEmails.join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      발송 일시: {activeEmail.sentAt}
                    </div>
                  </div>
                </div>

                {/* Email Body HTML Render */}
                <div 
                  className="email-content-rendered prose max-w-none text-slate-800 dark:text-slate-200 text-xs"
                  dangerouslySetInnerHTML={{ __html: activeEmail.bodyHtml }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                선택된 메일이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
