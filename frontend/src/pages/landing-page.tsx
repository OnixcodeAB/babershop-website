import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServicesQuery, useBarbersQuery, useNextAvailableQuery } from '../features/booking/queries';
import { Button, Card, SectionHeader } from '../shared/ui';
import { fetchAppointmentById } from '../shared/api/appointments';
import { formatDateTime, formatPrice } from '../shared/format';
import { GALLERY_ITEMS } from '../features/booking/lib/constants';
import { getBarberProfile, getAllKnownProfiles } from '../features/booking/lib';
import type { Barber } from '../entities/barber';

const HIGHLIGHT_SERVICE_NAMES = ['Classic Cut', 'Beard Trim'];

const SOCIAL_PROOF = [
  { quote: '“Best fade in the city. Booked online, walked right in.”', author: 'Marcus R.' },
  { quote: '“They remembered my style from last time. Five stars.”', author: 'Luis G.' },
];

const CONTACT_DETAILS = {
  address: '123 Fade Street, Portland, OR',
  phone: '(503) 555-0199',
  email: 'booking@barbershop.dev',
  hours: 'Tue – Sat · 9:00 AM – 6:00 PM',
  parking: 'Free street parking after 5 PM · Garage across the street',
};

function buildTeamShowcase(apiBarbers: Barber[]) {
  if (apiBarbers.length >= 3) {
    return apiBarbers.slice(0, 3);
  }

  const filled = [...apiBarbers];
  const knownProfiles = getAllKnownProfiles();

  Object.entries(knownProfiles).forEach(([id, profile]) => {
    if (filled.length >= 3) {
      return;
    }
    const alreadyIncluded = filled.some((barber) => barber.id === id);
    if (alreadyIncluded) {
      return;
    }
    filled.push({
      id,
      name: id
        .replace('barber-', '')
        .split('-')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' '),
      bio: profile.bioHighlight,
      photoUrl: null,
      services: [],
    });
  });

  return filled.slice(0, 3);
}

export function LandingPage() {
  const navigate = useNavigate();
  const servicesQuery = useServicesQuery();
  const services = servicesQuery.data ?? [];

  const [referenceInput, setReferenceInput] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading'>('idle');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const heroServices = useMemo(() => {
    const matches = HIGHLIGHT_SERVICE_NAMES.map((name) => services.find((service) => service.name === name)).filter(
      Boolean,
    ) as typeof services;
    if (matches.length === 0) {
      return services.slice(0, 2);
    }
    return matches.slice(0, 2);
  }, [services]);

  const primaryService = heroServices[0] ?? services[0] ?? null;
  const nextAvailableQuery = useNextAvailableQuery(primaryService ?? null, 1);
  const nextSlot = nextAvailableQuery.data?.[0]?.slots[0] ?? null;

  const barbersQuery = useBarbersQuery(null);
  const barbers = barbersQuery.data ?? [];
  const teamShowcase = buildTeamShowcase(barbers);

  const handleNavigateToBooking = (params: Record<string, string | undefined> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    navigate({ pathname: '/book', search: searchParams.toString() });
  };

  const handleReferenceInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReferenceInput(event.target.value);
    if (lookupError) {
      setLookupError(null);
    }
  };

  const handleReferenceLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = referenceInput.trim();
    if (!trimmed) {
      setLookupError('Enter your booking reference.');
      return;
    }
    const normalized = trimmed.replace(/\s+/g, '');

    setLookupStatus('loading');
    setLookupError(null);

    try {
      const appointment = await fetchAppointmentById(normalized);
      setReferenceInput('');
      navigate('/booking/confirmation', { state: { confirmation: appointment } });
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status ?? null;
      if (status === 404) {
        setLookupError('We could not find a booking with that reference. Double-check the code and try again.');
      } else {
        setLookupError('We could not look up your booking. Please try again in a moment.');
      }
    } finally {
      setLookupStatus('idle');
    }
  };

  const isLookupLoading = lookupStatus === 'loading';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900/60 bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-900/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Portland&apos;s precision barbershop</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Walk in confident. Book your chair in seconds.
            </h1>
            <p className="text-base text-slate-300">
              Reserve with a tap, arrive when your chair is ready. Fades, beards, color, and signature straight-razor shaves—crafted by
              barbers who know your style.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => handleNavigateToBooking({})}>
                Book now
              </Button>
              <Button variant="secondary" onClick={() => handleNavigateToBooking({ step: 'time' })}>
                Reserve a time
              </Button>
            </div>
            {heroServices.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                {heroServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleNavigateToBooking({ service: service.id })}
                    className="rounded-full border border-emerald-500/50 px-4 py-2 text-xs uppercase tracking-[0.25em] text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100"
                  >
                    Book {service.name}
                  </button>
                ))}
              </div>
            ) : null}
            {nextSlot ? (
              <p className="text-xs text-emerald-300">
                Next opening: {formatDateTime(nextSlot.start)} {nextSlot.barberName ? `· ${nextSlot.barberName}` : ''}
              </p>
            ) : null}
          </div>
          <Card className="w-full max-w-md border-emerald-500/20 bg-slate-950/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Social proof</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="text-4xl font-semibold text-white">4.9</div>
              <div>
                <p className="text-sm text-slate-300">Average rating</p>
                <p className="text-xs text-slate-500">Over 1,200 verified visits</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {SOCIAL_PROOF.map((item) => (
                <blockquote key={item.author} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <p>{item.quote}</p>
                  <footer className="mt-2 text-xs text-slate-500">{item.author}</footer>
                </blockquote>
              ))}
            </div>
          </Card>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-16">
        <section className="space-y-8">
          <SectionHeader
            eyebrow="Gallery"
            title="Fresh cuts &amp; clean shaves"
            description="Before and after snapshots from the chair. Scroll for inspiration, tap to book the look."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY_ITEMS.map((item) => (
              <div
                key={item.title}
                className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br ${item.accent} p-6 shadow-[0_15px_40px_rgba(15,23,42,0.45)]`}
              >
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-200/80">{item.description}</p>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full border border-emerald-500/30 bg-emerald-500/10 blur-2xl"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeader
            eyebrow="Team"
            title="Top barbers, zero guesswork"
            description="Handpicked specialists for fades, color, and beard work. Meet the crew before you book."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamShowcase.map((barber) => {
              const profile = getBarberProfile(barber);
              return (
                <Card key={barber.id} className="flex h-full flex-col justify-between border-slate-800 bg-slate-950/60 p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                        {profile.specialties.slice(0, 3).join(' • ')}
                      </p>
                    </div>
                    <p className="text-sm text-slate-400">{profile.bioHighlight}</p>
                    <p className="text-xs text-slate-500">
                      {profile.experienceYears} yrs • Speaks {profile.languages.join('/')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4 justify-start text-xs uppercase tracking-[0.25em]"
                    onClick={() => handleNavigateToBooking({ step: 'staff', barber: barber.id })}
                  >
                    Book with {barber.name}
                  </Button>
                </Card>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleNavigateToBooking({ step: 'staff' })}>Meet the team</Button>
            <Button variant="secondary" onClick={() => handleNavigateToBooking({})}>
              Reserve a time
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <SectionHeader
            eyebrow="Lookup"
            title="Find your booking"
            description="Enter your booking reference to review or update your appointment."
          />
          <form className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleReferenceLookup}>
            <div className="text-left">
              <label className="text-xs uppercase tracking-[0.25em] text-emerald-300" htmlFor="booking-reference">
                Booking reference
              </label>
              <input
                id="booking-reference"
                name="bookingReference"
                value={referenceInput}
                onChange={handleReferenceInputChange}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Example: BK-12345"
                disabled={isLookupLoading}
                autoComplete="off"
              />
              {lookupError ? (
                <p className="mt-2 text-xs text-red-400">{lookupError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Use the reference we emailed after your booking.</p>
              )}
            </div>
            <div className="flex items-end">
              <Button type="submit" size="lg" disabled={isLookupLoading}>
                {isLookupLoading ? 'Searching...' : 'Find booking'}
              </Button>
            </div>
          </form>
        </section>
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-800 bg-slate-950/60 p-6">
            <SectionHeader
              eyebrow="Visit"
              title="Plan your appointment"
              description="Easy parking, great coffee next door, and enough outlets for laptop work while you wait."
            />
            <dl className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Hours</dt>
                <dd className="mt-1 text-white">{CONTACT_DETAILS.hours}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Contact</dt>
                <dd className="mt-1">{CONTACT_DETAILS.phone} · {CONTACT_DETAILS.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Address</dt>
                <dd className="mt-1 text-white">{CONTACT_DETAILS.address}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Parking</dt>
                <dd className="mt-1 text-slate-200">{CONTACT_DETAILS.parking}</dd>
              </div>
            </dl>
          </Card>
          <div className="h-72 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Map</p>
            <div className="mt-4 flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-sm text-slate-500">
              Interactive map coming soon — we&apos;re on the corner of Fade &amp; Main.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <h2 className="text-3xl font-semibold text-white">Ready for a fresh look?</h2>
          <p className="mt-3 text-sm text-slate-300">
            Tap below to jump straight into the booking flow. We&apos;ll hold your chair, you just show up.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => handleNavigateToBooking({})}>
              Start your booking
            </Button>
            <Button variant="secondary" onClick={() => handleNavigateToBooking({ service: primaryService?.id })}>
              Pick a service first
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/50 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BarberShop. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button type="button" className="text-xs uppercase tracking-[0.25em] text-emerald-300" onClick={() => handleNavigateToBooking({})}>
              Book now
            </button>
            <span>{CONTACT_DETAILS.phone}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}







