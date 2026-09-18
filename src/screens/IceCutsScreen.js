import {
  useMemo,
  useRef,
  useState,
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

function IceCutRow({
  cut,
  tinted,
  dayStart,
}) {
  const organizationColor =
    getOrganizationColor(
      cut.afterOrganization
    );

  return (
    <View
      style={[
        styles.cutRow,
        tinted &&
          styles.cutRowTinted,
        dayStart &&
          styles.cutRowDayStart,
      ]}
    >
      <View
        style={
          styles.timeColumn
        }
      >
        <Text
          style={
            styles.cutTime
          }
        >
          {formatTime(
            cut.time
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
          styles.cutDetails
        }
      >
        <Text
          style={
            styles.cutLabel
          }
        >
          Ice cut
        </Text>

        <Text
          style={
            styles.cutSubtitle
          }
        >
          After{" "}
          {cut.afterTitle}
        </Text>
      </View>
    </View>
  );
}

export default function IceCutsScreen() {
  const {
    events,
    loading,
    refreshing,
    error,
    refresh,
  } = useSchedule();

  const cuts =
    useMemo(
      () =>
        computeIceCuts(
          events
        ),

      [events]
    );

  const sections =
    useMemo(
      () => {
        const todayKey =
          getEasternDateKey();

        const grouped =
          new Map();

        for (
          const cut of
          cuts
        ) {
          const key =
            getEasternDateKey(
              cut.time
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
              cut
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

            first:
              index === 0,

            data,
          })
        );
      },

      [cuts]
    );

  const [
    currentSectionKey,
    setCurrentSectionKey,
  ] =
    useState(
      null
    );

  const currentSection =
    useMemo(
      () =>
        sections.find(
          (section) =>
            section.key ===
            currentSectionKey
        ) ||
        sections[0] ||
        null,

      [
        sections,
        currentSectionKey,
      ]
    );

  const onViewableItemsChanged =
    useRef(
      ({
        viewableItems,
      }) => {
        const firstVisible =
          viewableItems.find(
            (viewable) =>
              viewable.isViewable &&
              viewable.section
          );

        if (
          firstVisible
            ?.section
            ?.key
        ) {
          setCurrentSectionKey(
            firstVisible
              .section
              .key
          );
        }
      }
    ).current;

  const viewabilityConfig =
    useRef({
      itemVisiblePercentThreshold: 1,
    }).current;

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
            "../../assets/wings-logo.png"
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
          Ice Cuts
        </Text>
      </View>

      {currentSection &&
      !(
        loading &&
        !events.length
      ) ? (
        <View
          style={[
            styles.sectionHeader,
            currentSection
              .colorIndex ===
              1 &&
              styles.sectionHeaderTinted,
          ]}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {
              currentSection.title
            }
          </Text>

          <Text
            style={
              styles.sectionCount
            }
          >
            {
              currentSection
                .data
                .length
            }{" "}
            cuts
          </Text>
        </View>
      ) : null}

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
            index,
            section,
          }) => (
            <IceCutRow
              cut={
                item
              }
              tinted={
                section
                  .colorIndex ===
                1
              }
              dayStart={
                index ===
                  0 &&
                !section.first
              }
            />
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

          onViewableItemsChanged={
            onViewableItemsChanged
          }

          viewabilityConfig={
            viewabilityConfig
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
                No ice cuts scheduled
                for the next seven
                days.
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
        28,

      aspectRatio:
        1925 / 342,

      alignSelf:
        "flex-start",

      marginBottom:
        26,
    },

    title: {
      color:
        colors.text,

      fontSize:
        23,

      fontWeight:
        "700",

      letterSpacing:
        -0.6,
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

      marginBottom:
        4,
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

    cutRow: {
      flexDirection:
        "row",

      minHeight:
        58,

      paddingHorizontal:
        20,
    },

    cutRowTinted: {
      backgroundColor:
        colors.surface,
    },

    cutRowDayStart: {
      marginTop:
        20,
    },

    timeColumn: {
      width:
        68,

      paddingTop:
        2,
    },

    cutTime: {
      color:
        colors.text,

      fontSize:
        13,

      fontWeight:
        "650",
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

    cutDetails: {
      flex:
        1,

      paddingLeft:
        10,

      paddingBottom:
        16,
    },

    cutLabel: {
      color:
        colors.text,

      fontSize:
        14,

      fontWeight:
        "600",

      lineHeight:
        19,
    },

    cutSubtitle: {
      color:
        colors.muted,

      fontSize:
        11,

      marginTop:
        3,
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

      textAlign:
        "center",
    },
  });
