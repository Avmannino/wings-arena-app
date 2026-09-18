import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchSchedule,
} from "../services/scheduleApi";

import {
  syncScheduleNotifications,
} from "../services/notifications";

import {
  eventSort,
} from "../utils/dateTime";

const ScheduleContext =
  createContext(null);

const PREFERENCES_KEY =
  "wings-arena-notification-preferences-v1";

const SCHEDULE_CACHE_KEY =
  "wings-arena-schedule-cache-v1";

const DEFAULT_PREFERENCES = {
  notificationsEnabled:
    false,

  notifyWings:
    true,

  notifyGSC:
    true,

  notifyStateline:
    true,
};

export function ScheduleProvider({
  children,
}) {
  const [
    events,
    setEvents,
  ] =
    useState([]);

  const [
    meta,
    setMeta,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState(null);

  const [
    preferences,
    setPreferencesState,
  ] =
    useState(
      DEFAULT_PREFERENCES
    );

  const [
    preferencesLoaded,
    setPreferencesLoaded,
  ] =
    useState(false);

  const [
    scheduledNotificationCount,
    setScheduledNotificationCount,
  ] =
    useState(0);

  const loadSchedule =
    useCallback(
      async ({
        isRefresh = false,
        silent = false,
      } = {}) => {
        if (silent) {
          // Background refresh behind
          // already-visible cached data —
          // no loading UI to toggle.
        } else if (isRefresh) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        try {
          if (
            !silent
          ) {
            setError("");
          }

          const payload =
            await fetchSchedule(
              7
            );

          const sortedEvents =
            [
              ...(payload.events ||
                []),
            ].sort(
              eventSort
            );

          setEvents(
            sortedEvents
          );

          setMeta(
            payload.meta ||
              null
          );

          const fetchedAt =
            new Date();

          setLastUpdated(
            fetchedAt
          );

          AsyncStorage.setItem(
            SCHEDULE_CACHE_KEY,
            JSON.stringify(
              {
                events:
                  sortedEvents,

                meta:
                  payload.meta ||
                  null,

                lastUpdated:
                  fetchedAt.toISOString(),
              }
            )
          ).catch(
            () => {}
          );
        } catch (
          loadError
        ) {
          if (
            !silent
          ) {
            setError(
              loadError.message ||
                "Unable to load the Wings Arena schedule."
            );
          }
        } finally {
          if (
            !silent
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      []
    );

  const updatePreferences =
    useCallback(
      async (updates) => {
        setPreferencesState(
          (current) => {
            const next = {
              ...current,
              ...updates,
            };

            AsyncStorage.setItem(
              PREFERENCES_KEY,
              JSON.stringify(
                next
              )
            ).catch(
              () => {}
            );

            return next;
          }
        );
      },
      []
    );

  useEffect(() => {
    let active =
      true;

    async function loadPreferences() {
      try {
        const stored =
          await AsyncStorage.getItem(
            PREFERENCES_KEY
          );

        if (
          !active
        ) {
          return;
        }

        if (stored) {
          setPreferencesState(
            {
              ...DEFAULT_PREFERENCES,
              ...JSON.parse(
                stored
              ),
            }
          );
        }
      } catch {
        // Keep defaults.
      } finally {
        if (
          active
        ) {
          setPreferencesLoaded(
            true
          );
        }
      }
    }

    loadPreferences();

    return () => {
      active =
        false;
    };
  }, []);

  useEffect(() => {
    let active =
      true;

    (async () => {
      let hasCache =
        false;

      try {
        const cached =
          await AsyncStorage.getItem(
            SCHEDULE_CACHE_KEY
          );

        if (
          cached &&
          active
        ) {
          const parsed =
            JSON.parse(
              cached
            );

          if (
            parsed?.events
              ?.length
          ) {
            setEvents(
              parsed.events
            );

            setMeta(
              parsed.meta ||
                null
            );

            setLastUpdated(
              parsed.lastUpdated
                ? new Date(
                    parsed.lastUpdated
                  )
                : null
            );

            setLoading(
              false
            );

            hasCache =
              true;
          }
        }
      } catch {
        // Ignore malformed
        // cache entries.
      }

      if (active) {
        loadSchedule({
          silent:
            hasCache,
        });
      }
    })();

    const interval =
      setInterval(
        () => {
          loadSchedule({
            isRefresh:
              true,
          });
        },
        5 * 60 * 1000
      );

    return () => {
      active =
        false;

      clearInterval(
        interval
      );
    };
  }, [loadSchedule]);

  useEffect(() => {
    if (
      !preferencesLoaded ||
      loading
    ) {
      return;
    }

    let active =
      true;

    syncScheduleNotifications(
      events,
      preferences
    )
      .then(
        (count) => {
          if (
            active
          ) {
            setScheduledNotificationCount(
              count
            );
          }
        }
      )
      .catch(
        () => {
          if (
            active
          ) {
            setScheduledNotificationCount(
              0
            );
          }
        }
      );

    return () => {
      active =
        false;
    };
  }, [
    events,
    loading,
    preferences,
    preferencesLoaded,
  ]);

  const value =
    useMemo(
      () => ({
        events,
        meta,
        loading,
        refreshing,
        error,
        lastUpdated,
        preferences,
        preferencesLoaded,
        scheduledNotificationCount,

        refresh:
          () =>
            loadSchedule({
              isRefresh:
                true,
            }),

        updatePreferences,
      }),
      [
        events,
        meta,
        loading,
        refreshing,
        error,
        lastUpdated,
        preferences,
        preferencesLoaded,
        scheduledNotificationCount,
        loadSchedule,
        updatePreferences,
      ]
    );

  return (
    <ScheduleContext.Provider
      value={value}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context =
    useContext(
      ScheduleContext
    );

  if (!context) {
    throw new Error(
      "useSchedule must be used inside ScheduleProvider."
    );
  }

  return context;
}