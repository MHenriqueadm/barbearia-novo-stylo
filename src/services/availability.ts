import { formatInTimeZone, toDate } from 'date-fns-tz';
import { 
  addMinutes, 
  isBefore, 
  isAfter, 
  parseISO, 
  startOfDay, 
  isEqual,
  set
} from 'date-fns';
import { settingsService, BusinessHour, Service, BusinessBreak } from './barbearia';
import { ProfessionalSchedule, ProfessionalBreak, ProfessionalBlock } from './professionals';
import { Appointment } from './appointments';

/** Minimal shape needed to block a slot: professional + interval + status. */
export type BusyInterval = Pick<Appointment, 'professional_id' | 'start_at' | 'end_at' | 'status'>;

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const availabilityService = {
  getAvailableSlots: async ({
    barbershopId,
    professionalId,
    serviceId,
    date, // yyyy-MM-dd
    services,
    allBusinessBreaks,
    allProfessionalsSchedules,
    allProfessionalsBreaks,
    allProfessionalsBlocks,
    existingAppointments
  }: {
    barbershopId: string;
    professionalId: string;
    serviceId: string;
    date: string;
    services: Service[];
    allBusinessBreaks: BusinessBreak[];
    allProfessionalsSchedules: ProfessionalSchedule[];
    allProfessionalsBreaks: ProfessionalBreak[];
    allProfessionalsBlocks: ProfessionalBlock[];
    existingAppointments: BusyInterval[];
  }): Promise<TimeSlot[]> => {
    // 0. Resolve Timezone
    const settings = await settingsService.getSettings(barbershopId);
    const TIMEZONE = settings?.timezone || DEFAULT_TIMEZONE;
    const interval = settings?.slot_interval || 30;

    // 1. Precise Date Parsing in the Barbershop Timezone
    // We treat the "date" string as a local date in that timezone
    const selectedDate = toDate(`${date}T00:00:00`, { timeZone: TIMEZONE });
    const weekday = selectedDate.getDay(); // 0 = Sunday, 1 = Monday...
    
    // 2. Data Validation
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      console.log(`[Availability] Service ${serviceId} not found`);
      return [];
    }

    const businessHours = await settingsService.getBusinessHours(barbershopId);
    const shopDay = businessHours.find(h => h.weekday === weekday);
    
    // 3. Determine base working hours (Professional overrides Shop)
    const profSchedule = allProfessionalsSchedules.find(s => 
      s.professional_id === professionalId && 
      s.weekday === weekday
    );
    
    let startTimeStr: string;
    let endTimeStr: string;
    let isActive = false;

    if (profSchedule) {
      isActive = profSchedule.active || false;
      startTimeStr = profSchedule.start_time;
      endTimeStr = profSchedule.end_time;
    } else if (shopDay) {
      isActive = shopDay.active || false;
      startTimeStr = shopDay.open_time || "08:00";
      endTimeStr = shopDay.close_time || "18:00";
    } else {
      console.log(`[Availability] No schedule found for professional ${professionalId} on weekday ${weekday}`);
      return [];
    }

    if (!isActive) {
      console.log(`[Availability] Professional ${professionalId} is inactive on weekday ${weekday}`);
      return [];
    }

    // Helper to sanitize time string (HH:mm:ss or HH:mm -> HH:mm:ss)
    const sanitizeTime = (t: string) => {
      if (!t) return "00:00:00";
      const parts = t.split(':');
      const h = parts[0]?.padStart(2, '0') || "00";
      const m = parts[1]?.padStart(2, '0') || "00";
      const s = parts[2]?.padStart(2, '0') || "00";
      return `${h}:${m}:${s}`;
    };

    const startTime = sanitizeTime(startTimeStr);
    const endTime = sanitizeTime(endTimeStr);

    const dayStart = toDate(`${date}T${startTime}`, { timeZone: TIMEZONE });
    const dayEnd = toDate(`${date}T${endTime}`, { timeZone: TIMEZONE });

    // 5. Filter constraints
    const activeBusinessBreaks = allBusinessBreaks.filter(b => b.weekday === weekday && b.active);
    const profBreaks = allProfessionalsBreaks.filter(b => b.professional_id === professionalId && b.weekday === weekday && b.active);
    const profBlocks = allProfessionalsBlocks.filter(b => b.professional_id === professionalId);
    
    // Normalize appointments for comparison (Ensure they are parsed as ISO in the right context)
    const profAppointments = existingAppointments.filter(a => 
      a.professional_id === professionalId && 
      ['scheduled', 'confirmed', 'completed'].includes(a.status)
    );

    // 6. Generate slots
    const slots: TimeSlot[] = [];
    const now = toDate(new Date(), { timeZone: TIMEZONE });
    
    let currentSlot = dayStart;

    console.log(`[Availability] Generating slots for ${date} from ${startTime} to ${endTime} (TZ: ${TIMEZONE})`);

    while (isBefore(currentSlot, dayEnd)) {
      const slotEnd = addMinutes(currentSlot, service.duration_minutes);
      
      // Boundary check: cannot start or end after the business day ends
      if (isAfter(slotEnd, dayEnd)) break;

      const slotTimeStr = formatInTimeZone(currentSlot, TIMEZONE, 'HH:mm');
      let isAvailable = true;

      // Rule: Past slots are unavailable (only if the date is today)
      if (isBefore(currentSlot, now)) {
        isAvailable = false;
      }

      if (isAvailable) {
        // Business Breaks
        for (const b of activeBusinessBreaks) {
          const bStart = toDate(`${date}T${sanitizeTime(b.start_time)}`, { timeZone: TIMEZONE });
          const bEnd = toDate(`${date}T${sanitizeTime(b.end_time)}`, { timeZone: TIMEZONE });

          // Intersection check: (StartA < EndB) and (EndA > StartB)
          if (isBefore(currentSlot, bEnd) && isAfter(slotEnd, bStart)) {
            isAvailable = false;
            break;
          }
        }
      }

      if (isAvailable) {
        // Professional Breaks
        for (const b of profBreaks) {
          const bStart = toDate(`${date}T${sanitizeTime(b.start_time)}`, { timeZone: TIMEZONE });
          const bEnd = toDate(`${date}T${sanitizeTime(b.end_time)}`, { timeZone: TIMEZONE });

          if (isBefore(currentSlot, bEnd) && isAfter(slotEnd, bStart)) {
            isAvailable = false;
            break;
          }
        }
      }

      if (isAvailable) {
        // Blocks (Check both all-day and time-specific blocks)
        for (const block of profBlocks) {
          const blockStart = parseISO(block.start_at || "");
          const blockEnd = parseISO(block.end_at || "");

          if (block.all_day) {
            // Check if selectedDate matches the block's day
            if (isEqual(startOfDay(blockStart), startOfDay(selectedDate))) {
              isAvailable = false;
              break;
            }
          } else {
            if (isBefore(currentSlot, blockEnd) && isAfter(slotEnd, blockStart)) {
              isAvailable = false;
              break;
            }
          }
        }
      }

      if (isAvailable) {
        // Appointments
        for (const app of profAppointments) {
          const appStart = parseISO(app.start_at || "");
          const appEnd = parseISO(app.end_at || "");

          if (isBefore(currentSlot, appEnd) && isAfter(slotEnd, appStart)) {
            isAvailable = false;
            break;
          }
        }
      }

      slots.push({
        time: slotTimeStr,
        available: isAvailable
      });

      currentSlot = addMinutes(currentSlot, interval);
    }

    console.log(`[Availability] Generated ${slots.length} slots (${slots.filter(s => s.available).length} available)`);
    return slots;
  }
};
