import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchServices, type ServiceDto } from './api/services';
import { fetchBarbers, type BarberDto } from './api/barbers';
import { fetchAvailability, type AvailabilitySlotDto } from './api/availability';
import { createAppointment, type AppointmentConfirmationDto, type CreateAppointmentInput } from './api/appointments';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function formatPrice(priceCents: number) {
  return `$${(priceCents / 100).toFixed(2)}`;
}

function toDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

function describeSlot(slot: AvailabilitySlotDto) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

const App = () => {
  const [apiBaseUrl] = useState(() => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmation, setConfirmation] = useState<AppointmentConfirmationDto | null>(null);

  const servicesQuery = useQuery({
    queryKey: ['services', apiBaseUrl],
    queryFn: () => fetchServices(apiBaseUrl),
  });

  const services = servicesQuery.data ?? [];
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;

  const barbersQuery = useQuery({
    queryKey: ['barbers', apiBaseUrl, selectedServiceId],
    queryFn: () => fetchBarbers(apiBaseUrl, selectedServiceId ?? undefined),
    enabled: Boolean(selectedServiceId),
  });

  const barbers = barbersQuery.data ?? [];
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId) ?? null;

  const availabilityQuery = useQuery({
    queryKey: ['availability', apiBaseUrl, selectedServiceId, selectedBarberId, selectedDate],
    queryFn: () =>
      fetchAvailability({
        apiBaseUrl,
        date: selectedDate,
        serviceId: selectedServiceId!,
        barberId: selectedBarberId,
      }),
    enabled: Boolean(selectedServiceId && selectedDate),
  });

  const availability = availabilityQuery.data ?? [];

  const createAppointmentMutation = useMutation({
    mutationFn: () =>
      createAppointment(apiBaseUrl, {
        clientName,
        clientEmail: clientEmail || undefined,
        clientPhone: clientPhone || undefined,
        notes: notes || undefined,
        serviceId: selectedServiceId!,
        slotId: selectedSlotId!,
      }),
    onSuccess: (result) => {
      setConfirmation(result);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setNotes('');
      setSelectedSlotId(null);
    },
  });

  const isReadyToSubmit =
    Boolean(selectedServiceId && selectedSlotId && clientName.trim()) && !createAppointmentMutation.isPending;

  const nextSteps = useMemo(() => {
    if (!selectedService) {
      return 'Select a service to see available barbers and times.';
    }
    if (barbers.length > 0 && !selectedBarberId) {
      return 'Choose a preferred barber or continue without selection to see all availability.';
    }
    if (!selectedSlotId) {
      return 'Pick a time slot to continue to booking details.';
    }
    return 'Fill in your contact details and confirm the booking.';
  }, [selectedService, barbers.length, selectedBarberId, selectedSlotId]);

  const handleServiceSelect = (service: ServiceDto) => {
    setSelectedServiceId(service.id);
    setSelectedBarberId(null);
    setSelectedSlotId(null);
    setConfirmation(null);
  };

  const handleBarberSelect = (barber: BarberDto | null) => {
    setSelectedBarberId(barber?.id ?? null);
    setSelectedSlotId(null);
    setConfirmation(null);
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
    setConfirmation(null);
  };

  const handleBookingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadyToSubmit) return;
    createAppointmentMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">BarberShop</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Book your next cut in under a minute</h1>
            <p className="mt-2 text-sm text-slate-400">Select a service, pick a time and confirm — we handle the rest.</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <span className="font-medium text-emerald-300">Next step:</span> {nextSteps}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <section>
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-lg font-semibold text-white">1. Choose a service</h2>
            {servicesQuery.isLoading ? <span className="text-xs text-slate-400">Loading…</span> : null}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const isSelected = service.id === selectedServiceId;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service)}
                  className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">{service.name}</h3>
                    <span className="text-sm text-emerald-300">{formatPrice(service.priceCents)}</span>
                  </div>
                  {service.description ? (
                    <p className="mt-2 text-sm text-slate-400">{service.description}</p>
                  ) : null}
                  <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">
                    {service.durationMinutes} minutes
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-lg font-semibold text-white">2. Pick a barber (optional)</h2>
            {barbersQuery.isLoading && selectedServiceId ? (
              <span className="text-xs text-slate-400">Loading…</span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!selectedServiceId}
              onClick={() => handleBarberSelect(null)}
              className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                !selectedBarberId
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
              } ${!selectedServiceId ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Any barber
            </button>
            {barbers.map((barber) => {
              const isSelected = barber.id === selectedBarberId;
              return (
                <button
                  key={barber.id}
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => handleBarberSelect(barber)}
                  className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                  } ${!selectedServiceId ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {barber.name}
                </button>
              );
            })}
            {!selectedServiceId ? (
              <p className="text-sm text-slate-500">Select a service to view barbers.</p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-lg font-semibold text-white">3. Date &amp; time</h2>
            <div className="mt-4 grid gap-4">
              <label className="text-sm text-slate-300">
                Date
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedSlotId(null);
                    setConfirmation(null);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                {availabilityQuery.isLoading ? (
                  <span className="text-sm text-slate-400">Loading availability…</span>
                ) : availability.length === 0 ? (
                  <span className="text-sm text-slate-400">
                    {selectedServiceId ? 'No open slots for this day. Try another date.' : 'Select a service to see available times.'}
                  </span>
                ) : (
                  availability.map((slot) => {
                    const isSelected = slot.slotId === selectedSlotId;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => handleSlotSelect(slot.slotId)}
                        className={`rounded-lg border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className="block font-medium text-white">{describeSlot(slot)}</span>
                        {slot.barberName ? (
                          <span className="text-xs text-slate-400">with {slot.barberName}</span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">4. Your details</h2>
            <form className="mt-4 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5" onSubmit={handleBookingSubmit}>
              <div>
                <label className="text-sm text-slate-300" htmlFor="clientName">
                  Full name <span className="text-emerald-300">*</span>
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  required
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300" htmlFor="clientEmail">
                  Email
                </label>
                <input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300" htmlFor="clientPhone">
                  Phone
                </label>
                <input
                  id="clientPhone"
                  name="clientPhone"
                  value={clientPhone}
                  onChange={(event) => setClientPhone(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300" htmlFor="notes">
                  Notes for your barber
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Any preferences we should know about?"
                />
              </div>

              {createAppointmentMutation.isError ? (
                <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  Something went wrong while scheduling. Please try again.
                </div>
              ) : null}

              {confirmation ? (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  Booking confirmed for <span className="font-medium">{confirmation.clientName}</span>. We reserved the slot
                  at{' '}
                  <span className="font-medium">
                    {describeSlot({
                      slotId: confirmation.slot.id,
                      barberId: confirmation.barber?.id ?? null,
                      barberName: confirmation.barber?.name ?? null,
                      start: confirmation.slot.start,
                      end: confirmation.slot.end,
                    })}
                  </span>{' '}
                  with {confirmation.barber?.name ?? 'our next available barber'}.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!isReadyToSubmit}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-slate-950 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isReadyToSubmit
                    ? 'bg-emerald-500 hover:bg-emerald-400 focus-visible:outline-emerald-300'
                    : 'cursor-not-allowed bg-slate-700 text-slate-300'
                }`}
              >
                {createAppointmentMutation.isPending ? 'Scheduling…' : 'Confirm appointment'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;


