import type { Service } from '../../../entities/service';

export function categorizeService(service: Service) {
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
