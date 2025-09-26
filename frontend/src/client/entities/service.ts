export type ServiceId = string;

export type Service = {
  id: ServiceId;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
  categories?: Array<{ id: string; name: string }>;
};

export type ServiceSummary = Pick<Service, 'id' | 'name' | 'durationMinutes' | 'priceCents'>;
