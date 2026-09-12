import {
  Fragment,
  useMemo,
} from "react";

import {
  ActivityIndicator,
  Image,
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

import {
  parseLockerEntries,
} from "../utils/lockers";

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

function EventRow({
  event,
}) {
  const organizationColor =
    getOrganizationColor(
      event.organization
    );

  return (
    <View
      style={
        styles.eventRow
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
          <Text
            style={[
              styles.organization,
              {
                color:
                  organizationColor,
              },
            ]}
          >
            {getOrganizationLabel(
              event.organization
            )}
          </Text>

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

          {event.lockerNumber ? (
            <>
              <View
                style={
                  styles.metaDot
                }
              />

              <Text
                style={
                  styles.lockerText
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
                          styles.lockerValue
                        }
                      >
                        {entry.id}
                      </Text>
                      {entry.rest}
                    </Fragment>
                  )
                )}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
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
          ([
            key,
            data,
          ]) => ({
            key,

            title:
              formatDateHeadingFromKey(
                key
              ),

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
        <Image
          source={require(
            "../../assets/wings+.png"
          )}
          style={
            styles.headerLogo
          }
          resizeMode="contain"
        />

        <Text
          style={
            styles.title
          }
        >
          Schedule
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Combined Wings, GSC and
          Stateline events
        </Text>
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
          }) => (
            <EventRow
              event={
                item
              }
            />
          )}

          renderSectionHeader={({
            section,
          }) => (
            <View
              style={
                styles.sectionHeader
              }
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

          contentContainerStyle={
            styles.listContent
          }

          showsVerticalScrollIndicator={
            false
          }

          stickySectionHeadersEnabled={
            false
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
        18,

      paddingBottom:
        8,
    },

    headerLogo: {
      height:
        28,

      aspectRatio:
        1925 / 342,

      alignSelf:
        "flex-start",
    },

    title: {
      color:
        colors.text,

      fontSize:
        31,

      fontWeight:
        "700",

      letterSpacing:
        -0.8,

      marginTop:
        4,
    },

    subtitle: {
      color:
        colors.textSecondary,

      fontSize:
        12,

      marginTop:
        5,
    },

    listContent: {
      paddingHorizontal:
        20,

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

      marginTop:
        28,

      marginBottom:
        12,

      paddingBottom:
        9,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.border,
    },

    sectionTitle: {
      color:
        colors.text,

      fontSize:
        16,

      fontWeight:
        "650",
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

      marginTop:
        7,
    },

    organization: {
      fontSize:
        9,

      fontWeight:
        "700",

      letterSpacing:
        0.7,
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

    eventType: {
      color:
        colors.muted,

      fontSize:
        10,
    },

    lockerText: {
      color:
        colors.textSecondary,

      fontSize:
        10,

      fontWeight:
        "700",
    },

    lockerValue: {
      color:
        colors.wings,
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