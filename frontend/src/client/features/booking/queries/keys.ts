export const bookingKeys = {
  root: ['booking'] as const,
  services: () => ['booking', 'services'] as const,
  barbers: (serviceId: string | null) => ['booking', 'barbers', serviceId] as const,
  availability: (serviceId: string | null, barberId: string | null, date: string) =>
    ['booking', 'availability', serviceId, barberId, date] as const,
  nextAvailable: (serviceId: string | null) => ['booking', 'nextAvailable', serviceId] as const,
};
