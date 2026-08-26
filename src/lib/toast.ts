/**
 * Decoupled event-driven Toast notifier for Al-Farrah Private Hospital Payroll System.
 * Bypasses iframe alert sandboxing issues elegantly.
 */

export type ToastType = 'success' | 'info' | 'error';

export function showToast(message: string, type: ToastType = 'success') {
  const event = new CustomEvent('show-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}
