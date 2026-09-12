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
      } = {}) => {
        if (isRefresh) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        try {
          setError("");

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

          setLastUpdated(
            new Date()
          );
        } catch (
          loadError
        ) {
          setError(
            loadError.message ||
              "Unable to load the Wings Arena schedule."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
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
    loadSchedule();

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

    return () =>
      clearInterval(
        interval
      );
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