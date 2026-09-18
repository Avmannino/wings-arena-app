import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useSchedule,
} from "../context/ScheduleContext";

import {
  colors,
} from "../theme";

import {
  formatLongDate,
  formatMinutes,
  formatTime,
  formatTimeRange,
  getEasternDateKey,
  isEventNow,
  isFutureEvent,
  minutesBetween,
} from "../utils/dateTime";

import {
  parseLockerEntries,
} from "../utils/lockers";

import {
  computeIceCuts,
} from "../utils/iceCuts";

function getOrganizationColor(
  organization
) {
  if (
    organization ===
    "Stateline"
  ) {
    return colors.purple;
  }

  if (
    organization ===
    "GSC"
  ) {
    return colors.accent;
  }

  return colors.wings;
}

function getOrganizationLabel(
  organization
) {
  if (
    organization ===
    "Stateline"
  ) {
    return "STATELINE";
  }

  if (
    organization ===
    "GSC"
  ) {
    return "GSC";
  }

  return "WINGS";
}

function PulsingDot() {
  const opacity =
    useRef(
      new Animated.Value(1)
    ).current;

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            opacity,
            {
              toValue: 0.15,
              duration: 1400,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            opacity,
            {
              toValue: 1,
              duration: 1400,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    animation.start();

    return () =>
      animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.liveStatusDot,
        {
          opacity,
        },
      ]}
    />
  );
}

function OrganizationLabel({
  organization,
}) {
  const color =
    getOrganizationColor(
      organization
    );

  return (
    <View
      style={
        styles.organizationRow
      }
    >
      <View
        style={[
          styles.organizationDot,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={[
          styles.organizationText,
          {
            color,
          },
        ]}
      >
        {getOrganizationLabel(
          organization
        )}
      </Text>
    </View>
  );
}

function CurrentEventCard({
  events,
  now,
}) {
  if (
    !events.length
  ) {
    return (
      <View
        style={
          styles.primaryCard
        }
      >
        <View
          style={
            styles.primaryCardHeader
          }
        >
          <Text
            style={
              styles.sectionLabel
            }
          >
            NOW ON THE ICE
          </Text>

          <Text
            style={
              styles.statusQuiet
            }
          >
            IDLE
          </Text>
        </View>

        <Text
          style={
            styles.primaryIdleTitle
          }
        >
          No active scheduled event
        </Text>

        <Text
          style={
            styles.primaryIdleCopy
          }
        >
          The rink is currently between
          scheduled events.
        </Text>
      </View>
    );
  }

  const primary =
    events[0];

  const minutesLeft =
    minutesBetween(
      now,
      primary.end
    );

  return (
    <View
      style={
        styles.primaryCard
      }
    >
      <View
        style={
          styles.primaryAccent
        }
      />

      <View
        style={
          styles.primaryCardHeader
        }
      >
        <Text
          style={
            styles.sectionLabel
          }
        >
          NOW ON THE ICE
        </Text>

        <View
          style={
            styles.liveStatus
          }
        >
          <PulsingDot />

          <Text
            style={
              styles.liveStatusText
            }
          >
            LIVE
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.primaryTitle
        }
      >
        {primary.title}
      </Text>

      <Text
        style={
          styles.primaryTime
        }
      >
        {formatTimeRange(
          primary
        )}
      </Text>

      <View
        style={
          styles.primaryFooter
        }
      >
        <OrganizationLabel
          organization={
            primary.organization
          }
        />

        <Text
          style={
            styles.timeRemaining
          }
        >
          {formatMinutes(
            minutesLeft
          )}{" "}
          remaining
        </Text>
      </View>

      {primary.lockerNumber ? (
        <Text
          style={
            styles.primaryLocker
          }
        >
          LOCKERS{" "}
          {parseLockerEntries(
            primary.lockerNumber
          ).map(
            (entry, index) => (
              <Fragment
                key={
                  index
                }
              >
                {index > 0
                  ? ", "
                  : ""}
                <Text
                  style={
                    styles.primaryLockerValue
                  }
                >
                  {entry.id}
                </Text>
                {entry.rest}
              </Fragment>
            )
          )}
        </Text>
      ) : null}

      {events.length >
      1 ? (
        <View
          style={
            styles.concurrentBlock
          }
        >
          <Text
            style={
              styles.concurrentLabel
            }
          >
            ALSO RUNNING
          </Text>

          {events
            .slice(1)
            .map(
              (event) => (
                <View
                  key={
                    event.id
                  }
                  style={
                    styles.concurrentRow
                  }
                >
                  <Text
                    style={
                      styles.concurrentTitle
                    }
                  >
                    {event.title}
                  </Text>

                  <Text
                    style={
                      styles.concurrentTime
                    }
                  >
                    {formatTimeRange(
                      event
                    )}
                  </Text>
                </View>
              )
            )}
        </View>
      ) : null}
    </View>
  );
}

function NextEventCard({
  events,
  now,
}) {
  if (
    !events.length
  ) {
    return (
      <View
        style={
          styles.nextCard
        }
      >
        <View
          style={
            styles.nextHeader
          }
        >
          <Text
            style={
              styles.sectionLabelMuted
            }
          >
            NEXT
          </Text>
        </View>

        <Text
          style={
            styles.nextEmptyTitle
          }
        >
          No more events scheduled
        </Text>
      </View>
    );
  }

  const primary =
    events[0];

  const startsIn =
    minutesBetween(
      now,
      primary.start
    );

  return (
    <View
      style={
        styles.nextCard
      }
    >
      <View
        style={
          styles.nextHeader
        }
      >
        <Text
          style={
            styles.sectionLabelMuted
          }
        >
          NEXT
        </Text>

        <Text
          style={
            styles.nextCountdown
          }
        >
          {formatMinutes(
            startsIn
          )}
        </Text>
      </View>

      <Text
        style={
          styles.nextTitle
        }
      >
        {primary.title}
      </Text>

      <Text
        style={
          styles.nextTime
        }
      >
        {formatTimeRange(
          primary
        )}
      </Text>

      <View
        style={
          styles.nextFooter
        }
      >
        <OrganizationLabel
          organization={
            primary.organization
          }
        />

        <Text
          style={
            styles.nextStarts
          }
        >
          until start
        </Text>
      </View>

      {primary.lockerNumber ? (
        <Text
          style={
            styles.nextLocker
          }
        >
          LOCKERS{" "}
          {parseLockerEntries(
            primary.lockerNumber
          ).map(
            (entry, index) => (
              <Fragment
                key={
                  index
                }
              >
                {index > 0
                  ? ", "
                  : ""}
                <Text
                  style={
                    styles.nextLockerValue
                  }
                >
                  {entry.id}
                </Text>
                {entry.rest}
              </Fragment>
            )
          )}
        </Text>
      ) : null}

      {events.length >
      1 ? (
        <Text
          style={
            styles.sameTimeText
          }
        >
          +
          {events.length -
            1}{" "}
          additional event at the same
          start time
        </Text>
      ) : null}
    </View>
  );
}

function ScheduleRow({
  event,
  isLast,
}) {
  return (
    <View>
      <View
        style={
          styles.scheduleRow
        }
      >
        <View
          style={
            styles.scheduleTimeColumn
          }
        >
          <Text
            style={
              styles.scheduleStart
            }
          >
            {formatTime(
              event.start
            )}
          </Text>

          <Text
            style={
              styles.scheduleEnd
            }
          >
            {formatTime(
              event.end
            )}
          </Text>
        </View>

        <View
          style={
            styles.scheduleDetails
          }
        >
          <Text
            style={
              styles.scheduleTitle
            }
          >
            {event.title}
          </Text>

          <View
            style={
              styles.scheduleMeta
            }
          >
            <OrganizationLabel
              organization={
                event.organization
              }
            />

            {event.type ? (
              <>
                <View
                  style={
                    styles.metaDividerDot
                  }
                />

                <Text
                  style={
                    styles.eventType
                  }
                >
                  {event.type}
                </Text>
              </>
            ) : null}
          </View>

          {event.lockerNumber ? (
            <Text
              style={
                styles.scheduleLocker
              }
            >
              LOCKERS{" "}
              {parseLockerEntries(
                event.lockerNumber
              ).map(
                (entry, index) => (
                  <Fragment
                    key={
                      index
                    }
                  >
                    {index > 0
                      ? ", "
                      : ""}
                    <Text
                      style={
                        styles.scheduleLockerValue
                      }
                    >
                      {entry.id}
                    </Text>
                    {entry.rest}
                  </Fragment>
                )
              )}
            </Text>
          ) : null}
        </View>
      </View>

      {!isLast ? (
        <View
          style={
            styles.rowSeparator
          }
        />
      ) : null}
    </View>
  );
}

export default function HomeScreen({
  navigation,
}) {
  const {
    events,
    loading,
    refreshing,
    error,
    refresh,
  } = useSchedule();

  const [
    now,
    setNow,
  ] =
    useState(
      new Date()
    );

  useEffect(() => {
    const interval =
      setInterval(
        () => {
          setNow(
            new Date()
          );
        },

        30000
      );

    return () => {
      clearInterval(
        interval
      );
    };
  }, []);

  const todayKey =
    getEasternDateKey(
      now
    );

  const currentEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            isEventNow(
              event,
              now
            )
        ),

      [
        events,
        now,
      ]
    );

  const nextIceCut =
    useMemo(
      () => {
        const nowMs =
          now.getTime();

        return (
          computeIceCuts(
            events
          )
            .filter(
              (cut) =>
                new Date(
                  cut.time
                ).getTime() >
                nowMs
            )
            .sort(
              (a, b) =>
                new Date(
                  a.time
                ).getTime() -
                new Date(
                  b.time
                ).getTime()
            )[0] ||
          null
        );
      },

      [
        events,
        now,
      ]
    );

  const futureEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            isFutureEvent(
              event,
              now
            )
        ),

      [
        events,
        now,
      ]
    );

  const nextEvents =
    useMemo(
      () => {
        if (
          !futureEvents.length
        ) {
          return [];
        }

        const firstStart =
          new Date(
            futureEvents[
              0
            ].start
          ).getTime();

        return futureEvents.filter(
          (event) =>
            new Date(
              event.start
            ).getTime() ===
            firstStart
        );
      },

      [
        futureEvents,
      ]
    );

  const laterToday =
    useMemo(
      () => {
        const nextStart =
          nextEvents.length
            ? new Date(
                nextEvents[
                  0
                ].start
              ).getTime()
            : null;

        return futureEvents
          .filter(
            (event) =>
              getEasternDateKey(
                event.start
              ) ===
              todayKey
          )
          .filter(
            (event) => {
              if (
                !nextStart
              ) {
                return true;
              }

              return (
                new Date(
                  event.start
                ).getTime() !==
                nextStart
              );
            }
          )
          .slice(
            0,
            6
          );
      },

      [
        futureEvents,
        nextEvents,
        todayKey,
      ]
    );

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        "top",
      ]}
    >
      <ScrollView
        style={
          styles.screen
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              refresh
            }
            tintColor={
              colors.accent
            }
          />
        }
      >
        <View
          style={
            styles.header
          }
        >
          <View>
            <Pressable
              style={
                styles.headerLogoButton
              }
              onPress={() =>
                navigation.navigate(
                  "Home"
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Go to home"
            >
              <Image
                source={require(
                  "../../assets/wings-logo.png"
                )}
                style={
                  styles.headerLogo
                }
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <View
            style={
              styles.headerRight
            }
          >
            <Pressable
              style={
                styles.refreshButton
              }
              onPress={
                refresh
              }
            >
              <Text
                style={
                  styles.refreshButtonText
                }
              >
                REFRESH
              </Text>
            </Pressable>

            <Text
              style={
                styles.headerDate
              }
            >
              {formatLongDate(
                now
              )}
            </Text>
          </View>
        </View>

        {nextIceCut ? (
          <Pressable
            style={
              styles.iceCutBanner
            }
            onPress={() =>
              navigation.navigate(
                "Ice Cuts"
              )
            }
          >
            <Ionicons
              name="snow"
              size={
                16
              }
              color={
                colors.accent
              }
            />

            <View
              style={
                styles.iceCutCopy
              }
            >
              <Text
                style={
                  styles.iceCutLabel
                }
              >
                NEXT ICE CUT
              </Text>

              <Text
                style={
                  styles.iceCutDetail
                }
              >
                {formatTime(
                  nextIceCut.time
                )}{" "}
                · After{" "}
                {
                  nextIceCut.afterTitle
                }
              </Text>
            </View>
          </Pressable>
        ) : null}

        {loading &&
        !events.length ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="small"
              color={
                colors.accent
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading schedule
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={
              styles.errorContainer
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Schedule unavailable
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        ) : null}

        {!loading ||
        events.length ? (
          <>
            <CurrentEventCard
              events={
                currentEvents
              }
              now={
                now
              }
            />

            <View
              style={
                styles.cardSpacing
              }
            >
              <NextEventCard
                events={
                  nextEvents
                }
                now={
                  now
                }
              />
            </View>

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Later Today
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  navigation.navigate(
                    "Schedule"
                  )
                }
              >
                <Text
                  style={
                    styles.viewSchedule
                  }
                >
                  VIEW ALL
                </Text>
              </Pressable>
            </View>

            <View
              style={
                styles.schedulePanel
              }
            >
              {laterToday.length >
              0 ? (
                laterToday.map(
                  (
                    event,
                    index
                  ) => (
                    <ScheduleRow
                      key={
                        event.id
                      }
                      event={
                        event
                      }
                      isLast={
                        index ===
                        laterToday.length -
                          1
                      }
                    />
                  )
                )
              ) : (
                <View
                  style={
                    styles.emptySchedule
                  }
                >
                  <Text
                    style={
                      styles.emptyScheduleText
                    }
                  >
                    No additional events
                    scheduled today.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex:
        1,

      backgroundColor:
        colors.background,
    },

    screen: {
      flex:
        1,

      backgroundColor:
        colors.background,
    },

    content: {
      paddingHorizontal:
        20,

      paddingTop:
        18,

      paddingBottom:
        38,
    },

    header: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "flex-start",

      marginBottom:
        28,
    },

    headerLogo: {
      height:
        31,

      aspectRatio:
        1925 / 342,

      alignSelf:
        "flex-start",
    },

    headerLogoButton: {
      alignSelf:
        "flex-start",

      top:
        19,
    },

    headerRight: {
      alignItems:
        "flex-end",
    },

    headerDate: {
      color:
        colors.textSecondary,

      fontSize:
        15,

      marginTop:
        2,

      top:
        10,
    },

    refreshButton: {
      borderWidth:
        1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      paddingHorizontal:
        13,

      paddingVertical:
        9,

      borderRadius:
        8,
    },

    refreshButtonText: {
      color:
        colors.textSecondary,

      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        1,
    },

    iceCutBanner: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      backgroundColor:
        colors.accentSoft,

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        10,

      paddingHorizontal:
        14,

      paddingVertical:
        10,

      marginBottom:
        16,
    },

    iceCutCopy: {
      flex:
        1,
    },

    iceCutLabel: {
      color:
        colors.accent,

      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        1,
    },

    iceCutDetail: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "600",

      marginTop:
        2,
    },

    loadingContainer: {
      minHeight:
        240,

      justifyContent:
        "center",

      alignItems:
        "center",

      gap:
        12,
    },

    loadingText: {
      color:
        colors.muted,

      fontSize:
        13,
    },

    errorContainer: {
      backgroundColor:
        colors.redSoft,

      borderWidth:
        1,

      borderColor:
        "#47262C",

      padding:
        16,

      borderRadius:
        10,

      marginBottom:
        16,
    },

    errorTitle: {
      color:
        colors.text,

      fontSize:
        14,

      fontWeight:
        "700",
    },

    errorText: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      lineHeight:
        18,

      marginTop:
        5,
    },

    primaryCard: {
      position:
        "relative",

      overflow:
        "hidden",

      backgroundColor:
        colors.surfaceRaised,

      borderWidth:
        1,

      borderColor:
        colors.borderLight,

      borderRadius:
        14,

      padding:
        20,
    },

    primaryAccent: {
      position:
        "absolute",

      left:
        0,

      top:
        0,

      bottom:
        0,

      width:
        3,

      backgroundColor:
        colors.accent,
    },

    primaryCardHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },

    sectionLabel: {
      color:
        colors.textSecondary,

      fontSize:
        10,

      fontWeight:
        "700",

      letterSpacing:
        1.4,
    },

    sectionLabelMuted: {
      color:
        colors.muted,

      fontSize:
        10,

      fontWeight:
        "700",

      letterSpacing:
        1.4,
    },

    statusQuiet: {
      color:
        colors.muted,

      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        1,
    },

    liveStatus: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,
    },

    liveStatusDot: {
      width:
        11,

      height:
        11,

      borderRadius:
        10,

      backgroundColor:
        colors.green,
    },

    liveStatusText: {
      color:
        colors.green,

      fontSize:
        15,

      fontWeight:
        "700",

      letterSpacing:
        1,
    },

    primaryTitle: {
      color:
        colors.text,

      fontSize:
        24,

      fontWeight:
        "700",

      lineHeight:
        30,

      letterSpacing:
        -0.4,

      marginTop:
        20,
    },

    primaryTime: {
      color:
        colors.textSecondary,

      fontSize:
        14,

      marginTop:
        7,
    },

    primaryFooter: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginTop:
        22,
    },

    timeRemaining: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "600",
    },

    primaryLocker: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "600",

      marginTop:
        10,
    },

    primaryLockerValue: {
      color:
        colors.wings,
    },

    primaryIdleTitle: {
      color:
        colors.text,

      fontSize:
        21,

      fontWeight:
        "650",

      marginTop:
        20,
    },

    primaryIdleCopy: {
      color:
        colors.muted,

      fontSize:
        13,

      lineHeight:
        19,

      marginTop:
        6,
    },

    concurrentBlock: {
      marginTop:
        20,

      paddingTop:
        16,

      borderTopWidth:
        1,

      borderTopColor:
        colors.border,
    },

    concurrentLabel: {
      color:
        colors.muted,

      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        1.2,

      marginBottom:
        10,
    },

    concurrentRow: {
      marginBottom:
        10,
    },

    concurrentTitle: {
      color:
        colors.textSecondary,

      fontSize:
        13,

      fontWeight:
        "600",
    },

    concurrentTime: {
      color:
        colors.muted,

      fontSize:
        11,

      marginTop:
        3,
    },

    cardSpacing: {
      marginTop:
        12,
    },

    nextCard: {
      backgroundColor:
        colors.surface,

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        12,

      padding:
        18,
    },

    nextHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },

    nextCountdown: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "600",
    },

    nextTitle: {
      color:
        colors.text,

      fontSize:
        18,

      fontWeight:
        "650",

      lineHeight:
        24,

      marginTop:
        13,
    },

    nextTime: {
      color:
        colors.textSecondary,

      fontSize:
        13,

      marginTop:
        5,
    },

    nextFooter: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginTop:
        16,
    },

    nextStarts: {
      color:
        colors.muted,

      fontSize:
        11,
    },

    nextLocker: {
      color:
        colors.textSecondary,

      fontSize:
        11,

      fontWeight:
        "600",

      marginTop:
        8,
    },

    nextLockerValue: {
      color:
        colors.wings,
    },

    nextEmptyTitle: {
      color:
        colors.textSecondary,

      fontSize:
        16,

      fontWeight:
        "600",

      marginTop:
        12,
    },

    sameTimeText: {
      color:
        colors.muted,

      fontSize:
        11,

      marginTop:
        12,
    },

    organizationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,
    },

    organizationDot: {
      width:
        6,

      height:
        6,

      borderRadius:
        6,
    },

    organizationText: {
      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        0.8,
    },

    sectionHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "flex-end",

      marginTop:
        30,

      marginBottom:
        12,
    },

    sectionHeading: {
      color:
        colors.text,

      fontSize:
        17,

      fontWeight:
        "650",
    },

    viewSchedule: {
      color:
        colors.accent,

      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        1,
    },

    schedulePanel: {
      backgroundColor:
        colors.surface,

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        12,

      overflow:
        "hidden",
    },

    scheduleRow: {
      flexDirection:
        "row",

      paddingHorizontal:
        16,

      paddingVertical:
        15,
    },

    scheduleTimeColumn: {
      width:
        74,
    },

    scheduleStart: {
      color:
        colors.text,

      fontSize:
        13,

      fontWeight:
        "650",
    },

    scheduleEnd: {
      color:
        colors.muted,

      fontSize:
        11,

      marginTop:
        3,
    },

    scheduleDetails: {
      flex:
        1,

      paddingLeft:
        14,
    },

    scheduleTitle: {
      color:
        colors.text,

      fontSize:
        14,

      fontWeight:
        "600",

      lineHeight:
        19,
    },

    scheduleMeta: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginTop:
        7,
    },

    metaDividerDot: {
      width:
        3,

      height:
        3,

      borderRadius:
        3,

      backgroundColor:
        colors.borderLight,

      marginHorizontal:
        8,
    },

    eventType: {
      color:
        colors.muted,

      fontSize:
        10,

      fontWeight:
        "600",
    },

    scheduleLocker: {
      color:
        colors.textSecondary,

      fontSize:
        10,

      fontWeight:
        "700",

      marginTop:
        5,
    },

    scheduleLockerValue: {
      color:
        colors.wings,
    },

    rowSeparator: {
      height:
        1,

      backgroundColor:
        colors.border,

      marginLeft:
        90,
    },

    emptySchedule: {
      padding:
        22,
    },

    emptyScheduleText: {
      color:
        colors.muted,

      fontSize:
        13,
    },

  });