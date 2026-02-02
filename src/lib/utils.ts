
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
  // Domingo (dayOfWeek === 0) não tem agendamentos.
  if (dayOfWeek === 0) {
      return [];
  }
  
  // Para todos os outros dias (Segunda a Sábado), retorna a lista completa de horários.
  return generateTimeSlots();
}

    