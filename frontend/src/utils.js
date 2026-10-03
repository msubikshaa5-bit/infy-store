export function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

export const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function statusLabel(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function statusStyle(s) {
  if (s === 'DELIVERED') return 'bg-green-100 text-green-800';
  if (s === 'PENDING') return 'bg-amber-100 text-amber-800';
  return 'bg-blue-100 text-blue-800';
}