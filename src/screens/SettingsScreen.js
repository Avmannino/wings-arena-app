import {
  Alert,
  Image,
  StyleSheet,
  Switch,
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
  requestNotificationPermission,
} from "../services/notifications";

import {
  colors,
} from "../theme";

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) {
  return (
    <View
      style={[
        styles.settingRow,

        disabled &&
          styles.disabledRow,
      ]}
    >
      <View
        style={
          styles.settingCopy
        }
      >
        <Text
          style={
            styles.settingLabel
          }
        >
          {label}
        </Text>

        {description ? (
          <Text
            style={
              styles.settingDescription
            }
          >
            {description}
          </Text>
        ) : null}
      </View>

      <Switch
        value={
          value
        }

        onValueChange={
          onValueChange
        }

        disabled={
          disabled
        }

        trackColor={{
          false:
            colors.border,

          true:
            colors.accentSoft,
        }}

        thumbColor={
          value
            ? colors.accent
            : colors.muted
        }
      />
    </View>
  );
}

export default function SettingsScreen() {
  const {
    meta,
    preferences,
    updatePreferences,
    scheduledNotificationCount,
  } = useSchedule();

  async function handleMasterNotificationToggle(
    nextValue
  ) {
    if (
      !nextValue
    ) {
      await updatePreferences(
        {
          notificationsEnabled:
            false,
        }
      );

      return;
    }

    const allowed =
      await requestNotificationPermission();

    if (
      !allowed
    ) {
      Alert.alert(
        "Notifications are off",

        "iPhone notification permission was not granted. You can enable it later in iOS Settings."
      );

      return;
    }

    await updatePreferences(
      {
        notificationsEnabled:
          true,
      }
    );
  }

  const disabled =
    !preferences.notificationsEnabled;

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
          styles.content
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
          Settings
        </Text>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Event alerts
        </Text>

        <View
          style={
            styles.card
          }
        >
          <SettingRow
            label="15-minute alerts"

            description="Schedule local iPhone notifications before upcoming rink events."

            value={
              preferences.notificationsEnabled
            }

            onValueChange={
              handleMasterNotificationToggle
            }
          />

          <View
            style={
              styles.separator
            }
          />

          <SettingRow
            label="Wings programs"

            description="Public Skate, Cosmic Skate, Stick & Puck and other Wings calendar events."

            value={
              preferences.notifyWings
            }

            onValueChange={(
              value
            ) =>
              updatePreferences(
                {
                  notifyWings:
                    value,
                }
              )
            }

            disabled={
              disabled
            }
          />

          <View
            style={
              styles.separator
            }
          />

          <SettingRow
            label="GSC"

            description="Greenwich Skating Club practices, games and figure skating at Wings."

            value={
              preferences.notifyGSC
            }

            onValueChange={(
              value
            ) =>
              updatePreferences(
                {
                  notifyGSC:
                    value,
                }
              )
            }

            disabled={
              disabled
            }
          />

          <View
            style={
              styles.separator
            }
          />

          <SettingRow
            label="Stateline"

            description="Stateline events returned by the GSC Crossbar schedule at Wings."

            value={
              preferences.notifyStateline
            }

            onValueChange={(
              value
            ) =>
              updatePreferences(
                {
                  notifyStateline:
                    value,
                }
              )
            }

            disabled={
              disabled
            }
          />
        </View>

        <Text
          style={
            styles.alertSummary
          }
        >
          {preferences.notificationsEnabled
            ? `${scheduledNotificationCount} upcoming alerts are currently scheduled on this device.`
            : "Event alerts are currently off."}
        </Text>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Data sources
        </Text>

        <View
          style={
            styles.card
          }
        >
          <View
            style={
              styles.sourceRow
            }
          >
            <View>
              <Text
                style={
                  styles.sourceTitle
                }
              >
                Wings public calendar
              </Text>

              <Text
                style={
                  styles.sourceSubtitle
                }
              >
                Google Calendar /
                EZFacility pipeline
              </Text>
            </View>

            <Text
              style={
                styles.sourceCount
              }
            >
              {meta?.scheduleCount ??
                "—"}
            </Text>
          </View>

          <View
            style={
              styles.separator
            }
          />

          <View
            style={
              styles.sourceRow
            }
          >
            <View>
              <Text
                style={
                  styles.sourceTitle
                }
              >
                GSC Crossbar
              </Text>

              <Text
                style={
                  styles.sourceSubtitle
                }
              >
                Wings Arena facility
                events only
              </Text>
            </View>

            <Text
              style={
                styles.sourceCount
              }
            >
              {meta?.crossbarCount ??
                "—"}
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.note
          }
        >
          Local notifications are
          rebuilt whenever the app
          refreshes the seven-day
          schedule. Push alerts that
          update without opening the
          app can be added in the next
          phase.
        </Text>
      </View>
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

    content: {
      flex:
        1,

      paddingHorizontal:
        18,

      paddingTop:
        14,
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
        30,

      fontWeight:
        "900",

      marginTop:
        3,
    },

    sectionTitle: {
      color:
        colors.text,

      fontSize:
        16,

      fontWeight:
        "800",

      marginTop:
        26,

      marginBottom:
        10,
    },

    card: {
      backgroundColor:
        colors.surface,

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        18,

      overflow:
        "hidden",
    },

    settingRow: {
      minHeight:
        78,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        15,

      paddingHorizontal:
        16,

      paddingVertical:
        13,
    },

    disabledRow: {
      opacity:
        0.45,
    },

    settingCopy: {
      flex:
        1,
    },

    settingLabel: {
      color:
        colors.text,

      fontSize:
        15,

      fontWeight:
        "700",
    },

    settingDescription: {
      color:
        colors.muted,

      fontSize:
        12,

      lineHeight:
        17,

      marginTop:
        4,
    },

    separator: {
      height:
        1,

      backgroundColor:
        colors.border,

      marginLeft:
        16,
    },

    alertSummary: {
      color:
        colors.muted,

      fontSize:
        12,

      lineHeight:
        18,

      marginTop:
        10,

      paddingHorizontal:
        3,
    },

    sourceRow: {
      minHeight:
        70,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        16,

      paddingVertical:
        12,
    },

    sourceTitle: {
      color:
        colors.text,

      fontSize:
        14,

      fontWeight:
        "700",
    },

    sourceSubtitle: {
      color:
        colors.muted,

      fontSize:
        11,

      marginTop:
        4,
    },

    sourceCount: {
      color:
        colors.accent,

      fontSize:
        18,

      fontWeight:
        "900",
    },

    note: {
      color:
        colors.muted,

      fontSize:
        11,

      lineHeight:
        17,

      marginTop:
        14,
    },
  });