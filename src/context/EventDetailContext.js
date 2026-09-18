import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import LockerDisplay from "../components/LockerDisplay";

import OrganizationLogo from "../components/OrganizationLogo";

import {
  colors,
} from "../theme";

import {
  formatLongDate,
  formatMinutes,
  formatTimeRange,
  minutesBetween,
} from "../utils/dateTime";

const EventDetailContext =
  createContext(null);

function getStatus(
  event
) {
  const nowMs =
    Date.now();

  const startMs =
    new Date(
      event.start
    ).getTime();

  const endMs =
    new Date(
      event.end
    ).getTime();

  if (
    nowMs >= startMs &&
    nowMs < endMs
  ) {
    return {
      label: "LIVE NOW",
      color: colors.green,
    };
  }

  if (nowMs < startMs) {
    return {
      label: "UPCOMING",
      color: colors.accent,
    };
  }

  return {
    label: "FINISHED",
    color: colors.muted,
  };
}

function DetailRow({
  label,
  children,
}) {
  return (
    <View
      style={
        styles.detailRow
      }
    >
      <Text
        style={
          styles.detailLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.detailValueWrap
        }
      >
        {children}
      </View>
    </View>
  );
}

function DetailText({
  children,
}) {
  return (
    <Text
      style={
        styles.detailValue
      }
    >
      {children}
    </Text>
  );
}

export function EventDetailProvider({
  children,
}) {
  const insets =
    useSafeAreaInsets();

  const [
    event,
    setEvent,
  ] =
    useState(null);

  const [
    visible,
    setVisible,
  ] =
    useState(false);

  const screenHeight =
    Dimensions.get(
      "window"
    ).height;

  const translateY =
    useRef(
      new Animated.Value(
        screenHeight
      )
    ).current;

  const backdrop =
    useRef(
      new Animated.Value(0)
    ).current;

  const openEvent =
    useCallback(
      (nextEvent) => {
        if (!nextEvent) {
          return;
        }

        translateY.setValue(
          Dimensions.get(
            "window"
          ).height
        );

        backdrop.setValue(0);
        setEvent(nextEvent);
        setVisible(true);
      },

      [translateY, backdrop]
    );

  const closeEvent =
    useCallback(
      () => {
        Animated.parallel([
          Animated.timing(
            translateY,
            {
              toValue:
                Dimensions.get(
                  "window"
                ).height,
              duration: 220,
              easing:
                Easing.in(
                  Easing.cubic
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            backdrop,
            {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }
          ),
        ]).start(
          () => {
            setVisible(false);
            setEvent(null);
          }
        );
      },

      [translateY, backdrop]
    );

  const scrollY =
    useRef(0);

  const [
    sheetResponder,
    handleResponder,
  ] =
    useMemo(
      () => {
        const create =
          (fromHandle) =>
            PanResponder.create({
              onStartShouldSetPanResponder:
                () =>
                  fromHandle,

              onMoveShouldSetPanResponder:
                (_, gesture) =>
                  fromHandle &&
                  Math.abs(
                    gesture.dy
                  ) > 2,

              onMoveShouldSetPanResponderCapture:
                (_, gesture) =>
                  !fromHandle &&
                  scrollY.current <=
                    0 &&
                  gesture.dy >
                    6 &&
                  gesture.dy >
                    Math.abs(
                      gesture.dx
                    ),

              onPanResponderTerminationRequest:
                () =>
                  false,

              onPanResponderMove:
                (_, gesture) => {
                  const dy =
                    Math.max(
                      0,
                      gesture.dy
                    );

                  translateY.setValue(
                    dy
                  );

                  backdrop.setValue(
                    Math.max(
                      0,
                      1 -
                        dy /
                          500
                    )
                  );
                },

              onPanResponderRelease:
                (_, gesture) => {
                  if (
                    gesture.dy >
                      100 ||
                    gesture.vy >
                      0.6
                  ) {
                    closeEvent();

                    return;
                  }

                  Animated.parallel([
                    Animated.spring(
                      translateY,
                      {
                        toValue: 0,
                        bounciness: 0,
                        useNativeDriver: true,
                      }
                    ),

                    Animated.timing(
                      backdrop,
                      {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                      }
                    ),
                  ]).start();
                },

              onPanResponderTerminate:
                () => {
                  Animated.parallel([
                    Animated.spring(
                      translateY,
                      {
                        toValue: 0,
                        bounciness: 0,
                        useNativeDriver: true,
                      }
                    ),

                    Animated.timing(
                      backdrop,
                      {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                      }
                    ),
                  ]).start();
                },
            });

        return [
          create(false),
          create(true),
        ];
      },

      [
        closeEvent,
        translateY,
        backdrop,
      ]
    );

  useEffect(() => {
    if (!visible) {
      return;
    }

    scrollY.current = 0;

    Animated.parallel([
      Animated.timing(
        translateY,
        {
          toValue: 0,
          duration: 280,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        backdrop,
        {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }
      ),
    ]).start();
  }, [
    visible,
    translateY,
    backdrop,
  ]);

  const value =
    useMemo(
      () => ({
        openEvent,
        closeEvent,
      }),
      [
        openEvent,
        closeEvent,
      ]
    );

  const status =
    event
      ? getStatus(event)
      : null;

  return (
    <EventDetailContext.Provider
      value={value}
    >
      {children}

      <Modal
        visible={
          visible
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closeEvent
        }
      >
        <View
          style={
            styles.modalRoot
          }
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={
              closeEvent
            }
            accessibilityLabel="Close event details"
          >
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.backdrop,
                {
                  opacity:
                    backdrop,
                },
              ]}
            />
          </Pressable>

          {event ? (
            <Animated.View
              {...sheetResponder.panHandlers}
              style={[
                styles.sheet,
                {
                  paddingBottom:
                    insets.bottom +
                    20,

                  transform: [
                    {
                      translateY,
                    },
                  ],
                },
              ]}
            >
              <View
                {...handleResponder.panHandlers}
                style={
                  styles.dragZone
                }
              >
                <View
                  style={
                    styles.handle
                  }
                />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                bounces={
                  false
                }
                scrollEventThrottle={
                  16
                }
                onScroll={(
                  scrollEvent
                ) => {
                  scrollY.current =
                    scrollEvent
                      .nativeEvent
                      .contentOffset
                      .y;
                }}
              >
                <View
                  style={
                    styles.headerRow
                  }
                >
                  <View
                    style={[
                      styles.statusPill,
                      {
                        borderColor:
                          status.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            status.color,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>

                  <Pressable
                    onPress={
                      closeEvent
                    }
                    hitSlop={
                      12
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Text
                      style={
                        styles.closeText
                      }
                    >
                      CLOSE
                    </Text>
                  </Pressable>
                </View>

                <Text
                  style={
                    styles.title
                  }
                >
                  {event.title}
                </Text>

                <OrganizationLogo
                  organization={
                    event.organization
                  }
                  height={
                    34
                  }
                  style={
                    styles.orgLogo
                  }
                />

                <View
                  style={
                    styles.details
                  }
                >
                  <DetailRow label="DATE">
                    <DetailText>
                      {formatLongDate(
                        event.start
                      )}
                    </DetailText>
                  </DetailRow>

                  <DetailRow label="TIME">
                    <DetailText>
                      {formatTimeRange(
                        event
                      )}
                    </DetailText>
                  </DetailRow>

                  <DetailRow label="DURATION">
                    <DetailText>
                      {formatMinutes(
                        minutesBetween(
                          event.start,
                          event.end
                        )
                      )}
                    </DetailText>
                  </DetailRow>

                  {event.type ? (
                    <DetailRow label="TYPE">
                      <DetailText>
                        {event.type}
                      </DetailText>
                    </DetailRow>
                  ) : null}

                  <DetailRow label="LOCATION">
                    <DetailText>
                      {event.location ||
                        "Wings Arena"}
                    </DetailText>
                  </DetailRow>

                  {event.team ? (
                    <DetailRow label="TEAM">
                      <DetailText>
                        {event.team}
                      </DetailText>
                    </DetailRow>
                  ) : null}

                  {event.opponent ? (
                    <DetailRow label="OPPONENT">
                      <DetailText>
                        {event.opponent}
                      </DetailText>
                    </DetailRow>
                  ) : null}

                  <DetailRow label="LOCKERS">
                    {event.lockerNumber ? (
                      <LockerDisplay
                        stacked
                        lockerNumber={
                          event.lockerNumber
                        }
                      />
                    ) : (
                      <DetailText>
                        None assigned
                      </DetailText>
                    )}
                  </DetailRow>
                </View>
              </ScrollView>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </EventDetailContext.Provider>
  );
}

export function useEventDetail() {
  const context =
    useContext(
      EventDetailContext
    );

  if (!context) {
    throw new Error(
      "useEventDetail must be used inside EventDetailProvider."
    );
  }

  return context;
}

const styles =
  StyleSheet.create({
    modalRoot: {
      flex:
        1,

      justifyContent:
        "flex-end",
    },

    backdrop: {
      backgroundColor:
        "rgba(0,0,0,0.6)",
    },

    sheet: {
      maxHeight:
        "85%",

      backgroundColor:
        colors.surface,

      borderTopLeftRadius:
        22,

      borderTopRightRadius:
        22,

      borderWidth:
        1,

      borderBottomWidth:
        0,

      borderColor:
        colors.border,

      paddingHorizontal:
        20,

      paddingTop:
        10,
    },

    dragZone: {
      paddingTop:
        4,

      paddingBottom:
        18,

      marginTop:
        -10,

      alignItems:
        "center",

      ...Platform.select({
        web: {
          cursor:
            "grab",

          touchAction:
            "none",

          userSelect:
            "none",
        },

        default: {},
      }),
    },

    handle: {
      alignSelf:
        "center",

      width:
        40,

      height:
        4,

      borderRadius:
        2,

      backgroundColor:
        colors.borderLight,

    },

    headerRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },

    statusPill: {
      borderWidth:
        1,

      borderRadius:
        999,

      paddingHorizontal:
        10,

      paddingVertical:
        4,
    },

    statusText: {
      fontSize:
        10,

      fontWeight:
        "800",

      letterSpacing:
        1.2,
    },

    closeText: {
      color:
        colors.textSecondary,

      fontSize:
        11,

      fontWeight:
        "700",

      letterSpacing:
        1.2,
    },

    title: {
      color:
        colors.text,

      fontSize:
        24,

      fontWeight:
        "700",

      lineHeight:
        30,

      marginTop:
        16,
    },

    orgLogo: {
      marginTop:
        12,
    },

    details: {
      marginTop:
        20,

      borderTopWidth:
        1,

      borderTopColor:
        colors.border,
    },

    detailRow: {
      flexDirection:
        "row",

      paddingVertical:
        14,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.border,
    },

    detailLabel: {
      width:
        96,

      color:
        colors.muted,

      fontSize:
        10,

      fontWeight:
        "700",

      letterSpacing:
        1.3,

      paddingTop:
        3,
    },

    detailValueWrap: {
      flex:
        1,
    },

    detailValue: {
      color:
        colors.text,

      fontSize:
        15,

      fontWeight:
        "600",

      lineHeight:
        21,
    },
  });
