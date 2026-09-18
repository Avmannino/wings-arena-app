import {
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
  computeIceCuts,
} from "../utils/iceCuts";

import LockerDisplay from "../components/LockerDisplay";

import OrganizationLogo from "../components/OrganizationLogo";

import {
  useEventDetail,
} from "../context/EventDetailContext";

const ICE_CUT_MAX_GAP_MS =
  30 * 60 * 1000;

function usePulseOpacity() {
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

  return opacity;
}

function PulsingDot() {
  const opacity =
    usePulseOpacity();

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

function PulsingText({
  style,
  children,
}) {
  const opacity =
    usePulseOpacity();

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity,
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
}

function OrganizationLabel({
  organization,
  size = 34,
}) {
  return (
    <OrganizationLogo
      organization={
        organization
      }
      height={size}
    />
  );
}

function CurrentEventCard({
  events,
  now,
  iceCutInProgress,
  upNext,
}) {
  const {
    openEvent,
  } = useEventDetail();

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

        {iceCutInProgress ? (
          <>
            <Text
              style={
                styles.primaryIdleTitle
              }
            >
              Cutting the ice
            </Text>

            <Text
              style={[
                styles.sectionLabel,
                styles.primaryIdleEyebrow,
              ]}
            >
              STARTING SOON
            </Text>

            {upNext ? (
              <Text
                style={
                  styles.primaryIdleNext
                }
              >
                {upNext.title}
                {" · "}
                {formatTimeRange(
                  upNext
                )}
              </Text>
            ) : null}
          </>
        ) : (
          <>
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
          </>
        )}
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
    <Pressable
      style={
        styles.primaryCard
      }
      onPress={() =>
        openEvent(
          primary
        )
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

      {minutesLeft <=
      10 ? (
        <PulsingText
          style={[
            styles.timeRemaining,
            {
              color:
                colors.red,
            },
          ]}
        >
          {formatMinutes(
            minutesLeft
          )}{" "}
          remaining
        </PulsingText>
      ) : (
        <Text
          style={[
            styles.timeRemaining,
            {
              color:
                minutesLeft >
                30
                  ? colors.green
                  : colors.yellow,
            },
          ]}
        >
          {formatMinutes(
            minutesLeft
          )}{" "}
          remaining
        </Text>
      )}

      <View
        style={
          styles.primaryFooter
        }
      >
        <View
          style={
            styles.footerLeft
          }
        >
          <LockerDisplay
            lockerNumber={
              primary.lockerNumber
            }
          />
        </View>

        <OrganizationLabel
          organization={
            primary.organization
          }
        />
      </View>

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
                <Pressable
                  key={
                    event.id
                  }
                  style={
                    styles.concurrentRow
                  }
                  onPress={() =>
                    openEvent(
                      event
                    )
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
                </Pressable>
              )
            )}
        </View>
      ) : null}
    </Pressable>
  );
}

function NextEventCard({
  events,
  now,
}) {
  const {
    openEvent,
  } = useEventDetail();

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
    <Pressable
      style={
        styles.nextCard
      }
      onPress={() =>
        openEvent(
          primary
        )
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
          UP NEXT
        </Text>

        <Text
          style={
            styles.nextCountdown
          }
        >
          In{" "}
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
        <View
          style={
            styles.footerLeft
          }
        >
          <LockerDisplay
            lockerNumber={
              primary.lockerNumber
            }
          />
        </View>

        <OrganizationLabel
          organization={
            primary.organization
          }
        />
      </View>

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
    </Pressable>
  );
}

function ScheduleRow({
  event,
  isLast,
}) {
  const {
    openEvent,
  } = useEventDetail();

  return (
    <View>
      <Pressable
        style={
          styles.scheduleRow
        }
        onPress={() =>
          openEvent(
            event
          )
        }
      >
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

          <Text
            style={
              styles.scheduleTime
            }
          >
            {formatTimeRange(
              event
            )}
          </Text>

          <View
            style={
              styles.scheduleMeta
            }
          >
            <OrganizationLabel
              size={
                18
              }
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
        </View>

        <LockerDisplay
          size="xs"
          lockerNumber={
            event.lockerNumber
          }
          style={
            styles.lockerBlockRow
          }
        />
      </Pressable>

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

  const iceCutState =
    useMemo(
      () => {
        const nowMs =
          now.getTime();

        const cuts =
          computeIceCuts(
            events
          ).sort(
            (a, b) =>
              new Date(
                a.time
              ).getTime() -
              new Date(
                b.time
              ).getTime()
          );

        for (
          const cut of
          cuts
        ) {
          const cutMs =
            new Date(
              cut.time
            ).getTime();

          if (
            cutMs >
            nowMs
          ) {
            return {
              cut,
              inProgress: false,
            };
          }

          const nextStartMs =
            events
              .map(
                (event) =>
                  new Date(
                    event.start
                  ).getTime()
              )
              .filter(
                (startMs) =>
                  startMs >=
                  cutMs
              )
              .sort(
                (a, b) =>
                  a - b
              )[0];

          if (
            nextStartMs !==
              undefined &&
            nextStartMs -
              cutMs <=
              ICE_CUT_MAX_GAP_MS &&
            nowMs <
              nextStartMs
          ) {
            return {
              cut,
              inProgress: true,
            };
          }
        }

        return null;
      },

      [
        events,
        now,
      ]
    );

  const nextIceCut =
    iceCutState
      ? iceCutState.cut
      : null;

  const iceCutInProgress =
    iceCutState
      ? iceCutState.inProgress
      : false;

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

            {iceCutInProgress ? (
              <PulsingText
                style={
                  styles.iceCutInProgress
                }
              >
                In progress
              </PulsingText>
            ) : (
              <Text
                style={
                  styles.iceCutCountdown
                }
              >
                In{" "}
                {formatMinutes(
                  minutesBetween(
                    now,
                    nextIceCut.time
                  )
                )}
              </Text>
            )}
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
              iceCutInProgress={
                iceCutInProgress
              }
              upNext={
                nextEvents[0]
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

      width:
        31 * (1925 / 342),

      aspectRatio:
        1925 / 342,

      alignSelf:
        "flex-start",
    },

    headerLogoButton: {
      alignSelf:
        "flex-start",

      transform: [
        {
          translateY:
            28,
        },
      ],
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

    lockerBlock: {
      marginTop:
        14,
    },

    lockerBlockRow: {
      alignSelf:
        "center",

      marginLeft:
        14,

      maxWidth:
        "45%",
    },

    iceCutCountdown: {
      color:
        colors.accent,

      fontSize:
        12,

      fontWeight:
        "700",
    },

    iceCutInProgress: {
      color:
        colors.green,

      fontSize:
        12,

      fontWeight:
        "700",
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
        13,

      fontWeight:
        "700",

      letterSpacing:
        1.4,
    },

    sectionLabelMuted: {
      color:
        colors.wings,

      fontSize:
        13,

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
        17,
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
        "flex-end",

      marginTop:
        16,
    },

    footerLeft: {
      flex:
        1,

      paddingRight:
        12,
    },

    timeRemaining: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "600",

      marginTop:
        6,
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

    primaryIdleEyebrow: {
      color:
        colors.yellow,

      marginTop:
        16,
    },

    primaryIdleNext: {
      color:
        colors.textSecondary,

      fontSize:
        14,

      fontWeight:
        "600",

      lineHeight:
        20,

      marginTop:
        4,
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
        colors.accent,

      fontSize:
        12,

      fontWeight:
        "700",
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
        "flex-end",

      marginTop:
        16,
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

    scheduleDetails: {
      flex:
        1,
    },

    scheduleTime: {
      color:
        colors.textSecondary,

      fontSize:
        13,

      marginTop:
        4,
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
        13,
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
        13,

      fontWeight:
        "600",
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