export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  active: boolean;
}

export interface DaySchedule {
  active: boolean;
  slots: string[]; // "HH:MM"
}

export interface WeekSchedule {
  [day: number]: DaySchedule; // 0=Sun .. 6=Sat
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  status: AppointmentStatus;
  createdAt: string;
}

export type ClientScreen = "home" | "service" | "datetime" | "form" | "success";
export type AdminScreen = "appointments" | "services" | "schedule";
