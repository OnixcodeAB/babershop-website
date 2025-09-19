const priceFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatPrice(priceCents: number) {
  return priceFormatter.format(priceCents / 100);
}
