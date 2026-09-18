import * as Notifications from "expo-notifications";

import {
  formatTime,
} from "../utils/dateTime";

const MAX_SCHEDULED_ALERTS =
  50;

const ALERT_MINUTES_BEFORE =
  15;

Notifications.setNotificationHandler(
  {
    handleNotification:
      async () => ({
        shouldShowBanner:
          true,

        shouldShowList:
          true,

        shouldPlaySound:
          true,

        shouldSetBadge:
          false,
      }),
  }
);

export async function requestNotificationPermission() {
  const current =
    await Notifications.getPermissionsAsync();

  if (
    current.granted
  ) {
    return true;
  }

  const requested =
    await Notifications.requestPermissionsAsync(
      {
        ios: {
          allowAlert:
            true,

          allowBadge:
            false,

          allowSound:
            true,
        },
      }
    );

  return requested.granted;
}

function shouldNotifyForEvent(
  event,
  preferences
) {
  if (
    !preferences.notificationsEnabled
  ) {
    return false;
  }

  if (
    event.organization ===
    "Stateline"
  ) {
    return preferences.notifyStateline;
  }

  if (
    event.organization ===
    "GSC"
  ) {
    return preferences.notifyGSC;
  }

  return preferences.notifyWings;
}

export async function syncScheduleNotifications(
  events,
  preferences
) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (
    !preferences.notificationsEnabled
  ) {
    return 0;
  }

  const now =
    Date.now();

  const candidates =
    events
      .filter(
        (event) =>
          shouldNotifyForEvent(
            event,
            preferences
          )
      )
      .map(
        (event) => ({
          ...event,

          notificationTime:
            new Date(
              event.start
            ).getTime() -
            ALERT_MINUTES_BEFORE *
              60 *
              1000,
        })
      )
      .filter(
        (event) =>
          event.notificationTime >
          now + 5000
      )
      .sort(
        (a, b) =>
          a.notificationTime -
          b.notificationTime
      )
      .slice(
        0,
        MAX_SCHEDULED_ALERTS
      );

  await Promise.all(
    candidates.map(
      (event) =>
        Notifications.scheduleNotificationAsync(
          {
            content: {
              title:
                "Up Next at Wings",

              body:
                `${event.title} ` +
                `starts at ` +
                `${formatTime(
                  event.start
                )}.`,

              sound:
                true,

              data: {
                eventId:
                  event.id,

                source:
                  event.source,
              },
            },

            trigger: {
              type:
                Notifications
                  .SchedulableTriggerInputTypes
                  .DATE,

              date:
                new Date(
                  event.notificationTime
                ),
            },
          }
        )
    )
  );

  return candidates.length;
}