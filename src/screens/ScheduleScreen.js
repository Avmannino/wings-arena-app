import {
  useMemo,
} from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  formatDateHeadingFromKey,
  formatTime,
  getEasternDateKey,
} from "../utils/dateTime";

import LockerDisplay from "../components/LockerDisplay";

import OrganizationLogo from "../components/OrganizationLogo";

import {
  useEventDetail,
} from "../context/EventDetailContext";

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

function EventRow({
  event,
  tinted,
}) {
  const {
    openEvent,
  } = useEventDetail();

  const organizationColor =
    getOrganizationColor(
      event.organization
    );

  return (
    <Pressable
      style={[
        styles.eventRow,
        tinted &&
          styles.eventRowTinted,
      ]}
      onPress={() =>
        openEvent(
          event
        )
      }
    >
      <View
        style={
          styles.timeColumn
        }
      >
        <Text
          style={
            styles.startTime
          }
        >
          {formatTime(
            event.start
          )}
        </Text>

        <Text
          style={
            styles.endTime
          }
        >
          {formatTime(
            event.end
          )}
        </Text>
      </View>

      <View
        style={
          styles.timelineColumn
        }
      >
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor:
                organizationColor,
            },
          ]}
        />

        <View
          style={
            styles.timelineLine
          }
        />
      </View>

      <View
        style={
          styles.eventDetails
        }
      >
        <Text
          style={
            styles.eventTitle
          }
        >
          {event.title}
        </Text>

        <View
          style={
            styles.metaRow
          }
        >
          <OrganizationLogo
            organization={
              event.organization
            }
            height={
              18
            }
          />

          {event.type ? (
            <>
              <View
                style={
                  styles.metaDot
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

        <LockerDisplay
          size="sm"
          lockerNumber={
            event.lockerNumber
          }
          style={
            styles.lockerBlock
          }
        />
      </View>
    </Pressable>
  );
}

export default function ScheduleScreen({
  navigation,
}) {
  const {
    events,
    loading,
    refreshing,
    error,
    refresh,
  } = useSchedule();

  const sections =
    useMemo(
      () => {
        const todayKey =
          getEasternDateKey();

        const grouped =
          new Map();

        for (
          const event of
          events
        ) {
          const key =
            getEasternDateKey(
              event.start
            );

          if (
            key <
            todayKey
          ) {
            continue;
          }

          if (
            !grouped.has(
              key
            )
          ) {
            grouped.set(
              key,
              []
            );
          }

          grouped
            .get(key)
            .push(
              event
            );
        }

        return [
          ...grouped.entries(),
        ].map(
          (
            [
              key,
              data,
            ],
            index
          ) => ({
            key,

            title:
              key ===
              todayKey
                ? `${formatDateHeadingFromKey(
                    key
                  )} (Today)`
                : formatDateHeadingFromKey(
                    key
                  ),

            colorIndex:
              index % 2,

            data,
          })
        );
      },

      [events]
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
      <View
        style={
          styles.header
        }
      >
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

      {loading &&
      !events.length ? (
        <View
          style={
            styles.loading
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
      ) : (
        <SectionList
          sections={
            sections
          }

          keyExtractor={(
            item
          ) =>
            item.id
          }

          renderItem={({
            item,
            section,
          }) => (
            <EventRow
              event={
                item
              }
              tinted={
                section
                  .colorIndex ===
                1
              }
            />
          )}

          renderSectionHeader={({
            section,
          }) => (
            <View
              style={[
                styles.sectionHeader,
                section.colorIndex ===
                  1 &&
                  styles.sectionHeaderTinted,
              ]}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                {section.title}
              </Text>

              <Text
                style={
                  styles.sectionCount
                }
              >
                {
                  section
                    .data
                    .length
                }{" "}
                events
              </Text>
            </View>
          )}

          renderSectionFooter={() => (
            <View
              style={
                styles.sectionFooter
              }
            />
          )}

          contentContainerStyle={
            styles.listContent
          }

          showsVerticalScrollIndicator={
            false
          }

          stickySectionHeadersEnabled

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

          ListHeaderComponent={
            error ? (
              <View
                style={
                  styles.errorBox
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
            ) : null
          }

          ListEmptyComponent={
            <View
              style={
                styles.empty
              }
            >
              <Text
                style={
                  styles.emptyText
                }
              >
                No events returned for
                the next seven days.
              </Text>
            </View>
          }
        />
      )}
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

    header: {
      paddingHorizontal:
        20,

      paddingTop:
        12,

      paddingBottom:
        2,
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

      marginBottom:
        10,
    },

    headerLogoButton: {
      alignSelf:
        "flex-start",
    },

    listContent: {
      paddingBottom:
        36,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      backgroundColor:
        colors.background,

      paddingHorizontal:
        20,

      paddingTop:
        8,

      paddingBottom:
        8,
    },

    sectionFooter: {
      height:
        20,
    },

    sectionHeaderTinted: {
      backgroundColor:
        colors.surface,
    },

    sectionTitle: {
      color:
        colors.text,

      fontSize:
        16,

      fontWeight:
        "800",
    },

    sectionCount: {
      color:
        colors.muted,

      fontSize:
        10,

      fontWeight:
        "600",
    },

    eventRow: {
      flexDirection:
        "row",

      minHeight:
        82,

      paddingHorizontal:
        20,
    },

    eventRowTinted: {
      backgroundColor:
        colors.surface,
    },

    timeColumn: {
      width:
        68,

      paddingTop:
        2,
    },

    startTime: {
      color:
        colors.text,

      fontSize:
        13,

      fontWeight:
        "650",
    },

    endTime: {
      color:
        colors.muted,

      fontSize:
        10,

      marginTop:
        3,
    },

    timelineColumn: {
      width:
        20,

      alignItems:
        "center",
    },

    timelineDot: {
      width:
        7,

      height:
        7,

      borderRadius:
        8,

      marginTop:
        5,
    },

    timelineLine: {
      width:
        1,

      flex:
        1,

      backgroundColor:
        colors.border,

      marginTop:
        5,
    },

    eventDetails: {
      flex:
        1,

      paddingLeft:
        10,

      paddingBottom:
        22,
    },

    eventTitle: {
      color:
        colors.text,

      fontSize:
        14,

      fontWeight:
        "600",

      lineHeight:
        19,
    },

    metaRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      flexWrap:
        "wrap",

      rowGap:
        4,

      marginTop:
        7,
    },

    metaDot: {
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

    lockerBlock: {
      marginTop:
        8,
    },

    eventType: {
      color:
        colors.muted,

      fontSize:
        13,
    },

    loading: {
      flex:
        1,

      justifyContent:
        "center",

      alignItems:
        "center",

      gap:
        10,
    },

    loadingText: {
      color:
        colors.muted,

      fontSize:
        12,
    },

    errorBox: {
      backgroundColor:
        colors.redSoft,

      borderWidth:
        1,

      borderColor:
        "#47262C",

      borderRadius:
        10,

      padding:
        15,

      marginTop:
        12,

      marginHorizontal:
        20,
    },

    errorTitle: {
      color:
        colors.text,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    errorText: {
      color:
        colors.textSecondary,

      fontSize:
        11,

      lineHeight:
        17,

      marginTop:
        4,
    },

    empty: {
      paddingVertical:
        70,

      paddingHorizontal:
        20,

      alignItems:
        "center",
    },

    emptyText: {
      color:
        colors.muted,

      fontSize:
        13,
    },
  });