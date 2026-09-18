import {
  eventSort,
  getEasternDateKey,
} from "./dateTime";

export function computeIceCuts(
  events
) {
  const todayKey =
    getEasternDateKey();

  const upcoming =
    events
      .filter(
        (event) =>
          getEasternDateKey(
            event.start
          ) >=
          todayKey
      )
      .sort(
        eventSort
      );

  const seenEndTimes =
    new Set();

  const cuts = [];

  for (
    const event of
    upcoming
  ) {
    const endTime =
      new Date(
        event.end
      ).getTime();

    if (
      seenEndTimes.has(
        endTime
      )
    ) {
      continue;
    }

    seenEndTimes.add(
      endTime
    );

    cuts.push({
      id: `cut-${event.id}`,

      time:
        event.end,

      afterTitle:
        event.title,

      afterOrganization:
        event.organization,
    });
  }

  return cuts;
}
