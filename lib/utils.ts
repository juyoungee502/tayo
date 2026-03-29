import { ALLOWED_LOGIN_EMAIL_DOMAINS, APP_NAME } from "@/lib/constants";

const URGENT_NOTE_PREFIX = "[URGENT]";
const DEFAULT_ESTIMATED_TOTAL_TAXI_FARE = 26000;
const YEOKGOK_ESTIMATED_TOTAL_TAXI_FARE = 6500;

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAllowedLoginEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return ALLOWED_LOGIN_EMAIL_DOMAINS.some((domain) => normalizedEmail.endsWith(`@${domain}`));
}

export function deriveNickname(email: string) {
  const localPart = email.split("@")[0] ?? APP_NAME;
  return localPart.slice(0, 20) || APP_NAME;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeStatus(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  const minutes = Math.round(diff / 60000);

  if (minutes <= -60) {
    const hours = Math.abs(Math.round(minutes / 60));
    return `${hours}시간 전 출발`;
  }

  if (minutes < 0) {
    return `${Math.abs(minutes)}분 전 출발`;
  }

  if (minutes < 60) {
    return `${minutes}분 후 출발`;
  }

  return `${Math.round(minutes / 60)}시간 후 출발`;
}

export function getLocalDateTimeInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function parseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function toNullableNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function decorateNoteWithUrgency(note: string | null | undefined, urgent: boolean) {
  const cleaned = (note ?? "").replace(URGENT_NOTE_PREFIX, "").trim();

  if (!urgent) {
    return cleaned;
  }

  return cleaned ? `${URGENT_NOTE_PREFIX} ${cleaned}` : URGENT_NOTE_PREFIX;
}

export function isUrgentParty(note: string | null | undefined) {
  return (note ?? "").trim().startsWith(URGENT_NOTE_PREFIX);
}

export function stripUrgentMarker(note: string | null | undefined) {
  const cleaned = (note ?? "").replace(URGENT_NOTE_PREFIX, "").trim();
  return cleaned || null;
}

function getEstimatedTotalFare(departurePlaceName: string | null | undefined) {
  if ((departurePlaceName ?? "").includes("역곡역")) {
    return YEOKGOK_ESTIMATED_TOTAL_TAXI_FARE;
  }

  return DEFAULT_ESTIMATED_TOTAL_TAXI_FARE;
}

export function estimateTaxiShare(
  joinedCount: number,
  capacity: number,
  departurePlaceName?: string | null,
  includeNextPassenger = true,
) {
  const divisor = includeNextPassenger
    ? Math.min(Math.max(joinedCount + 1, 1), capacity)
    : Math.min(Math.max(joinedCount, 1), capacity);

  return Math.ceil(getEstimatedTotalFare(departurePlaceName) / divisor / 100) * 100;
}
