
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchServices, type ServiceDto } from './api/services';
import { fetchBarbers, type BarberDto } from './api/barbers';
import { fetchAvailability, type AvailabilitySlotDto } from './api/availability';
import { createAppointment, type AppointmentConfirmationDto } from './api/appointments';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const calendarWeekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});

const calendarMonthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
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

function formatDateTime(dateIso: string) {
  return dateTimeFormatter.format(new Date(dateIso));
}

function formatDateLabel(dateInput: string) {
  const [year, month, day] = dateInput.split('-').map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return dateInput;
  }

  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return dateFormatter.format(date);
}

function categorizeService(service: ServiceDto) {
  const value = service.name.toLowerCase();
  if (value.includes('cut') || value.includes('fade')) {
    return 'Haircuts';
  }
  if (value.includes('beard') || value.includes('mustache')) {
    return 'Beard Care';
  }
  if (value.includes('shave')) {
    return 'Shaves';
  }
  if (value.includes('color') || value.includes('tint')) {
    return 'Color';
  }
  return 'Other Services';
}

type NextAvailableResult = {
  date: string;
  service: ServiceDto;
  slot: AvailabilitySlotDto;
};

type UpcomingDay = {
  dayNumber: number;
  inputValue: string;
  isToday: boolean;
  monthLabel: string;
  weekdayLabel: string;
};

function buildUpcomingDays(count = 7): UpcomingDay[] {
  const days: UpcomingDay[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < count; offset += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + offset);

    days.push({
      dayNumber: current.getDate(),
      inputValue: toDateInputValue(current),
      isToday: offset === 0,
      monthLabel: calendarMonthFormatter.format(current),
      weekdayLabel: calendarWeekdayFormatter.format(current),
    });
  }

  return days;
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

  const defaultService = useMemo(() => (services.length > 0 ? services[0] : null), [services]);

  const servicesByCategory = useMemo(() => {
    if (services.length === 0) {
      return [] as { category: string; services: ServiceDto[] }[];
    }

    const categoryOrder = ['Haircuts', 'Beard Care', 'Shaves', 'Color', 'Other Services'];
    const grouped = new Map<string, ServiceDto[]>();

    services.forEach((service) => {
      const category = categorizeService(service);
      const current = grouped.get(category) ?? [];
      current.push(service);
      grouped.set(category, current);
    });

    return Array.from(grouped.entries())
      .map(([category, categoryServices]) => ({
        category,
        services: [...categoryServices].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        const resolvedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const resolvedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        if (resolvedA !== resolvedB) {
          return resolvedA - resolvedB;
        }
        return a.category.localeCompare(b.category);
      });
  }, [services]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  const barbersQuery = useQuery({
    queryKey: ['barbers', apiBaseUrl, selectedServiceId],
    queryFn: () => fetchBarbers(apiBaseUrl, selectedServiceId ?? undefined),
    enabled: Boolean(selectedServiceId),
  });

  const barbers = barbersQuery.data ?? [];
  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === selectedBarberId) ?? null,
    [barbers, selectedBarberId],
  );

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

  const selectedSlot = useMemo(
    () => availability.find((slot) => slot.slotId === selectedSlotId) ?? null,
    [availability, selectedSlotId],
  );

  const nextAvailableQuery = useQuery({
    queryKey: ['next-available', apiBaseUrl, defaultService?.id],
    enabled: Boolean(defaultService),
    queryFn: async (): Promise<NextAvailableResult | null> => {
      if (!defaultService) {
        return null;
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      for (let offset = 0; offset < 14; offset += 1) {
        const probeDate = new Date(start);
        probeDate.setDate(start.getDate() + offset);
        const dateValue = toDateInputValue(probeDate);

        const slots = await fetchAvailability({
          apiBaseUrl,
          date: dateValue,
          serviceId: defaultService.id,
        });

        if (slots.length > 0) {
          return { date: dateValue, service: defaultService, slot: slots[0] };
        }
      }

      return null;
    },
  });

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
      return 'Select a service in Step 2 to unlock staff and calendar options.';
    }
    if (barbers.length > 0 && !selectedBarberId) {
      return 'Pick a preferred barber in Step 3 or keep "Any barber" to continue.';
    }
    if (!selectedSlotId) {
      return 'Choose a day and time in Step 4 to continue to details.';
    }
    return 'Complete Step 5 with your contact info to confirm the booking.';
  }, [selectedService, barbers.length, selectedBarberId, selectedSlotId]);

  const upcomingDays = useMemo(() => buildUpcomingDays(), []);
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
    const slot = availability.find((item) => item.slotId === slotId) ?? null;
    setSelectedSlotId(slotId);
    if (slot?.barberId) {
      setSelectedBarberId(slot.barberId);
    }
    setConfirmation(null);
  };

  const handleBookingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadyToSubmit) return;
    createAppointmentMutation.mutate();
  };

  const handleQuickBook = () => {
    if (!defaultService) {
      return;
    }

    handleServiceSelect(defaultService);

    if (nextAvailableQuery.data) {
      const { slot, date } = nextAvailableQuery.data;
      setSelectedBarberId(slot.barberId ?? null);
      setSelectedDate(date);
      setSelectedSlotId(slot.slotId);
    }

    if (typeof window !== 'undefined') {
      const target = document.getElementById('service-selection');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">BarberShop</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Complete your booking in five guided steps</h1>
          </div>
          <div className="text-sm text-slate-400">
            Tue - Sat, 9:00am - 6:00pm
            <br />
            123 Fade Street, Portland
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <section
          id="home-screen"
          className="grid gap-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Step 1 - Home</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Welcome to BarberShop</h2>
            <p className="mt-3 text-sm text-slate-300">
              Fresh fades, clean shaves, and friendly conversation. Book online and arrive right when your chair is ready.
            </p>

            <dl className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Location</dt>
                <dd className="mt-1 text-white">123 Fade Street, Portland</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Contact</dt>
                <dd className="mt-1">(503) 555-0199 - booking@barbershop.dev</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Hours</dt>
                <dd className="mt-1">Tuesday - Saturday, 9:00am to 6:00pm</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Walk-ins</dt>
                <dd className="mt-1">Limited. Reserve ahead to skip the wait.</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Next appointment</p>
              {confirmation ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-lg font-semibold text-white">{formatDateTime(confirmation.slot.start)}</p>
                  <p className="text-slate-300">
                    {confirmation.service.name} with {confirmation.barber?.name ?? 'our next available barber'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Confirmed - {confirmation.status}</p>
                </div>
              ) : nextAvailableQuery.isLoading ? (
                <p className="mt-3 text-sm text-slate-400">Checking the calendar...</p>
              ) : nextAvailableQuery.data ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-lg font-semibold text-white">{formatDateTime(nextAvailableQuery.data.slot.start)}</p>
                  <p className="text-slate-300">
                    Earliest opening for {nextAvailableQuery.data.service.name}
                  </p>
                  {nextAvailableQuery.data.slot.barberName ? (
                    <p className="text-xs text-slate-500">With {nextAvailableQuery.data.slot.barberName}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Select a service to preview the next available appointment.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Quick booking</p>
              <p className="mt-2 text-sm text-slate-300">{nextSteps}</p>
              <button
                type="button"
                onClick={handleQuickBook}
                disabled={servicesQuery.isLoading || services.length === 0}
                className={`mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-950 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  services.length > 0 && !servicesQuery.isLoading
                    ? 'bg-emerald-500 hover:bg-emerald-400 focus-visible:outline-emerald-300'
                    : 'cursor-not-allowed bg-slate-800 text-slate-400'
                }`}
              >
                Jump to service selection
              </button>
            </div>
          </div>
        </section>

        <section id="service-selection" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Step 2</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Service selection</h2>
              <p className="mt-1 text-sm text-slate-400">Browse by category and choose the experience you want.</p>
            </div>
            {servicesQuery.isLoading ? <span className="text-xs text-slate-400">Loading services...</span> : null}
          </div>

          <div className="mt-6 space-y-8">
            {servicesByCategory.map(({ category, services: categoryServices }) => (
              <div key={category} className="space-y-3">
                <h3 className="text-xs uppercase tracking-[0.25em] text-slate-500">{category}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => {
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
                          <h4 className="text-base font-semibold text-white">{service.name}</h4>
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
              </div>
            ))}

            {!servicesQuery.isLoading && servicesByCategory.length === 0 ? (
              <p className="text-sm text-slate-500">No services available yet. Add offerings to start booking.</p>
            ) : null}
          </div>
        </section>
        <section id="staff-selection" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Step 3</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Staff selection</h2>
              <p className="mt-1 text-sm text-slate-400">Pick your preferred barber or keep it flexible.</p>
            </div>
            {barbersQuery.isLoading && selectedServiceId ? (
              <span className="text-xs text-slate-400">Loading barbers...</span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              disabled={!selectedServiceId}
              onClick={() => handleBarberSelect(null)}
              className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                !selectedBarberId
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
              } ${!selectedServiceId ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <h3 className="text-base font-semibold text-white">Any barber</h3>
              <p className="mt-2 text-sm text-slate-400">We&apos;ll match you with the best fit based on availability.</p>
            </button>

            {barbers.map((barber) => {
              const isSelected = barber.id === selectedBarberId;
              return (
                <button
                  key={barber.id}
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => handleBarberSelect(barber)}
                  className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                  } ${!selectedServiceId ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <h3 className="text-base font-semibold text-white">{barber.name}</h3>
                  {barber.bio ? <p className="mt-2 text-sm text-slate-400">{barber.bio}</p> : null}
                  <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">
                    {barber.services.length} specialties
                  </p>
                </button>
              );
            })}
          </div>

          {!selectedServiceId ? (
            <p className="mt-4 text-sm text-slate-500">Choose a service to see which barbers are available.</p>
          ) : null}
        </section>
        <section id="time-selection" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Step 4</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Time slot selection</h2>
              <p className="mt-1 text-sm text-slate-400">Choose a date from the calendar to view available times.</p>
            </div>
            {selectedDate ? (
              <span className="text-xs text-slate-500">Viewing {formatDateLabel(selectedDate)}</span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.45fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pick a day</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {upcomingDays.map((day) => {
                  const isSelected = day.inputValue === selectedDate;
                  return (
                    <button
                      key={day.inputValue}
                      type="button"
                      disabled={!selectedServiceId}
                      onClick={() => {
                        setSelectedDate(day.inputValue);
                        setSelectedSlotId(null);
                        setConfirmation(null);
                      }}
                      className={`rounded-lg border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                      } ${!selectedServiceId ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      <span className="block text-xs uppercase tracking-[0.25em] text-slate-500">{day.weekdayLabel}</span>
                      <span className="mt-2 block text-lg font-semibold text-white">{day.dayNumber}</span>
                      <span className="text-xs text-slate-500">{day.monthLabel}</span>
                      {day.isToday ? (
                        <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.3em] text-emerald-300">Today</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block text-xs uppercase tracking-[0.25em] text-slate-500">
                Need another day?
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
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white">Available slots</h3>
                {availabilityQuery.isLoading ? <span className="text-xs text-slate-400">Loading...</span> : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {availabilityQuery.isLoading ? (
                  <span className="text-sm text-slate-400">Fetching availability.</span>
                ) : !selectedServiceId ? (
                  <span className="text-sm text-slate-400">Select a service to unlock availability.</span>
                ) : availability.length === 0 ? (
                  <span className="text-sm text-slate-400">No open slots for this day. Try another date.</span>
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
                        {slot.barberName ? <span className="text-xs text-slate-400">with {slot.barberName}</span> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
        <section id="booking-details" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Step 5</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Booking details &amp; confirmation</h2>
          <p className="mt-1 text-sm text-slate-400">Share your contact info so we can lock in your appointment.</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-sm font-semibold text-white">Review selection</h3>
              <dl className="mt-3 space-y-3 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Service</dt>
                  <dd className="mt-1">
                    {selectedService
                      ? `${selectedService.name} - ${formatPrice(selectedService.priceCents)} - ${selectedService.durationMinutes} min`
                      : 'Choose a service in Step 2.'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Barber</dt>
                  <dd className="mt-1">{selectedBarber?.name ?? selectedSlot?.barberName ?? 'Any barber'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Date &amp; time</dt>
                  <dd className="mt-1">
                    {selectedSlot
                      ? formatDateTime(selectedSlot.start)
                      : selectedServiceId
                      ? 'Select a time slot in Step 4.'
                      : 'Pick a service to view available times.'}
                  </dd>
                </div>
              </dl>
            </div>

            <form className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5" onSubmit={handleBookingSubmit}>
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
                  Booking confirmed for <span className="font-medium">{confirmation.clientName}</span>. We reserved the slot at{' '}
                  <span className="font-medium">
                    {describeSlot({
                      slotId: confirmation.slot.id,
                      barberId: confirmation.barber?.id ?? null,
                      barberName: confirmation.barber?.name ?? null,
                      start: confirmation.slot.start,
                      end: confirmation.slot.end,
                    })}
                  </span>{' '}
                  with {confirmation.barber?.name ?? 'our next available barber'}. Check Step 1 for a quick overview.
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
                {createAppointmentMutation.isPending ? 'Scheduling...' : 'Confirm appointment'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
