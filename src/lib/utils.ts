import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTimeSlots() {
  const slots = [];
  const startTime = 8 * 60; // 8:00 in minutes
  const endTime = 17 * 60; // 17:00 in minutes
  const interval = 30; // 30 minutes

  for (let time = startTime; time <= endTime; time += interval) {
    const hours = Math.floor(time / 60).toString().padStart(2, '0');
    const minutes = (time % 60).toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
  }

  return slots;
}
