const DEFAULT_LOCALE = "en-IN";

const isValidDate = (date) => {
  return date instanceof Date && !Number.isNaN(date.getTime());
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return isValidDate(date) ? date : null;
};

const formatDate = (
  value,
  {
    fallback = "Not available",
    locale = DEFAULT_LOCALE,
    dateStyle = "medium",
  } = {},
) => {
  const date = toDate(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
  }).format(date);
};

const formatShortDate = (
  value,
  { fallback = "Date unavailable", locale = DEFAULT_LOCALE } = {},
) => {
  const date = toDate(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (
  value,
  {
    fallback = "Not available",
    locale = DEFAULT_LOCALE,
    dateStyle = "medium",
    timeStyle = "short",
  } = {},
) => {
  const date = toDate(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
  }).format(date);
};

const formatRelativePostedDate = (
  value,
  { fallback = "Recently posted", locale = DEFAULT_LOCALE } = {},
) => {
  const date = toDate(value);

  if (!date) {
    return fallback;
  }

  const now = new Date();

  const diffInMs = now.getTime() - date.getTime();

  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) {
    return "Posted today";
  }

  if (diffInDays === 1) {
    return "Posted yesterday";
  }

  if (diffInDays < 7) {
    return `Posted ${diffInDays} days ago`;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
};

export {
  formatDate,
  formatShortDate,
  formatDateTime,
  formatRelativePostedDate,
};
