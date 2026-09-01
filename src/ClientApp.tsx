import { useState } from "react";
import type { Service, Appointment, ClientScreen, WeekSchedule } from "./types";
import type { StoreType } from "./store";
import { generateId } from "./store";

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WDAYS[dt.getDay()]}, ${d} de ${MONTHS_PT[m - 1]}`;
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

function fmtPrice(n: number): string {
  return `R$ ${n.toFixed(0).replace(".", ",")}`;
}

interface CalendarCell {
  date: string | null;
  day: number;
  isPast: boolean;
  hasSlots: boolean;
}

function buildCalendar(
  year: number,
  month: number,
  schedule: WeekSchedule,
  getAvailableSlots: (d: string) => string[]
): CalendarCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push({ date: null, day: 0, isPast: false, hasSlots: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isPast = dt < today;
    const hasSlots = !isPast && getAvailableSlots(dateStr).length > 0;
    cells.push({ date: dateStr, day: d, isPast, hasSlots });
  }
  return cells;
}

// ─── Logo ────────────────────────────────────────────────────────────────────

function BarberLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-4xl";
  const sub = size === "lg" ? "text-[11px]" : "text-[9px]";
  const name = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-3xl";
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className={`${cls} leading-none`}>💈</div>
      <div className={`${sub} tracking-[0.35em] text-gold-400 font-body font-medium uppercase`}>
        Barbearia
      </div>
      <div className={`${name} font-display italic text-bark-50 leading-none`}>Santana</div>
      <div className="w-16 h-px bg-gold-600 mt-1" />
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function HomeScreen({
  onStart,
  onAdminAccess,
}: {
  onStart: () => void;
  onAdminAccess: () => void;
}) {
  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=1200&fit=crop&auto=format"
          alt="Barbearia Santana"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bark-950/80 via-bark-950/60 to-bark-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-sm mx-auto w-full px-6">
        {/* Logo area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-up">
          <BarberLogo size="lg" />
          <p className="text-bark-300 text-sm tracking-wide text-center leading-relaxed">
            O estilo perfeito começa aqui.<br />
            Agende seu horário em minutos.
          </p>
        </div>

        {/* CTA */}
        <div className="pb-10 space-y-4 animate-fade-up">
          <button
            onClick={onStart}
            className="w-full py-4 rounded-xl bg-gold-500 hover:bg-gold-400 active:scale-95 transition-all duration-150 text-bark-950 font-body font-semibold text-base tracking-wide shadow-lg shadow-gold-700/30"
          >
            Agendar Agora
          </button>

          {/* Hours hint */}
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-bark-700" />
            <span className="text-bark-400 text-xs tracking-wider">Seg–Sex 9h–18h30 · Sáb 9h–13h</span>
            <div className="h-px flex-1 bg-bark-700" />
          </div>

          <button
            onClick={onAdminAccess}
            className="w-full py-2 text-bark-500 text-xs hover:text-bark-300 transition-colors"
          >
            Área Administrativa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Select ───────────────────────────────────────────────────────────

function ServiceSelect({
  services,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  services: Service[];
  selected: Service | null;
  onSelect: (s: Service) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const active = services.filter((s) => s.active);
  return (
    <div className="h-full flex flex-col max-w-sm mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-bark-800 hover:bg-bark-700 active:scale-95 transition-all flex items-center justify-center text-bark-200"
        >
          ←
        </button>
        <div>
          <div className="text-xs text-gold-500 tracking-wider font-medium uppercase">
            Passo 1 de 3
          </div>
          <h1 className="font-display text-xl text-bark-50">Escolha o Serviço</h1>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollable animate-fade-up">
        {active.map((s) => {
          const isSel = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left rounded-xl border transition-all duration-150 p-4
                ${isSel
                  ? "border-gold-500 bg-gold-700/10"
                  : "border-bark-700 bg-bark-900 hover:border-bark-500 active:scale-[0.99]"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className={`font-body font-medium text-base ${isSel ? "text-gold-300" : "text-bark-50"}`}>
                    {s.name}
                  </div>
                  <div className="text-bark-400 text-xs mt-0.5">{fmtDuration(s.duration)}</div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`font-body font-semibold text-lg ${isSel ? "text-gold-400" : "text-gold-500"}`}>
                    {fmtPrice(s.price)}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${isSel ? "border-gold-500 bg-gold-500" : "border-bark-600"}`}
                  >
                    {isSel && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#0C0A07" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-2 shrink-0">
        <button
          onClick={onNext}
          disabled={!selected}
          className="w-full py-4 rounded-xl font-body font-semibold text-base tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
            bg-gold-500 hover:bg-gold-400 text-bark-950 shadow-lg shadow-gold-700/30"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─── DateTime Select ──────────────────────────────────────────────────────────

function DateTimeSelect({
  selectedService,
  schedule,
  getAvailableSlots,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onBack,
  onNext,
}: {
  selectedService: Service;
  schedule: WeekSchedule;
  getAvailableSlots: (d: string) => string[];
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (d: string) => void;
  onSelectTime: (t: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const cells = buildCalendar(viewYear, viewMonth, schedule, getAvailableSlots);
  const availTimes = selectedDate ? getAvailableSlots(selectedDate) : [];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const canPrev =
    viewYear > now.getFullYear() || viewMonth > now.getMonth();
  const canNext =
    viewYear < now.getFullYear() + 1 ||
    (viewYear === now.getFullYear() + 1 && viewMonth < now.getMonth());

  return (
    <div className="h-full flex flex-col max-w-sm mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-bark-800 hover:bg-bark-700 active:scale-95 transition-all flex items-center justify-center text-bark-200"
        >
          ←
        </button>
        <div>
          <div className="text-xs text-gold-500 tracking-wider font-medium uppercase">
            Passo 2 de 3
          </div>
          <h1 className="font-display text-xl text-bark-50">Data e Horário</h1>
        </div>
      </div>

      {/* Service chip */}
      <div className="px-4 mb-3 shrink-0">
        <div className="inline-flex items-center gap-2 bg-bark-800 border border-bark-700 rounded-full px-3 py-1.5">
          <span className="text-gold-400 text-xs">✦</span>
          <span className="text-bark-100 text-sm font-medium">{selectedService.name}</span>
          <span className="text-gold-500 text-sm font-semibold">{fmtPrice(selectedService.price)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollable animate-fade-up">
        {/* Calendar */}
        <div className="bg-bark-900 rounded-2xl border border-bark-700 p-4 mb-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              disabled={!canPrev}
              className="w-8 h-8 rounded-full hover:bg-bark-700 active:scale-95 transition-all flex items-center justify-center text-bark-300 disabled:opacity-20 text-lg"
            >
              ‹
            </button>
            <span className="font-display text-bark-100 text-base">
              {MONTHS_PT[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              disabled={!canNext}
              className="w-8 h-8 rounded-full hover:bg-bark-700 active:scale-95 transition-all flex items-center justify-center text-bark-300 disabled:opacity-20 text-lg"
            >
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WDAYS.map((d) => (
              <div key={d} className="text-center text-bark-500 text-[11px] font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((cell, i) => {
              if (!cell.date) {
                return <div key={`empty-${i}`} />;
              }
              const isSel = cell.date === selectedDate;
              const isToday =
                cell.date ===
                `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
              return (
                <button
                  key={cell.date}
                  onClick={() => { if (cell.hasSlots) { onSelectDate(cell.date!); onSelectTime(""); } }}
                  disabled={!cell.hasSlots}
                  className={`
                    mx-auto w-9 h-9 rounded-full text-sm font-body transition-all duration-100 flex items-center justify-center
                    ${isSel ? "bg-gold-500 text-bark-950 font-semibold shadow-md shadow-gold-700/40" : ""}
                    ${!isSel && cell.hasSlots ? "text-bark-50 hover:bg-bark-700 active:scale-90" : ""}
                    ${!isSel && isToday && cell.hasSlots ? "ring-1 ring-gold-600" : ""}
                    ${cell.isPast || !cell.hasSlots ? "text-bark-600 cursor-not-allowed" : ""}
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="animate-fade-up">
            <p className="text-bark-300 text-xs tracking-wider uppercase mb-3 font-medium">
              Horários disponíveis — {fmtDate(selectedDate)}
            </p>
            {availTimes.length === 0 ? (
              <p className="text-bark-500 text-sm text-center py-4">
                Sem horários disponíveis nesta data.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availTimes.map((t) => {
                  const isSel = t === selectedTime;
                  return (
                    <button
                      key={t}
                      onClick={() => onSelectTime(t)}
                      className={`py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-100 active:scale-95
                        ${isSel
                          ? "bg-gold-500 text-bark-950 shadow-md shadow-gold-700/30"
                          : "bg-bark-800 text-bark-200 border border-bark-700 hover:border-bark-500"
                        }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-2 shrink-0">
        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="w-full py-4 rounded-xl font-body font-semibold text-base tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
            bg-gold-500 hover:bg-gold-400 text-bark-950 shadow-lg shadow-gold-700/30"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─── Booking Form ─────────────────────────────────────────────────────────────

function BookingForm({
  selectedService,
  selectedDate,
  selectedTime,
  clientName,
  clientPhone,
  setClientName,
  setClientPhone,
  onBack,
  onSubmit,
  submitting,
}: {
  selectedService: Service;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  clientPhone: string;
  setClientName: (v: string) => void;
  setClientPhone: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const canSubmit = clientName.trim().length >= 2 && clientPhone.trim().length >= 8;

  return (
    <div className="h-full flex flex-col max-w-sm mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-bark-800 hover:bg-bark-700 active:scale-95 transition-all flex items-center justify-center text-bark-200"
        >
          ←
        </button>
        <div>
          <div className="text-xs text-gold-500 tracking-wider font-medium uppercase">
            Passo 3 de 3
          </div>
          <h1 className="font-display text-xl text-bark-50">Seus Dados</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollable animate-fade-up">
        {/* Booking summary */}
        <div className="bg-bark-900 border border-bark-700 rounded-2xl p-4 mb-6">
          <p className="text-bark-400 text-xs tracking-wider uppercase mb-3">Resumo do agendamento</p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-bark-300 text-sm">Serviço</span>
              <span className="text-bark-50 text-sm font-medium">{selectedService.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-bark-300 text-sm">Duração</span>
              <span className="text-bark-50 text-sm">{fmtDuration(selectedService.duration)}</span>
            </div>
            <div className="h-px bg-bark-800" />
            <div className="flex justify-between items-center">
              <span className="text-bark-300 text-sm">Data</span>
              <span className="text-bark-50 text-sm">{fmtDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-bark-300 text-sm">Horário</span>
              <span className="text-bark-50 text-sm font-medium">{selectedTime}</span>
            </div>
            <div className="h-px bg-bark-800" />
            <div className="flex justify-between items-center">
              <span className="text-bark-300 text-sm">Total</span>
              <span className="text-gold-400 text-lg font-semibold">{fmtPrice(selectedService.price)}</span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-bark-300 text-xs tracking-wider uppercase mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-bark-900 border border-bark-700 focus:border-gold-500 rounded-xl px-4 py-3.5 text-bark-50 text-base placeholder:text-bark-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-bark-300 text-xs tracking-wider uppercase mb-2">
              WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full bg-bark-900 border border-bark-700 focus:border-gold-500 rounded-xl px-4 py-3.5 text-bark-50 text-base placeholder:text-bark-500 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-2 shrink-0">
        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-4 rounded-xl font-body font-semibold text-base tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
            bg-gold-500 hover:bg-gold-400 text-bark-950 shadow-lg shadow-gold-700/30"
        >
          {submitting ? "Confirmando..." : "Confirmar Agendamento"}
        </button>
      </div>
    </div>
  );
}

// ─── Booking Success ──────────────────────────────────────────────────────────

function BookingSuccess({
  appointment,
  onNewBooking,
}: {
  appointment: Appointment;
  onNewBooking: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-between max-w-sm mx-auto w-full px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-up">
        {/* Check */}
        <div className="w-20 h-20 rounded-full border-2 border-gold-500 flex items-center justify-center animate-scale-pop">
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path
              d="M3 14L13 24L33 4"
              stroke="#C4973A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h1 className="font-display text-2xl text-bark-50 mb-1">
            Agendamento Confirmado!
          </h1>
          <p className="text-bark-400 text-sm">
            Te esperamos na Barbearia Santana
          </p>
        </div>

        {/* Details card */}
        <div className="w-full bg-bark-900 border border-bark-700 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-bark-400 text-sm">Código</span>
            <span className="text-gold-400 text-sm font-mono font-semibold">{appointment.id}</span>
          </div>
          <div className="h-px bg-bark-800" />
          <div className="flex justify-between">
            <span className="text-bark-400 text-sm">Nome</span>
            <span className="text-bark-100 text-sm font-medium">{appointment.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bark-400 text-sm">Serviço</span>
            <span className="text-bark-100 text-sm">{appointment.serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bark-400 text-sm">Data</span>
            <span className="text-bark-100 text-sm">{fmtDate(appointment.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bark-400 text-sm">Horário</span>
            <span className="text-bark-100 text-sm font-semibold">{appointment.time}</span>
          </div>
          <div className="h-px bg-bark-800" />
          <div className="flex justify-between">
            <span className="text-bark-400 text-sm">Valor</span>
            <span className="text-gold-400 text-sm font-semibold">{fmtPrice(appointment.servicePrice)}</span>
          </div>
        </div>

        <p className="text-bark-600 text-xs text-center px-4">
          Tire um print desta tela para guardar seu agendamento.
        </p>
      </div>

      <div className="w-full space-y-3 pt-4">
        <button
          onClick={onNewBooking}
          className="w-full py-4 rounded-xl font-body font-semibold text-base tracking-wide transition-all duration-150 active:scale-95
            bg-gold-500 hover:bg-gold-400 text-bark-950 shadow-lg shadow-gold-700/30"
        >
          Novo Agendamento
        </button>
      </div>
    </div>
  );
}

// ─── ClientApp Root ───────────────────────────────────────────────────────────

interface Props {
  store: StoreType;
  onAdminAccess: () => void;
}

export default function ClientApp({ store, onAdminAccess }: Props) {
  const [screen, setScreen] = useState<ClientScreen>("home");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastAppt, setLastAppt] = useState<Appointment | null>(null);

  function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setTimeout(() => {
      const appt: Appointment = {
        id: generateId(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      store.addAppointment(appt);
      setLastAppt(appt);
      setSubmitting(false);
      setScreen("success");
    }, 800);
  }

  function handleNewBooking() {
    setSelectedService(null);
    setSelectedDate("");
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
    setLastAppt(null);
    setScreen("home");
  }

  const key = screen; // forces re-mount on screen change for animation

  return (
    <div className="h-full overflow-hidden" key={key}>
      {screen === "home" && (
        <HomeScreen
          onStart={() => setScreen("service")}
          onAdminAccess={onAdminAccess}
        />
      )}

      {screen === "service" && (
        <ServiceSelect
          services={store.services}
          selected={selectedService}
          onSelect={setSelectedService}
          onBack={() => setScreen("home")}
          onNext={() => setScreen("datetime")}
        />
      )}

      {screen === "datetime" && selectedService && (
        <DateTimeSelect
          selectedService={selectedService}
          schedule={store.schedule}
          getAvailableSlots={store.getAvailableSlots}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectDate={(d) => { setSelectedDate(d); setSelectedTime(""); }}
          onSelectTime={setSelectedTime}
          onBack={() => setScreen("service")}
          onNext={() => setScreen("form")}
        />
      )}

      {screen === "form" && selectedService && (
        <BookingForm
          selectedService={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          clientName={clientName}
          clientPhone={clientPhone}
          setClientName={setClientName}
          setClientPhone={setClientPhone}
          onBack={() => setScreen("datetime")}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {screen === "success" && lastAppt && (
        <BookingSuccess appointment={lastAppt} onNewBooking={handleNewBooking} />
      )}
    </div>
  );
}
