import { formatInTimeZone, toDate } from 'date-fns-tz';
import { 
  parseISO, 
  startOfDay, 
  endOfDay, 
  isAfter, 
  isBefore, 
  isEqual,
  addMinutes,
  set
} from 'date-fns';

/**
 * Centrais de Timezone e Formatação para o Tenant
 */

// Padrão do projeto caso a barbearia não tenha um definido
export const DEFAULT_TIMEZONE = 'America/Bahia';

/**
 * Obtém o objeto Date representando o "agora" no timezone da barbearia
 */
export function getTenantNow(timezone: string = DEFAULT_TIMEZONE): Date {
  return toDate(new Date(), { timeZone: timezone });
}

/**
 * Formata um ISO string para exibição HH:mm no timezone da barbearia
 */
export function formatTenantTime(dateStr: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatInTimeZone(date, timezone, 'HH:mm');
}

/**
 * Formata um ISO string para exibição dd/MM/yyyy no timezone da barbearia
 */
export function formatTenantDate(dateStr: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatInTimeZone(date, timezone, 'dd/MM/yyyy');
}

/**
 * Converte uma data YYYY-MM-DD e um horário HH:mm para um objeto Date
 * tratando o horário como sendo no timezone da barbearia
 */
export function parseTenantDateTime(dateStr: string, timeStr: string, timezone: string = DEFAULT_TIMEZONE): Date {
  // Garantimos que interpretamos o par data/hora como sendo NO timezone da barbearia
  // A string ISO formatada será interpretada corretamente pelo toDate
  const parts = timeStr.split(':');
  const hours = (parts[0] || '00').padStart(2, '0');
  const minutes = (parts[1] || '00').padStart(2, '0');
  const isoString = `${dateStr}T${hours}:${minutes}:00`;
  
  return toDate(isoString, { timeZone: timezone });
}

/**
 * Obtém os limites (ISO strings) de início e fim do dia no timezone da barbearia
 */
export function getTenantDayBoundaries(date: Date | string = new Date(), timezone: string = DEFAULT_TIMEZONE) {
  let dateStr: string;
  
  if (typeof date === 'string') {
    // Se for YYYY-MM-DD, já está no formato correto
    const parts = date.split('T');
    dateStr = parts[0] || date;
  } else {
    // Se for objeto Date, formatamos para o dia no timezone alvo
    dateStr = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  }
  
  const start = toDate(`${dateStr}T00:00:00`, { timeZone: timezone });
  const end = toDate(`${dateStr}T23:59:59.999`, { timeZone: timezone });
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export type TenantPeriod = 'today' | 'week' | 'month';

/**
 * Limites (ISO strings) do período solicitado calculados NO timezone da barbearia.
 * Semana: segunda 00:00 até domingo 23:59:59.999
 * Mês: dia 1 00:00 até último dia 23:59:59.999
 */
export function getTenantPeriodBoundaries(
  period: TenantPeriod,
  timezone: string = DEFAULT_TIMEZONE,
  reference: Date = new Date()
) {
  // "Hoje" no fuso do tenant, como componentes de calendário locais
  const todayStr = formatInTimeZone(reference, timezone, 'yyyy-MM-dd');
  const [y, m, d] = todayStr.split('-').map(Number) as [number, number, number];

  if (period === 'today') {
    return getTenantDayBoundaries(todayStr, timezone);
  }

  if (period === 'month') {
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return {
      start: toDate(`${todayStr.slice(0, 7)}-01T00:00:00`, { timeZone: timezone }).toISOString(),
      end: toDate(`${todayStr.slice(0, 7)}-${String(lastDay).padStart(2, '0')}T23:59:59.999`, {
        timeZone: timezone,
      }).toISOString(),
    };
  }

  // Semana (segunda a domingo) — cálculo em calendário puro, sem UTC drift
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Dom
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(Date.UTC(y, m - 1, d - diffToMonday));
  const sunday = new Date(Date.UTC(y, m - 1, d - diffToMonday + 6));
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);

  return {
    start: toDate(`${fmt(monday)}T00:00:00`, { timeZone: timezone }).toISOString(),
    end: toDate(`${fmt(sunday)}T23:59:59.999`, { timeZone: timezone }).toISOString(),
  };
}

/**
 * Chave de agrupamento diário (yyyy-MM-dd) no timezone da barbearia
 */
export function tenantDayKey(dateStr: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

/**
 * Compara se um agendamento é futuro em relação ao agora do tenant
 */
export function isFutureAppointment(startAt: string, timezone: string = DEFAULT_TIMEZONE): boolean {
  const now = getTenantNow(timezone);
  const appDate = parseISO(startAt);
  return isAfter(appDate, now);
}
