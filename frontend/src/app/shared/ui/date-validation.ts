import { ValidationErrors } from '@angular/forms';
/** Calendar dates are local values, not UTC timestamps. */
export function localToday(): string {
 const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateErrors(value: string | null | undefined, min: string, max: string): ValidationErrors | null {
 if (!value) return null;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: true };
 const date = new Date(`${value}T12:00:00`);
 if (!Number.isFinite(date.getTime()) || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` !== value) return { date: true };
 if (min && value < min) return { minDate: { min } };
 if (max && value > max) return { maxDate: { max } };
 return null;
}
