export type ServiceId = string;

export type Service = {
  id: ServiceId;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
};

export type ServiceSummary = Pick<Service, 'id' | 'name' | 'durationMinutes' | 'priceCents'>;
