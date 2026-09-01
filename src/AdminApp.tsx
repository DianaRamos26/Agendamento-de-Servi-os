import { useState, useMemo } from "react";
import type { Service, Appointment, AppointmentStatus, WeekSchedule, AdminScreen } from "./types";
import type { StoreType } from "./store";
import { DEFAULT_SCHEDULE } from "./store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const WDAYS_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const WDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WDAYS_SHORT[dt.getDay()]}, ${d} ${MONTHS_PT[m - 1]}`;
}

function fmtPrice(n: number): string {
  return `R$ ${n.toFixed(0)}`;
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h${r}min` : `${h}h`;
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending: "bg-gold-700/20 text-gold-400 border-gold-700/40",
  confirmed: "bg-jade-900 text-jade-400 border-jade-600/30",
  cancelled: "bg-ruby-900 text-ruby-500 border-ruby-600/30",
};

// ─── Admin Login ──────────────────────────────────────────────────────────────

function AdminLogin({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const CORRECT_PIN = "1234";

  function press(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) { onSuccess(); }
        else { setError(true); setPin(""); }
      }, 200);
    }
  }

  function del() { setPin((p) => p.slice(0, -1)); setError(false); }

  const dots = Array.from({ length: 4 }, (_, i) => (
    <div
      key={i}
      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150
        ${i < pin.length ? "bg-gold-500 border-gold-500 scale-110" : "bg-transparent border-bark-500"}`}
    />
  ));

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-8 max-w-xs mx-auto animate-fade-up">
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl mb-1">🔒</div>
        <h2 className="font-display text-2xl text-bark-50 text-center">Área Restrita</h2>
        <p className="text-bark-400 text-sm text-center">Digite o PIN de acesso</p>
      </div>

      <div className="flex gap-5 items-center">{dots}</div>

      {error && (
        <p className="text-ruby-400 text-sm animate-fade-up">PIN incorreto. Tente novamente.</p>
      )}

      {/* Keypad */}
      <div className="w-full grid grid-cols-3 gap-3">
        {keys.flat().map((k, i) => {
          if (!k) return <div key={i} />;
          return (
            <button
              key={i}
              onClick={() => (k === "⌫" ? del() : press(k))}
              className={`h-14 rounded-2xl font-body text-xl font-medium transition-all duration-100 active:scale-90
                ${k === "⌫"
                  ? "bg-bark-800 text-bark-300 hover:bg-bark-700"
                  : "bg-bark-800 text-bark-50 hover:bg-bark-700 active:bg-bark-600"
                }`}
            >
              {k}
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="text-bark-500 text-sm hover:text-bark-300 transition-colors mt-2"
      >
        ← Voltar ao App
      </button>
    </div>
  );
}

// ─── Appointments List ────────────────────────────────────────────────────────

type FilterStatus = "all" | AppointmentStatus;

function AppointmentsList({
  appointments,
  onUpdateStatus,
}: {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        if (filter !== "all" && a.status !== filter) return false;
        if (dateFilter === "today") {
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          return a.date === todayStr;
        }
        if (dateFilter === "week") {
          const [y, m, d] = a.date.split("-").map(Number);
          const apptDate = new Date(y, m - 1, d);
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return apptDate >= today && apptDate <= weekEnd;
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.date + "T" + a.time);
        const db = new Date(b.date + "T" + b.time);
        return da.getTime() - db.getTime();
      });
  }, [appointments, filter, dateFilter]);

  const pending = appointments.filter((a) => a.status === "pending").length;

  const filterTabs: { label: string; value: FilterStatus; count?: number }[] = [
    { label: "Todos", value: "all", count: appointments.length },
    { label: "Pendentes", value: "pending", count: pending },
    { label: "Confirmados", value: "confirmed" },
    { label: "Cancelados", value: "cancelled" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Date filter */}
      <div className="flex gap-2 px-4 pb-3 shrink-0">
        {(["today", "week", "all"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setDateFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${dateFilter === v ? "bg-bark-700 text-bark-50" : "text-bark-400 hover:text-bark-200"}`}
          >
            {v === "today" ? "Hoje" : v === "week" ? "Esta semana" : "Todos"}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto shrink-0 scrollable">
        {filterTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${filter === t.value ? "bg-gold-500 text-bark-950" : "bg-bark-800 text-bark-300 border border-bark-700 hover:border-bark-500"}`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-semibold
                  ${filter === t.value ? "bg-bark-950/30" : "bg-bark-700 text-bark-200"}`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollable">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <div className="text-4xl opacity-30">📅</div>
            <p className="text-bark-500 text-sm">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          filtered.map((appt) => (
            <div
              key={appt.id}
              className="bg-bark-900 border border-bark-700 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-body font-semibold text-bark-50 text-sm">{appt.clientName}</p>
                  <p className="text-bark-400 text-xs">{appt.clientPhone}</p>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${STATUS_COLOR[appt.status]}`}>
                  {STATUS_LABEL[appt.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-bark-800 rounded-lg px-2 py-2">
                  <p className="text-bark-500 mb-0.5">Serviço</p>
                  <p className="text-bark-100 font-medium leading-tight">{appt.serviceName}</p>
                </div>
                <div className="bg-bark-800 rounded-lg px-2 py-2">
                  <p className="text-bark-500 mb-0.5">Data</p>
                  <p className="text-bark-100 font-medium">{fmtDate(appt.date)}</p>
                </div>
                <div className="bg-bark-800 rounded-lg px-2 py-2">
                  <p className="text-bark-500 mb-0.5">Horário</p>
                  <p className="text-gold-400 font-semibold">{appt.time}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-gold-500 text-sm font-semibold">{fmtPrice(appt.servicePrice)}</span>
                <div className="flex gap-2">
                  {appt.status !== "confirmed" && appt.status !== "cancelled" && (
                    <button
                      onClick={() => onUpdateStatus(appt.id, "confirmed")}
                      className="px-3 py-1.5 rounded-lg bg-jade-900 border border-jade-600/30 text-jade-400 text-xs font-medium hover:bg-jade-600/20 active:scale-95 transition-all"
                    >
                      Confirmar
                    </button>
                  )}
                  {appt.status !== "cancelled" && (
                    <button
                      onClick={() => onUpdateStatus(appt.id, "cancelled")}
                      className="px-3 py-1.5 rounded-lg bg-ruby-900 border border-ruby-600/30 text-ruby-500 text-xs font-medium hover:bg-ruby-600/20 active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  {appt.status === "cancelled" && (
                    <button
                      onClick={() => onUpdateStatus(appt.id, "pending")}
                      className="px-3 py-1.5 rounded-lg bg-bark-800 border border-bark-600 text-bark-300 text-xs font-medium hover:bg-bark-700 active:scale-95 transition-all"
                    >
                      Reativar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Services Manager ─────────────────────────────────────────────────────────

interface ServiceModalState {
  open: boolean;
  service: Partial<Service> & { id?: string };
  isNew: boolean;
}

function ServicesManager({
  services,
  onSetServices,
}: {
  services: Service[];
  onSetServices: (s: Service[]) => void;
}) {
  const [modal, setModal] = useState<ServiceModalState>({
    open: false,
    service: {},
    isNew: false,
  });

  function openNew() {
    setModal({ open: true, service: { name: "", price: 0, duration: 30, active: true }, isNew: true });
  }
  function openEdit(s: Service) {
    setModal({ open: true, service: { ...s }, isNew: false });
  }
  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }
  function saveModal() {
    const s = modal.service;
    if (!s.name?.trim() || !s.price || !s.duration) return;
    if (modal.isNew) {
      const newService: Service = {
        id: "s" + Date.now(),
        name: s.name.trim(),
        price: Number(s.price),
        duration: Number(s.duration),
        active: s.active ?? true,
      };
      onSetServices([...services, newService]);
    } else {
      onSetServices(
        services.map((sv) => (sv.id === s.id ? { ...sv, ...s, id: sv.id } as Service : sv))
      );
    }
    closeModal();
  }
  function toggleActive(id: string) {
    onSetServices(services.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }
  function deleteService(id: string) {
    if (window.confirm("Remover este serviço?")) {
      onSetServices(services.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pb-3 shrink-0">
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-600/20 border border-gold-600/40 text-gold-400 text-sm font-medium hover:bg-gold-600/30 active:scale-95 transition-all"
        >
          <span className="text-lg leading-none">+</span>
          Novo Serviço
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 scrollable">
        {services.map((s) => (
          <div
            key={s.id}
            className={`bg-bark-900 border rounded-xl p-4 transition-all ${s.active ? "border-bark-700" : "border-bark-800 opacity-60"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className={`font-body font-medium text-sm ${s.active ? "text-bark-50" : "text-bark-400"}`}>
                  {s.name}
                </p>
                <p className="text-bark-500 text-xs mt-0.5">
                  {fmtDuration(s.duration)}
                </p>
              </div>
              <span className="text-gold-400 font-semibold text-sm shrink-0">{fmtPrice(s.price)}</span>

              {/* Toggle */}
              <button
                onClick={() => toggleActive(s.id)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0
                  ${s.active ? "bg-gold-500" : "bg-bark-700"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
                    ${s.active ? "left-5" : "left-1"}`}
                />
              </button>

              <button
                onClick={() => openEdit(s)}
                className="w-8 h-8 rounded-lg bg-bark-800 hover:bg-bark-700 flex items-center justify-center text-bark-300 text-sm active:scale-90 transition-all shrink-0"
              >
                ✏️
              </button>
              <button
                onClick={() => deleteService(s.id)}
                className="w-8 h-8 rounded-lg bg-bark-800 hover:bg-ruby-900/50 flex items-center justify-center text-bark-400 hover:text-ruby-400 text-sm active:scale-90 transition-all shrink-0"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="absolute inset-0 bg-bark-950/80 flex items-end z-50" onClick={closeModal}>
          <div
            className="w-full bg-bark-900 border-t border-bark-700 rounded-t-3xl p-6 space-y-4 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-bark-50">
              {modal.isNew ? "Novo Serviço" : "Editar Serviço"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-bark-400 text-xs tracking-wider uppercase mb-1.5 block">Nome</label>
                <input
                  type="text"
                  value={modal.service.name ?? ""}
                  onChange={(e) => setModal((m) => ({ ...m, service: { ...m.service, name: e.target.value } }))}
                  className="w-full bg-bark-800 border border-bark-700 focus:border-gold-500 rounded-xl px-4 py-3 text-bark-50 text-sm outline-none transition-colors"
                  placeholder="Nome do serviço"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-bark-400 text-xs tracking-wider uppercase mb-1.5 block">Preço (R$)</label>
                  <input
                    type="number"
                    value={modal.service.price ?? ""}
                    onChange={(e) => setModal((m) => ({ ...m, service: { ...m.service, price: Number(e.target.value) } }))}
                    className="w-full bg-bark-800 border border-bark-700 focus:border-gold-500 rounded-xl px-4 py-3 text-bark-50 text-sm outline-none transition-colors"
                    placeholder="35"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-bark-400 text-xs tracking-wider uppercase mb-1.5 block">Duração (min)</label>
                  <input
                    type="number"
                    value={modal.service.duration ?? ""}
                    onChange={(e) => setModal((m) => ({ ...m, service: { ...m.service, duration: Number(e.target.value) } }))}
                    className="w-full bg-bark-800 border border-bark-700 focus:border-gold-500 rounded-xl px-4 py-3 text-bark-50 text-sm outline-none transition-colors"
                    placeholder="45"
                    min="5"
                    step="5"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl bg-bark-800 text-bark-300 text-sm font-medium hover:bg-bark-700 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={saveModal}
                disabled={!modal.service.name?.trim() || !modal.service.price || !modal.service.duration}
                className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-bark-950 text-sm font-semibold active:scale-95 transition-all disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Schedule Manager ─────────────────────────────────────────────────────────

const ALL_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00",
];

function ScheduleManager({
  schedule,
  onSetSchedule,
}: {
  schedule: WeekSchedule;
  onSetSchedule: (s: WeekSchedule) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number>(1);

  function toggleDay(day: number) {
    const current = schedule[day] ?? { active: false, slots: [] };
    onSetSchedule({
      ...schedule,
      [day]: {
        ...current,
        active: !current.active,
        slots: current.slots.length === 0 ? (DEFAULT_SCHEDULE[day]?.slots ?? []) : current.slots,
      },
    });
  }

  function toggleSlot(day: number, slot: string) {
    const current = schedule[day] ?? { active: true, slots: [] };
    const slots = current.slots.includes(slot)
      ? current.slots.filter((s) => s !== slot)
      : [...current.slots, slot].sort();
    onSetSchedule({ ...schedule, [day]: { ...current, slots } });
  }

  const currentDay = schedule[selectedDay] ?? { active: false, slots: [] };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day selector */}
      <div className="px-4 pb-4 shrink-0">
        <p className="text-bark-400 text-xs tracking-wider uppercase mb-3">Dias de Funcionamento</p>
        <div className="flex gap-2 overflow-x-auto scrollable pb-1">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const daySchedule = schedule[day] ?? { active: false, slots: [] };
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all shrink-0
                  ${isSelected ? "border-gold-500 bg-gold-700/10" : "border-bark-700 bg-bark-900 hover:border-bark-500"}`}
              >
                <span className={`text-xs font-medium ${isSelected ? "text-gold-400" : "text-bark-300"}`}>
                  {WDAYS_SHORT[day]}
                </span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${daySchedule.active ? "bg-jade-500" : "bg-bark-600"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 scrollable">
        <div className="bg-bark-900 border border-bark-700 rounded-2xl p-4">
          {/* Day header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg text-bark-50">{WDAYS_FULL[selectedDay]}</h3>
              <p className="text-bark-400 text-xs">
                {currentDay.active ? `${currentDay.slots.length} horários ativos` : "Dia fechado"}
              </p>
            </div>
            <button
              onClick={() => toggleDay(selectedDay)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200
                ${currentDay.active ? "bg-gold-500" : "bg-bark-700"}`}
            >
              <span
                className={`absolute top-1.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
                  ${currentDay.active ? "left-7" : "left-1.5"}`}
              />
            </button>
          </div>

          {currentDay.active ? (
            <>
              <p className="text-bark-500 text-xs tracking-wider uppercase mb-3">Horários disponíveis</p>
              <div className="grid grid-cols-4 gap-2">
                {ALL_SLOTS.map((slot) => {
                  const active = currentDay.slots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(selectedDay, slot)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all duration-100 active:scale-90
                        ${active
                          ? "bg-gold-500 text-bark-950"
                          : "bg-bark-800 text-bark-500 border border-bark-700 hover:border-bark-500 hover:text-bark-300"
                        }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-bark-600 text-sm">Ative o dia para configurar os horários.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AdminApp Root ────────────────────────────────────────────────────────────

interface Props {
  store: StoreType;
  onBack: () => void;
}

export default function AdminApp({ store, onBack }: Props) {
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState<AdminScreen>("appointments");

  if (!authed) {
    return (
      <div className="h-full bg-bark-950 animate-fade-up">
        <AdminLogin onSuccess={() => setAuthed(true)} onBack={onBack} />
      </div>
    );
  }

  const pending = store.appointments.filter((a) => a.status === "pending").length;

  const tabs: { key: AdminScreen; label: string; badge?: number }[] = [
    { key: "appointments", label: "Agendamentos", badge: pending > 0 ? pending : undefined },
    { key: "services", label: "Serviços" },
    { key: "schedule", label: "Horários" },
  ];

  return (
    <div className="h-full flex flex-col bg-bark-950 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4 border-b border-bark-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💈</span>
          <div>
            <p className="text-bark-400 text-[10px] tracking-wider uppercase">Painel Admin</p>
            <h1 className="font-display text-lg text-bark-50 leading-tight">Barbearia Santana</h1>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-bark-500 text-xs hover:text-bark-300 transition-colors flex items-center gap-1 bg-bark-900 px-3 py-2 rounded-lg border border-bark-700 hover:border-bark-600"
        >
          ← App
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-bark-800 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setScreen(t.key)}
            className={`flex-1 py-3 text-xs font-medium transition-all relative
              ${screen === t.key ? "text-gold-400 border-b-2 border-gold-500" : "text-bark-400 hover:text-bark-200"}`}
          >
            {t.label}
            {t.badge !== undefined && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-gold-500 text-bark-950 text-[10px] font-bold rounded-full">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-4" key={screen}>
        {screen === "appointments" && (
          <AppointmentsList
            appointments={store.appointments}
            onUpdateStatus={store.updateAppointmentStatus}
          />
        )}
        {screen === "services" && (
          <ServicesManager
            services={store.services}
            onSetServices={store.setServices}
          />
        )}
        {screen === "schedule" && (
          <ScheduleManager
            schedule={store.schedule}
            onSetSchedule={store.setSchedule}
          />
        )}
      </div>
    </div>
  );
}
