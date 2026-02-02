
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

export function getDayOfWeekName(dayIndex: number): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayIndex] || '';
}

export function getClientTimeSlots(date: Date): string[] {
  if (!date) return [];
  const dayOfWeek = date.getDay();

  // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb
  switch (dayOfWeek) {
    // Quarta e Quinta: 1 de manhã, 1 de tarde
    case 3: // Quarta-feira
    case 4: // Quinta-feira
      return ['10:00', '14:30'];

    // Segunda, Terça, Sexta, Sábado: 2 de tarde
    case 1: // Segunda-feira
    case 2: // Terça-feira
    case 5: // Sexta-feira
    case 6: // Sábado
      return ['14:00', '15:30'];

    // Domingo e outros casos
    case 0: // Domingo
    default:
      return [];
  }
}

    