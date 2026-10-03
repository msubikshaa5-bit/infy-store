export function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}