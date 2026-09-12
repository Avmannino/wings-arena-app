export const WINGS_TIME_ZONE =
  "America/New_York";

function getDateParts(
  value = new Date()
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          WINGS_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(
        (part) =>
          part.type !==
          "literal"
      )
      .map(
        (part) => [
          part.type,
          part.value,
        ]
      )
  );
}

export function getEasternDateKey(
  value = new Date()
) {
  const parts =
    getDateParts(value);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatTime(
  value
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        WINGS_TIME_ZONE,

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  ).format(
    new Date(value)
  );
}

export function formatShortDate(
  value
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        WINGS_TIME_ZONE,

      weekday:
        "short",

      month:
        "short",

      day:
        "numeric",
    }
  ).format(
    new Date(value)
  );
}

export function formatLongDate(
  value = new Date()
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        WINGS_TIME_ZONE,

      weekday:
        "long",

      month:
        "long",

      day:
        "numeric",
    }
  ).format(
    value instanceof Date
      ? value
      : new Date(value)
  );
}

export function formatDateHeadingFromKey(
  dateKey
) {
  const [
    year,
    month,
    day,
  ] = dateKey
    .split("-")
    .map(Number);

  const noonUtc =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        16,
        0,
        0
      )
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        WINGS_TIME_ZONE,

      weekday:
        "long",

      month:
        "short",

      day:
        "numeric",
    }
  ).format(noonUtc);
}

export function formatTimeRange(
  event
) {
  return `${formatTime(
    event.start
  )} – ${formatTime(
    event.end
  )}`;
}

export function minutesBetween(
  from,
  to
) {
  return Math.max(
    0,
    Math.ceil(
      (
        new Date(
          to
        ).getTime() -
        new Date(
          from
        ).getTime()
      ) /
        60000
    )
  );
}

export function formatMinutes(
  minutes
) {
  if (
    minutes < 60
  ) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainder =
    minutes % 60;

  if (
    remainder === 0
  ) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainder} min`;
}

export function isEventNow(
  event,
  now = new Date()
) {
  const nowMs =
    now.getTime();

  return (
    new Date(
      event.start
    ).getTime() <=
      nowMs &&
    new Date(
      event.end
    ).getTime() >
      nowMs
  );
}

export function isFutureEvent(
  event,
  now = new Date()
) {
  return (
    new Date(
      event.start
    ).getTime() >
    now.getTime()
  );
}

export function eventSort(
  a,
  b
) {
  const startDifference =
    new Date(
      a.start
    ).getTime() -
    new Date(
      b.start
    ).getTime();

  if (
    startDifference !==
    0
  ) {
    return startDifference;
  }

  return (
    new Date(
      a.end
    ).getTime() -
    new Date(
      b.end
    ).getTime()
  );
}