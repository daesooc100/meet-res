import { MeetingRoom, Reservation, EmailLog, Employee } from '../types';
import { INITIAL_ROOMS, EMPLOYEES, getInitialReservations, getInitialEmailLogs, CURRENT_USER, ADMIN_USER } from '../data/mockData';

const ROOMS_KEY = 'corp_meeting_rooms_v1';
const RESERVATIONS_KEY = 'corp_reservations_v1';
const EMAIL_LOGS_KEY = 'corp_email_logs_v1';

export function loadRooms(): MeetingRoom[] {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load rooms from localStorage', e);
  }
  saveRooms(INITIAL_ROOMS);
  return INITIAL_ROOMS;
}

export function saveRooms(rooms: MeetingRoom[]): void {
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  } catch (e) {
    console.error('Failed to save rooms to localStorage', e);
  }
}

export function loadReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reservations from localStorage', e);
  }
  const initial = getInitialReservations();
  saveReservations(initial);
  return initial;
}

export function saveReservations(reservations: Reservation[]): void {
  try {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  } catch (e) {
    console.error('Failed to save reservations to localStorage', e);
  }
}

export function loadEmailLogs(): EmailLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load email logs from localStorage', e);
  }
  const initial = getInitialEmailLogs();
  saveEmailLogs(initial);
  return initial;
}

export function saveEmailLogs(logs: EmailLog[]): void {
  try {
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save email logs to localStorage', e);
  }
}

export function resetAllData(): { rooms: MeetingRoom[]; reservations: Reservation[]; emailLogs: EmailLog[] } {
  localStorage.removeItem(ROOMS_KEY);
  localStorage.removeItem(RESERVATIONS_KEY);
  localStorage.removeItem(EMAIL_LOGS_KEY);

  const rooms = INITIAL_ROOMS;
  const reservations = getInitialReservations();
  const emailLogs = getInitialEmailLogs();

  saveRooms(rooms);
  saveReservations(reservations);
  saveEmailLogs(emailLogs);

  return { rooms, reservations, emailLogs };
}
