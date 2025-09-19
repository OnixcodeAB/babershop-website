import type { Barber } from '../../../entities/barber';

export type BarberProfile = {
  specialties: string[];
  languages: string[];
  vibe: 'Classic' | 'Modern';
  priceBand: '$' | '$$' | '$$$';
  experienceYears: number;
  rating: number;
  bioHighlight: string;
};

const defaultProfile: BarberProfile = {
  specialties: ['Fades'],
  languages: ['English'],
  vibe: 'Classic',
  priceBand: '$$',
  experienceYears: 8,
  rating: 4.8,
  bioHighlight: 'Trusted stylist focused on precision fades and clean finishes.',
};

const profileCatalog: Record<string, BarberProfile> = {
  'barber-alex': {
    specialties: ['Fades', 'Beards', 'Hot towel'],
    languages: ['English', 'Spanish'],
    vibe: 'Modern',
    priceBand: '$$',
    experienceYears: 10,
    rating: 4.9,
    bioHighlight: 'Known for ultra-clean fades and sculpted beards with premium finishes.',
  },
  'barber-lena': {
    specialties: ['Color', 'Highlights', 'Styling'],
    languages: ['English'],
    vibe: 'Modern',
    priceBand: '$$$',
    experienceYears: 12,
    rating: 4.95,
    bioHighlight: 'Salon-trained artist blending modern color work with precision cuts.',
  },
  'barber-sam': {
    specialties: ['Classic cuts', 'Kids', 'Beards'],
    languages: ['English', 'French'],
    vibe: 'Classic',
    priceBand: '$$',
    experienceYears: 9,
    rating: 4.7,
    bioHighlight: 'Family-friendly barber delivering calm experiences and sharp detail.',
  },
};

export function getBarberProfile(barber: Barber): BarberProfile {
  return profileCatalog[barber.id] ?? defaultProfile;
}

export function getAllKnownProfiles() {
  return profileCatalog;
}
