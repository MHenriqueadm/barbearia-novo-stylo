import { describe, it, expect, vi, beforeEach } from 'vitest';
import { availabilityService } from '../availability';
import { toDate } from 'date-fns-tz';

const TIMEZONE = 'America/Bahia';

describe('availabilityService', () => {
  const mockBarbershopId = 'barber-1';
  const mockProfessionalId = 'prof-1';
  const mockServiceId = 'service-1';
  const mockDate = '2026-08-24'; // A Monday

  const mockServices = [
    { id: 'service-1', duration_minutes: 30, name: 'Corte', barbershop_id: mockBarbershopId, price: 50 }
  ];

  const mockBusinessHours = [
    { weekday: 1, active: true, open_time: '08:00', close_time: '18:00', barbershop_id: mockBarbershopId }
  ];

  const mockSettings = {
    slot_interval: 30,
    barbershop_id: mockBarbershopId
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock settings and business hours services
    vi.mock('../barbearia', async (importOriginal) => {
      const actual = await importOriginal() as any;
      return {
        ...actual,
        settingsService: {
          getSettings: vi.fn().mockResolvedValue({ slot_interval: 30 }),
          getBusinessHours: vi.fn().mockResolvedValue([
            { weekday: 1, active: true, open_time: '08:00', close_time: '18:00' }
          ]),
          getBusinessBreaks: vi.fn().mockResolvedValue([])
        }
      };
    });
  });

  it('should generate correct slots for a full working day', async () => {
    const slots = await availabilityService.getAvailableSlots({
      barbershopId: mockBarbershopId,
      professionalId: mockProfessionalId,
      serviceId: mockServiceId,
      date: mockDate,
      services: mockServices as any,
      allBusinessBreaks: [],
      allProfessionalsSchedules: [
        { professional_id: mockProfessionalId, weekday: 1, active: true, start_time: '08:00', end_time: '12:00' } as any
      ],
      allProfessionalsBreaks: [],
      allProfessionalsBlocks: [],
      existingAppointments: []
    });

    // 08:00 to 12:00 with 30min slots = 8 slots
    expect(slots.length).toBe(8);
    expect(slots[0]?.time).toBe('08:00');
    expect(slots[7]?.time).toBe('11:30');
    expect(slots.every(s => s.available)).toBe(true);
  });

  it('should respect professional breaks', async () => {
    const slots = await availabilityService.getAvailableSlots({
      barbershopId: mockBarbershopId,
      professionalId: mockProfessionalId,
      serviceId: mockServiceId,
      date: mockDate,
      services: mockServices as any,
      allBusinessBreaks: [],
      allProfessionalsSchedules: [
        { professional_id: mockProfessionalId, weekday: 1, active: true, start_time: '08:00', end_time: '10:00' } as any
      ],
      allProfessionalsBreaks: [
        { professional_id: mockProfessionalId, weekday: 1, active: true, start_time: '08:30', end_time: '09:00' } as any
      ],
      allProfessionalsBlocks: [],
      existingAppointments: []
    });

    // 08:00, 08:30(unavailable), 09:00, 09:30
    const unavailable = slots.find(s => s.time === '08:30');
    expect(unavailable?.available).toBe(false);
    expect(slots.filter(s => s.available).length).toBe(3);
  });

  it('should handle timezone correctly for boundary slots', async () => {
    // Test a specific date to ensure no day-shifting occurs
    const date = '2026-08-23'; // Sunday
    const slots = await availabilityService.getAvailableSlots({
      barbershopId: mockBarbershopId,
      professionalId: mockProfessionalId,
      serviceId: mockServiceId,
      date: date,
      services: mockServices as any,
      allBusinessBreaks: [],
      allProfessionalsSchedules: [
        { professional_id: mockProfessionalId, weekday: 0, active: true, start_time: '08:00', end_time: '09:00' } as any
      ],
      allProfessionalsBreaks: [],
      allProfessionalsBlocks: [],
      existingAppointments: []
    });

    expect(slots.length).toBe(2); // 08:00, 08:30
    expect(slots[0]?.time).toBe('08:00');
  });
});
