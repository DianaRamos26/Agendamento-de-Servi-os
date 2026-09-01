import { useState, useCallback } from "react";
import type { Service, WeekSchedule, Appointment, DaySchedule } from "./types";

const BASE_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

const SAT_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];

export const DEFAULT_SERVICES: Service[] = [
  { id: "s1", name: "Corte de Cabelo", price: 35, duration: 45, active: true },
  { id: "s2", name: "Barba", price: 15, duration: 30, active: true },
  { id: "s3", name: "Sobrancelha", price: 5, duration: 15, active: true },
  { id: "s4", name: "Pezinho", price: 10, duration: 20, active: true },
  { id: "s5", name: "Pigmentação", price: 15, duration: 30, active: true },
  { id: "s6", name: "Alisamento", price: 35, duration: 60, active: true },
  { id: "s7", name: "Luzes com Corte", price: 100, duration: 120, active: true },
  { id: "s8", name: "Platinado com Corte", price: 130, duration: 150, active: true },
];

const makeDay = (slots: string[]): DaySchedule => ({ active: true, slots });

export const DEFAULT_SCHEDULE: WeekSchedule = {
  0: { active: false, slots: [] },
  1: makeDay(BASE_SLOTS),
  2: makeDay(BASE_SLOTS),
  3: makeDay(BASE_SLOTS),
  4: makeDay(BASE_SLOTS),
  5: makeDay(BASE_SLOTS),
  6: makeDay(SAT_SLOTS),
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function generateId(): string {
  return "BS" + Date.now().toString(36).toUpperCase().slice(-6);
}

export function useStore() {
  const [services, setServicesState] = useState<Service[]>(() =>
    load("bs_services", DEFAULT_SERVICES)
  );
  const [schedule, setScheduleState] = useState<WeekSchedule>(() =>
    load("bs_schedule", DEFAULT_SCHEDULE)
  );
  const [appointments, setAppointmentsState] = useState<Appointment[]>(() =>
    load("bs_appointments", [])
  );

  const setServices = useCallback((next: Service[]) => {
    setServicesState(next);
    save("bs_services", next);
  }, []);

  const setSchedule = useCallback((next: WeekSchedule) => {
    setScheduleState(next);
    save("bs_schedule", next);
  }, []);

  const addAppointment = useCallback((appt: Appointment) => {
    setAppointmentsState((prev) => {
      const next = [...prev, appt];
      save("bs_appointments", next);
      return next;
    });
  }, []);

  const updateAppointmentStatus = useCallback(
    (id: string, status: Appointment["status"]) => {
      setAppointmentsState((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, status } : a));
        save("bs_appointments", next);
        return next;
      });
    },
    []
  );

  const getAvailableSlots = useCallback(
    (date: string, currentSchedule?: WeekSchedule, currentAppointments?: Appointment[]): string[] => {
      const sch = currentSchedule ?? schedule;
      const appts = currentAppointments ?? appointments;
      const [y, m, d] = date.split("-").map(Number);
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      const daySchedule = sch[dayOfWeek];
      if (!daySchedule?.active) return [];
      const booked = appts
        .filter((a) => a.date === date && a.status !== "cancelled")
        .map((a) => a.time);
      return daySchedule.slots.filter((s) => !booked.includes(s));
    },
    [schedule, appointments]
  );

  return {
    services,
    setServices,
    schedule,
    setSchedule,
    appointments,
    addAppointment,
    updateAppointmentStatus,
    getAvailableSlots,
  };
}

export type StoreType = ReturnType<typeof useStore>;
