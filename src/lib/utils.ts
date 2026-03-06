
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTimeSlots(
    startHour: number = 8, 
    startMinute: number = 0, 
    endHour: number = 16, 
    endMinute: number = 0, 
    interval: number = 30
) {
  const slots = [];
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  for (let time = startTime; time <= endTime; time += interval) {
    const hours = Math.floor(time / 60).toString().padStart(2, '0');
    const minutes = (time % 60).toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
  }

  return slots;
}

export function getDayOfWeekName(dayIndex: number): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayIndex] || '';
}

export function getClientTimeSlots(date: Date): string[] {
  if (!date) return [];
  
  const dayOfWeek = date.getDay(); // Sunday = 0
  
  // Domingo (Sunday) is a day off
  if (dayOfWeek === 0) {
      return [];
  }
  
  // All other days: 09:00 to 16:00, every 1 hour
  return generateTimeSlots(9, 0, 16, 0, 60);
}
