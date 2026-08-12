import dayjs from "dayjs";

export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const formatTimeRemaining = (expiresAt: number, now: number = Date.now()): string => {
  const diffMs = expiresAt - now;
  if (diffMs <= 0) return "Expire d'un instant à l'autre";

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return `Expire dans ${minutes} min`;
  }
  if (hours < 24) return `Expire dans ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Expire dans ${days} j`;
};

export const isExpiringSoon = (expiresAt: number, now: number = Date.now()): boolean =>
  expiresAt - now <= 6 * 60 * 60 * 1000;

export const formatRelativeTime = (pastAt: number, now: number = Date.now()): string => {
  const diffMs = Math.max(0, now - pastAt);
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  return `${days} j`;
};