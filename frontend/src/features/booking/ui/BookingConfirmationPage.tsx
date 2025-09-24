import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { AppointmentConfirmation } from '../../../entities/appointment';
import { useBookingActions, useBookingState } from '../hooks';
import { Button, Card } from '../../../shared/ui';
import { formatDateLabel, formatDateTime, formatTimeRange } from '../../../shared/format';

type BookingConfirmationLocationState = {
  confirmation?: AppointmentConfirmation;
};

export function BookingConfirmationPage() {
  const { confirmation: confirmationFromStore } = useBookingState();
  const actions = useBookingActions();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as BookingConfirmationLocationState | null;
  const confirmationFromLocation = locationState?.confirmation;
  const confirmation = confirmationFromLocation ?? confirmationFromStore ?? null;

  useEffect(() => {
    if (confirmationFromLocation) {
      actions.confirm(confirmationFromLocation);
    }
  }, [actions, confirmationFromLocation]);

  useEffect(() => {
    if (!confirmation) {
      navigate('/book', { replace: true });
    }
  }, [confirmation, navigate]);

  if (!confirmation) {
    return null;
  }

  const { id: bookingReference, service, barber, slot, clientName, clientEmail, clientPhone, notes, status } = confirmation;
  const dateInput = slot.start.split('T')[0] ?? '';
  const dateLabel = slot.dateLabel ?? formatDateLabel(dateInput);
  const timeRange = formatTimeRange(slot.start, slot.end);
  const startDateTime = formatDateTime(slot.start);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900/60 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">BarberShop</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">You're all set</h1>
          </div>
          <div className="text-sm text-slate-400 text-right">
            Tue - Sat | 9:00 AM - 6:00 PM
            <br />
            123 Fade Street, Portland
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <div>
          <Link to="/book" className="inline-flex items-center gap-2 text-sm text-emerald-300 transition hover:text-emerald-200">
            Back to booking
          </Link>
        </div>

        <Card className="border-emerald-500/40 bg-slate-950/60 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Appointment confirmed - {status}</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">See you on {dateLabel}</h2>
          <p className="mt-3 text-sm text-slate-300">We'll be ready for you at {timeRange}.</p>
          <div className="mt-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Booking reference</p>
            <p className="inline-block select-all rounded-lg border border-emerald-400/40 bg-slate-900/60 px-4 py-2 font-mono text-sm text-emerald-200">{bookingReference}</p>
            <p className="text-xs text-slate-500">Keep this code handy if you need to look up or update your visit.</p>
          </div>
        </Card>

        <Card className="border-slate-900/60 bg-slate-900/40 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">Appointment</p>
                <div className="mt-2 space-y-2 text-sm text-slate-300">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Service</p>
                    <p className="mt-1 text-base text-white">{service.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Barber</p>
                    <p className="mt-1">{barber?.name ?? slot.barberName ?? 'Any available barber'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Date &amp; time</p>
                    <p className="mt-1">{startDateTime}</p>
                    <p className="text-xs text-slate-500">{timeRange}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">Contact</p>
                <div className="mt-2 space-y-2 text-sm text-slate-300">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Guest</p>
                    <p className="mt-1 text-base text-white">{clientName}</p>
                  </div>
                  {clientEmail ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Email</p>
                      <p className="mt-1">{clientEmail}</p>
                    </div>
                  ) : null}
                  {clientPhone ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Phone</p>
                      <p className="mt-1">{clientPhone}</p>
                    </div>
                  ) : null}
                </div>
              </div>
              {notes ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">Notes for your barber</p>
                  <p className="mt-2 text-sm text-slate-300">{notes}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/book')}>
              Book another appointment
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/')}>
              Back to home
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
