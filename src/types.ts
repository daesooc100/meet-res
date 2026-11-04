export type RoomStatus = 'available' | 'maintenance';

export interface MeetingRoom {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  hasMonitor: boolean;
  hasProjector: boolean;
  hasVideoConference: boolean;
  hasWhiteboard: boolean;
  status: RoomStatus;
  maintenanceReason?: string;
  imageUrl: string;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  avatarUrl?: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerDept: string;
  organizerEmail: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. 10:00)
  endTime: string; // HH:mm (e.g. 12:00)
  durationMinutes: number;
  attendees: Employee[];
  description?: string;
  isRecurring: boolean;
  recurrenceType?: 'none' | 'weekly';
  recurringWeeksCount?: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface EmailLog {
  id: string;
  reservationId: string;
  type: 'confirmed' | 'updated' | 'cancelled';
  recipientEmails: string[];
  recipientNames: string[];
  subject: string;
  roomName: string;
  meetingDate: string;
  meetingTime: string;
  bodyPreview: string;
  bodyHtml: string;
  sentAt: string;
}

export type ActiveTab = 'search' | 'my-bookings' | 'admin-rooms' | 'analytics';

export type UserRole = 'user' | 'admin';
