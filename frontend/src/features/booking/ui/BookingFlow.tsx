import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Service } from '../../../entities/service';
import type { Barber } from '../../../entities/barber';
import type { AvailabilitySlot } from '../../../entities/slot';
import { useBookingActions, useBookingState } from '../hooks';
import {
  useServicesQuery,
  useBarbersQuery,
  useAvailabilityQuery,
  useNextAvailableQuery,
  useCreateAppointmentMutation,
} from '../queries';
import {
  buildUpcomingDays,
  describeSlot,
  categorizeService,
  getBarberProfile,
} from '../lib';
import { selectClientFields, selectIsReadyToSubmit, selectNextSteps } from '../model';
import { NextAvailableWidget, QuickBookingWidget, DayGrid, SlotList, ReviewPanel } from '../widgets';
import { ServiceCard } from '../components';
import { Button, Card } from '../../../shared/ui';
import { formatDateLabel, formatDateTime } from '../../../shared/format';
import type { BarberProfile } from '../lib/barber-profiles';
import type { NextAvailableResult } from '../queries/useNextAvailableQuery';
import type { BarberSelectionMode } from '../types';

const STEP_DEFINITIONS = [
  { id: 'service', label: 'Service', helper: 'Pick the cut, shave, or treatment you need.' },
  { id: 'staff', label: 'Barber', helper: 'Choose your pro—or let us match you.' },
  { id: 'time', label: 'Time', helper: 'Lock the slot that fits your schedule.' },
  { id: 'details', label: 'Details', helper: 'Add your info and confirm the booking.' },
] as const;

type StepId = (typeof STEP_DEFINITIONS)[number]['id'];

type SortOrder = 'recommended' | 'soonest' | 'experience';

const SPECIALTY_OPTIONS = ['Fades', 'Beards', 'Color', 'Hot towel', 'Kids'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French'];
const VIBE_OPTIONS = ['Classic', 'Modern'];
const PRICE_OPTIONS = ['$', '$$', '$$$'];

function isStepId(value: string | null): value is StepId {
  return value === 'service' || value === 'staff' || value === 'time' || value === 'details';
}

function toggleFilter(values: string[], value: string) {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

function formatShortDateTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSoonestSlot(slots: AvailabilitySlot[] | undefined) {
  if (!slots || slots.length === 0) {
    return null;
  }
  return [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
}

function getNextTwoSuggestions(results: NextAvailableResult[], currentDate: string) {
  return results
    .filter((result) => result.date !== currentDate)
    .slice(0, 2);
}

type StaffFilters = {
  specialties: string[];
  language: string;
  vibe: string;
  price: string;
};

const initialFilters: StaffFilters = {
  specialties: [],
  language: 'all',
  vibe: 'all',
  price: 'all',
};
export function BookingFlow() {
  const state = useBookingState();
  const actions = useBookingActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState<StepId>('service');
  const [filters, setFilters] = useState<StaffFilters>(initialFilters);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recommended');
  const [bioPreview, setBioPreview] = useState<Barber | null>(null);
  const hasHydratedParams = useRef(false);
  const serviceHydratedRef = useRef<string | null>(null);

  const servicesQuery = useServicesQuery();
  const services = servicesQuery.data ?? [];
  const defaultService = services[0] ?? null;

  useEffect(() => {
    if (hasHydratedParams.current) {
      return;
    }
    if (servicesQuery.isLoading) {
      return;
    }

    const serviceParam = searchParams.get('service');
    if (serviceParam && services.some((service) => service.id === serviceParam)) {
      actions.selectService(serviceParam);
      serviceHydratedRef.current = serviceParam;
    }

    const barberParam = searchParams.get('barber');
    if (barberParam === 'any') {
      actions.selectAnyBarber();
    } else if (barberParam) {
      actions.selectSpecificBarber(barberParam);
    }

    const dateParam = searchParams.get('date');
    if (dateParam) {
      actions.setDate(dateParam);
    }

    const slotParam = searchParams.get('slot');
    if (slotParam) {
      actions.selectSlot(slotParam);
    }

    const stepParam = searchParams.get('step');
    if (isStepId(stepParam)) {
      setActiveStep(stepParam);
    }

    hasHydratedParams.current = true;
  }, [searchParams, services, servicesQuery.isLoading, actions]);

  const selectedService = useMemo(() => {
    if (!state.serviceId) {
      return null;
    }
    return services.find((service) => service.id === state.serviceId) ?? null;
  }, [services, state.serviceId]);

  const barbersQuery = useBarbersQuery(state.serviceId);
  const supportingBarbers = barbersQuery.data ?? [];

  const availabilityQuery = useAvailabilityQuery(
    state.serviceId,
    state.barberSelectionMode === 'specific' ? state.barberId : null,
    state.date,
  );
  const availability = availabilityQuery.data ?? [];

  const slotsByBarber = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    availability.forEach((slot) => {
      if (!slot.barberId) {
        return;
      }
      const current = map.get(slot.barberId) ?? [];
      current.push(slot);
      map.set(slot.barberId, current);
    });
    return map;
  }, [availability]);

  const nextAvailableQuery = useNextAvailableQuery(selectedService ?? defaultService, 3);
  const nextAvailableResults = nextAvailableQuery.data ?? [];

  useEffect(() => {
    if (!hasHydratedParams.current) {
      return;
    }
    const params = new URLSearchParams();
    if (state.serviceId) {
      params.set('service', state.serviceId);
    }
    if (state.barberSelectionMode === 'any') {
      params.set('barber', 'any');
    } else if (state.barberSelectionMode === 'specific' && state.barberId) {
      params.set('barber', state.barberId);
    }
    if (state.date) {
      params.set('date', state.date);
    }
    if (state.slotId) {
      params.set('slot', state.slotId);
    }
    params.set('step', activeStep);

    const nextSearchString = params.toString();
    if (nextSearchString !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [state.serviceId, state.barberSelectionMode, state.barberId, state.date, state.slotId, activeStep, searchParams, setSearchParams]);
  useEffect(() => {
    if (!selectedService) {
      return;
    }
    if (supportingBarbers.length === 1) {
      const singleBarber = supportingBarbers[0];
      if (!(state.barberSelectionMode === 'specific' && state.barberId === singleBarber.id)) {
        actions.selectSpecificBarber(singleBarber.id);
      }
    }
    if (supportingBarbers.length > 1 && state.barberSelectionMode === 'specific') {
      const stillValid = supportingBarbers.some((barber) => barber.id === state.barberId);
      if (!stillValid) {
        actions.clearBarberSelection();
      }
    }
  }, [selectedService, supportingBarbers, state.barberSelectionMode, state.barberId, actions]);

  useEffect(() => {
    if (!selectedService) {
      setActiveStep('service');
      return;
    }
    if (serviceHydratedRef.current !== state.serviceId) {
      const targetStep = 'staff';
      setActiveStep(targetStep);
      serviceHydratedRef.current = state.serviceId ?? null;
    }
  }, [selectedService, supportingBarbers.length, state.serviceId]);

  const staffStepVisible = Boolean(selectedService) && supportingBarbers.length > 0;

  const visibleSteps = useMemo(() => {
    return STEP_DEFINITIONS;
  }, [staffStepVisible]);

  useEffect(() => {
    if (!visibleSteps.some((step) => step.id === activeStep)) {
      const fallbackStep = visibleSteps[visibleSteps.length - 1]?.id ?? 'service';
      setActiveStep(fallbackStep);
    }
  }, [visibleSteps, activeStep]);

  const activeIndex = visibleSteps.findIndex((step) => step.id === activeStep);
  const progressPercent = visibleSteps.length > 0 ? ((activeIndex + 1) / visibleSteps.length) * 100 : 0;

  const nextStepsCopy = selectNextSteps(state, {
    hasBarberOptions: supportingBarbers.length > 1,
  });

  const clientFields = selectClientFields(state);
  const createAppointmentMutation = useCreateAppointmentMutation();
  const readyToSubmit = selectIsReadyToSubmit(state) && !createAppointmentMutation.isPending;

  const slotsForSelectedBarber =
    state.barberSelectionMode === 'specific' && state.barberId
      ? slotsByBarber.get(state.barberId) ?? []
      : availability;

  const serviceGroups = useMemo(() => {
    if (services.length === 0) {
      return [] as { category: string; services: Service[] }[];
    }
    const categoryOrder = ['Haircuts', 'Beard Care', 'Shaves', 'Color', 'Other Services'];
    const grouped = new Map<string, Service[]>();
    services.forEach((service) => {
      const category = categorizeService(service);
      const bucket = grouped.get(category) ?? [];
      bucket.push(service);
      grouped.set(category, bucket);
    });
    return Array.from(grouped.entries())
      .map(([category, bucket]) => ({
        category,
        services: [...bucket].sort((a, b) => a.name.localeCompare(b.name)),
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

  const upcomingDays = useMemo(() => buildUpcomingDays(14), []);

  const filteredBarbers = useMemo(() => {
    if (!selectedService) {
      return [] as Barber[];
    }

    return supportingBarbers
      .filter((barber) => {
        const profile = getBarberProfile(barber);
        if (
          filters.specialties.length > 0 &&
          !filters.specialties.every((tag) => profile.specialties.some((item) => item.toLowerCase() === tag.toLowerCase()))
        ) {
          return false;
        }
        if (filters.language !== 'all' && !profile.languages.includes(filters.language)) {
          return false;
        }
        if (filters.vibe !== 'all' && profile.vibe.toLowerCase() !== filters.vibe.toLowerCase()) {
          return false;
        }
        if (filters.price !== 'all' && profile.priceBand !== filters.price) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const profileA = getBarberProfile(a);
        const profileB = getBarberProfile(b);
        if (sortOrder === 'recommended') {
          if (profileA.rating !== profileB.rating) {
            return profileB.rating - profileA.rating;
          }
          return profileB.experienceYears - profileA.experienceYears;
        }
        if (sortOrder === 'experience') {
          if (profileA.experienceYears !== profileB.experienceYears) {
            return profileB.experienceYears - profileA.experienceYears;
          }
          return profileB.rating - profileA.rating;
        }
        const slotA = getSoonestSlot(slotsByBarber.get(a.id));
        const slotB = getSoonestSlot(slotsByBarber.get(b.id));
        if (slotA && slotB) {
          return new Date(slotA.start).getTime() - new Date(slotB.start).getTime();
        }
        if (slotA) {
          return -1;
        }
        if (slotB) {
          return 1;
        }
        return profileB.rating - profileA.rating;
      });
  }, [filters, sortOrder, selectedService, slotsByBarber, supportingBarbers]);

  const selectedBarberEntity =
    state.barberSelectionMode === 'specific' && state.barberId
      ? supportingBarbers.find((barber) => barber.id === state.barberId) ?? null
      : null;

  const selectedSlot = useMemo(() => {
    if (!state.slotId) {
      return null;
    }
    const directMatch = availability.find((slot) => slot.slotId === state.slotId);
    if (directMatch) {
      return directMatch;
    }
    for (const slotList of slotsByBarber.values()) {
      const found = slotList.find((slot) => slot.slotId === state.slotId);
      if (found) {
        return found;
      }
    }
    return null;
  }, [availability, slotsByBarber, state.slotId]);

  const recommendation = useMemo(() => {
    const featuredBarber = filteredBarbers[0] ?? supportingBarbers[0] ?? null;
    if (!featuredBarber) {
      return null;
    }
    const profile = getBarberProfile(featuredBarber);
    const nextSlot = getSoonestSlot(slotsByBarber.get(featuredBarber.id));
    return {
      barber: featuredBarber,
      profile,
      nextSlot,
    };
  }, [filteredBarbers, supportingBarbers, slotsByBarber]);

  const noMatchingBarbers = selectedService && filteredBarbers.length === 0 && supportingBarbers.length > 0;
  const allFullyBooked =
    selectedService && filteredBarbers.length > 0 && filteredBarbers.every((barber) => (slotsByBarber.get(barber.id) ?? []).length === 0);

  const nearestSuggestions = getNextTwoSuggestions(nextAvailableResults, state.date);
  const handleServiceSelect = (serviceId: string) => {
    actions.selectService(serviceId);
    setFilters(initialFilters);
    setSortOrder('recommended');
  };

  const handleAnyBarber = () => {
    actions.selectAnyBarber();
    setActiveStep('time');
  };

  const handleSpecificBarber = (barberId: string) => {
    actions.selectSpecificBarber(barberId);
  };

  const handleDateSelect = (dateValue: string) => {
    actions.setDate(dateValue);
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    if (slot.barberId) {
      actions.selectSpecificBarber(slot.barberId);
    }
    actions.selectSlot(slot.slotId, slot.barberId ?? state.barberId ?? null);
  };

  const handleQuickBook = () => {
    const quickService = selectedService ?? defaultService;
    if (!quickService) {
      return;
    }
    actions.selectService(quickService.id);
    const earliest = nextAvailableResults[0]?.slots[0];
    if (earliest) {
      actions.setDate(earliest.start.split('T')[0]);
      if (earliest.barberId) {
        actions.selectSpecificBarber(earliest.barberId);
      } else {
        actions.selectAnyBarber();
      }
      actions.selectSlot(earliest.slotId, earliest.barberId ?? null);
      setActiveStep('details');
    } else {
      setActiveStep('time');
    }
  };

  const handleBookingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!readyToSubmit || !state.serviceId || !state.slotId) {
      return;
    }

    createAppointmentMutation.mutate(
      {
        clientName: state.clientName,
        clientEmail: state.clientEmail || undefined,
        clientPhone: state.clientPhone || undefined,
        notes: state.notes || undefined,
        serviceId: state.serviceId,
        slotId: state.slotId,
      },
      {
        onSuccess: (confirmation) => {
          actions.confirm(confirmation);
        },
      },
    );
  };

  const handleClientFieldChange = (field: 'clientName' | 'clientEmail' | 'clientPhone' | 'notes') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      actions.changeClientField(field, event.target.value);

  const goToStep = (stepId: StepId) => {
    const stepExists = visibleSteps.some((step) => step.id === stepId);
    if (!stepExists) {
      return;
    }
    const targetIndex = visibleSteps.findIndex((step) => step.id === stepId);
    if (targetIndex <= activeIndex) {
      setActiveStep(stepId);
    }
  };

  const goToPrevious = () => {
    if (activeIndex <= 0) {
      return;
    }
    setActiveStep(visibleSteps[activeIndex - 1].id);
  };

  const goToNext = () => {
    if (activeIndex >= visibleSteps.length - 1) {
      return;
    }
    const nextStep = visibleSteps[activeIndex + 1].id;
    setActiveStep(nextStep);
  };

  const specialtySelected = (value: string) => filters.specialties.includes(value);

  const continueDisabled = () => {
    if (activeStep === 'service') {
      return !state.serviceId;
    }
    if (activeStep === 'staff') {
      return state.barberSelectionMode === 'unselected';
    }
    if (activeStep === 'time') {
      return !state.slotId;
    }
    return false;
  };

  const continueLabel = () => {
    if (activeStep === 'service') {
      return 'Continue to barber selection';
    }
    if (activeStep === 'staff') {
      return state.slotId ? 'Continue to details' : 'Continue to time';
    }
    if (activeStep === 'time') {
      return 'Continue to details';
    }
    return 'Review & confirm';
  };

  const stepMeta = STEP_DEFINITIONS.find((step) => step.id === activeStep);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900/60 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">BarberShop</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Book your experience in just a few steps</h1>
          </div>
          <div className="text-sm text-slate-400 text-right">
            Tue – Sat · 9:00 AM – 6:00 PM
            <br />
            123 Fade Street, Portland
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="rounded-2xl border border-slate-900/60 bg-slate-900/40 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Progress</p>
                <h2 className="text-lg font-semibold text-white">{stepMeta?.label ?? 'Booking'}</h2>
                <p className="text-xs text-slate-400">{stepMeta?.helper}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Step {activeIndex + 1} of {visibleSteps.length}
              </p>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {visibleSteps.map((step, index) => {
                const isActive = step.id === activeStep;
                const isComplete = index < activeIndex;
                return (
                  <button
                    type="button"
                    key={step.id}
                    className={`rounded-full border px-3 py-1 tracking-[0.2em] transition ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : isComplete
                        ? 'border-emerald-400/40 text-emerald-300 hover:border-emerald-400/60'
                        : 'border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                    onClick={() => goToStep(step.id)}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-10">
            {activeStep === 'service' ? (
              <Card className="border-slate-900/50 bg-slate-950/60 p-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">1. Choose your service</h3>
                    <p className="text-sm text-slate-400">
                      Start with the cut, shave, or treatment you want. We'll tailor every next step to your choice.
                    </p>
                  </div>
                  {servicesQuery.isLoading ? (
                    <p className="text-sm text-slate-400">Loading services...</p>
                  ) : services.length === 0 ? (
                    <p className="text-sm text-slate-400">Services are loading—check back in just a moment.</p>
                  ) : null}
                  <div className="space-y-8">
                    {serviceGroups.map(({ category, services: categoryServices }) => (
                      <div key={category} className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.25em] text-slate-500">{category}</h4>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {categoryServices.map((service) => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              selected={service.id === state.serviceId}
                              onClick={() => handleServiceSelect(service.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 border-t border-slate-900/60 pt-4">
                    <Button variant="secondary" onClick={goToNext} disabled={continueDisabled()}>
                      {continueLabel()}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
            {activeStep === 'staff' ? (
              <Card className="border-slate-900/50 bg-slate-950/60 p-6">
                <div className="space-y-6">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">2. Choose your barber</h3>
                      <p className="text-sm text-slate-400">
                        Filter by specialty, language, or vibe. Prefer to skip? Keep "Any barber" for the fastest match.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={state.barberSelectionMode === 'any' ? 'primary' : 'secondary'}
                        onClick={handleAnyBarber}
                      >
                        Any barber works
                      </Button>
                      <select
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="recommended">Sort: Recommended</option>
                        <option value="soonest">Sort: Soonest openings</option>
                        <option value="experience">Sort: Most experienced</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-900/60 bg-slate-900/40 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {SPECIALTY_OPTIONS.map((option) => {
                        const selected = specialtySelected(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, specialties: toggleFilter(prev.specialties, option) }))}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              selected
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>Language:</span>
                      {['all', ...LANGUAGE_OPTIONS].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, language: option }))}
                          className={`rounded-full border px-3 py-1 transition ${
                            filters.language === option
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {option === 'all' ? 'Any' : option}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>Vibe:</span>
                      {['all', ...VIBE_OPTIONS].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, vibe: option }))}
                          className={`rounded-full border px-3 py-1 transition ${
                            filters.vibe === option
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {option === 'all' ? 'Any' : option}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>Price:</span>
                      {['all', ...PRICE_OPTIONS].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, price: option }))}
                          className={`rounded-full border px-3 py-1 transition ${
                            filters.price === option
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {option === 'all' ? 'Any' : option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {noMatchingBarbers ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      No barbers match those filters right now.
                      <button
                        type="button"
                        className="ml-2 text-xs uppercase tracking-[0.25em] text-amber-100 underline"
                        onClick={() => setFilters(initialFilters)}
                      >
                        Clear filters
                      </button>
                      <p className="mt-2 text-xs text-amber-100/80">
                        Choosing "Any barber" guarantees the quickest match.
                      </p>
                    </div>
                  ) : null}

                  {filteredBarbers.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {filteredBarbers.map((barber) => {
                        const profile = getBarberProfile(barber);
                        const barberSlots = slotsByBarber.get(barber.id) ?? [];
                        const isSelected = state.barberSelectionMode === 'specific' && state.barberId === barber.id;
                        const soonestSlot = getSoonestSlot(barberSlots);
                        return (
                          <div
                            key={barber.id}
                            className={`flex h-full flex-col justify-between rounded-xl border p-5 transition ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                                : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-lg font-semibold text-white">{barber.name}</h4>
                                  <p className="text-xs text-slate-400">
                                    {profile.experienceYears} yrs • Speaks {profile.languages.join('/')}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.25em] ${
                                    barberSlots.length > 0 ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {barberSlots.length > 0 ? 'Has openings' : 'Waitlist only'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                {profile.specialties.slice(0, 4).map((tag) => (
                                  <span key={tag} className="rounded-full border border-slate-700 px-2 py-1">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-sm text-slate-400">{profile.bioHighlight}</p>
                            </div>
                            <div className="mt-4 space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {barberSlots.slice(0, 3).map((slot) => (
                                  <button
                                    key={slot.slotId}
                                    type="button"
                                    onClick={() => {
                                      handleSpecificBarber(barber.id);
                                      actions.setDate(slot.start.split('T')[0]);
                                      actions.selectSlot(slot.slotId, barber.id);
                                      setActiveStep('time');
                                    }}
                                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
                                  >
                                    {formatShortDateTime(slot.start)}
                                  </button>
                                ))}
                                {barberSlots.length === 0 ? (
                                  <span className="text-xs text-slate-500">No openings for {formatDateLabel(state.date)}.</span>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <Button variant={isSelected ? 'primary' : 'secondary'} onClick={() => handleSpecificBarber(barber.id)}>
                                  {isSelected ? 'Selected' : 'Choose barber'}
                                </Button>
                                <button
                                  type="button"
                                  className="text-xs uppercase tracking-[0.25em] text-emerald-300 underline"
                                  onClick={() => setBioPreview(barber)}
                                >
                                  View bio & gallery
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {allFullyBooked ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
                      Every barber is booked for {formatDateLabel(state.date)}. Try one of these nearby openings:
                      <div className="mt-3 flex flex-wrap gap-2">
                        {nearestSuggestions.length > 0 ? (
                          nearestSuggestions.map((suggestion) => (
                            <Button
                              key={suggestion.date}
                              variant="secondary"
                              onClick={() => {
                                actions.setDate(suggestion.date);
                                const firstSlot = suggestion.slots[0];
                                if (firstSlot?.barberId) {
                                  actions.selectSpecificBarber(firstSlot.barberId);
                                  actions.selectSlot(firstSlot.slotId, firstSlot.barberId);
                                }
                                setActiveStep('time');
                              }}
                            >
                              {formatDateLabel(suggestion.date)} · {formatShortDateTime(suggestion.slots[0].start)}
                            </Button>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">We're opening more slots shortly.</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 border-t border-slate-900/60 pt-4">
                    <Button variant="secondary" onClick={goToPrevious}>
                      Back
                    </Button>
                    <Button onClick={() => (!continueDisabled() ? goToNext() : undefined)} disabled={continueDisabled()}>
                      {continueLabel()}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
            {activeStep === 'time' ? (
              <Card className="border-slate-900/50 bg-slate-950/60 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{staffStepVisible ? '3. Pick your time' : '2. Pick your time'}</h3>
                    <p className="text-sm text-slate-400">Choose the day and slot that fits. We'll hold the chair for you.</p>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[3fr]">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Select a day</h4>
                      <DayGrid days={upcomingDays} selectedDate={state.date} onSelect={handleDateSelect} />
                      <p className="text-xs text-slate-500">Showing availability for {formatDateLabel(state.date)}.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Available times</h4>
                      {availabilityQuery.isLoading ? (
                        <p className="text-sm text-slate-400">Fetching open slots...</p>
                      ) : slotsForSelectedBarber.length === 0 ? (
                        <div className="text-sm text-slate-400">
                          No openings on {formatDateLabel(state.date)}. Try another day or tap a suggested slot above.
                        </div>
                      ) : (
                        <SlotList
                          slots={slotsForSelectedBarber}
                          selectedSlotId={state.slotId}
                          onSelect={(slot) => handleSlotSelect(slot)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 border-t border-slate-900/60 pt-4">
                    <Button variant="secondary" onClick={goToPrevious}>
                      Back
                    </Button>
                    <Button onClick={() => (!continueDisabled() ? goToNext() : undefined)} disabled={continueDisabled()}>
                      {continueLabel()}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
            {activeStep === 'details' ? (
              <Card className="border-slate-900/50 bg-slate-950/60 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Finalize your appointment</h3>
                    <p className="text-sm text-slate-400">Double-check the summary, add your info, and we'll take care of the rest.</p>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
                    <ReviewPanel
                      service={selectedService}
                      barber={selectedBarberEntity}
                      slot={selectedSlot}
                    />
                    <form className="grid gap-4 rounded-xl border border-slate-900/60 bg-slate-900/40 p-5" onSubmit={handleBookingSubmit}>
                      <div>
                        <label className="text-sm text-slate-300" htmlFor="clientName">
                          Full name <span className="text-emerald-300">*</span>
                        </label>
                        <input
                          id="clientName"
                          name="clientName"
                          required
                          value={clientFields.clientName}
                          onChange={handleClientFieldChange('clientName')}
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
                          value={clientFields.clientEmail}
                          onChange={handleClientFieldChange('clientEmail')}
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
                          value={clientFields.clientPhone}
                          onChange={handleClientFieldChange('clientPhone')}
                          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          placeholder="(503) 555-0199"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300" htmlFor="notes">
                          Notes for your barber
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={clientFields.notes}
                          onChange={handleClientFieldChange('notes')}
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

                      {state.confirmation ? (
                        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                          Booking confirmed for <span className="font-medium">{state.confirmation.clientName}</span>. We reserved the slot at{' '}
                          <span className="font-medium">{formatDateTime(state.confirmation.slot.start)}</span> with{' '}
                          {state.confirmation.barber?.name ?? 'our next available barber'}.
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap gap-3">
                        <Button variant="secondary" type="button" onClick={goToPrevious}>
                          Back
                        </Button>
                        <Button type="submit" disabled={!readyToSubmit}>
                          {createAppointmentMutation.isPending ? 'Scheduling...' : 'Confirm appointment'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <NextAvailableWidget
              confirmation={state.confirmation}
              isLoading={nextAvailableQuery.isLoading}
              nextAvailable={nextAvailableResults}
            />
            <QuickBookingWidget
              nextSteps={nextStepsCopy}
              onQuickBook={handleQuickBook}
              disabled={servicesQuery.isLoading || services.length === 0}
              highlight={nextAvailableResults[0]?.slots[0]
                ? {
                    start: nextAvailableResults[0].slots[0].start,
                    serviceName: nextAvailableResults[0].service.name,
                    barberName: nextAvailableResults[0].slots[0].barberName,
                  }
                : null}
            />
            {recommendation ? (
              <Card className="border-slate-900/50 bg-slate-950/60 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Best match</p>
                <h4 className="mt-3 text-lg font-semibold text-white">{recommendation.barber.name}</h4>
                <p className="text-sm text-slate-400">
                  {recommendation.profile.specialties.slice(0, 3).join(' • ')} · {recommendation.profile.experienceYears} yrs experience · Rating{' '}
                  {recommendation.profile.rating.toFixed(1)}
                </p>
                {recommendation.nextSlot ? (
                  <p className="mt-2 text-sm text-emerald-200">Next opening {formatDateTime(recommendation.nextSlot.start)}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Currently fully booked—try a different day.</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      handleSpecificBarber(recommendation.barber.id);
                      if (recommendation.nextSlot) {
                        actions.setDate(recommendation.nextSlot.start.split('T')[0]);
                        actions.selectSlot(recommendation.nextSlot.slotId, recommendation.barber.id);
                        setActiveStep('time');
                      } else {
                        setActiveStep('time');
                      }
                    }}
                  >
                    Book {recommendation.barber.name}
                  </Button>
                  <Button variant="ghost" onClick={() => setBioPreview(recommendation.barber)}>
                    Preview bio
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </section>
      </main>

      {bioPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 py-10">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-950/90 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Barber spotlight</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{bioPreview.name}</h3>
              </div>
              <button
                type="button"
                className="text-sm text-slate-400 hover:text-slate-200"
                onClick={() => setBioPreview(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>{getBarberProfile(bioPreview).bioHighlight}</p>
              {bioPreview.bio ? <p className="text-slate-400">{bioPreview.bio}</p> : null}
              <p className="text-xs text-slate-500">
                Specialties: {getBarberProfile(bioPreview).specialties.join(', ')}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => {
                  handleSpecificBarber(bioPreview.id);
                  setBioPreview(null);
                  setActiveStep('time');
                }}
              >
                Select {bioPreview.name}
              </Button>
              <Button variant="secondary" onClick={() => setBioPreview(null)}>
                Maybe later
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}









