import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  // Firebase Timestamp kezelése (.toDate() létezik-e)
  if (dateValue && typeof dateValue.toDate === "function")
    return dateValue.toDate();
  // String vagy szám esetén
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date() : date;
}
