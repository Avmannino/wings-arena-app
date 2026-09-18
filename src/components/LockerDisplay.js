import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
} from "../theme";

import {
  parseLockerEntries,
} from "../utils/lockers";

const SIZES = {
  md: {
    gap: 8,
    label: 14,
    badgeText: 14,
    badgeBorder: 1.5,
    badgeRadius: 6,
    badgePadX: 10,
    badgePadY: 3,
    comma: 16,
    rest: 12,
  },

  sm: {
    gap: 8,
    label: 11,
    badgeText: 11,
    badgeBorder: 1,
    badgeRadius: 5,
    badgePadX: 7,
    badgePadY: 1,
    comma: 12,
    rest: 10,
  },

  xs: {
    gap: 6,
    label: 11,
    badgeText: 11,
    badgeBorder: 1,
    badgeRadius: 5,
    badgePadX: 6,
    badgePadY: 1,
    comma: 12,
    rest: 10,
  },
};

export default function LockerDisplay({
  lockerNumber,
  size = "md",
  stacked = false,
  style,
}) {
  const entries =
    parseLockerEntries(
      lockerNumber
    );

  if (!entries.length) {
    return null;
  }

  const dims =
    SIZES[size] ||
    SIZES.md;

  const badgeStyle = {
    borderWidth:
      dims.badgeBorder,
    borderRadius:
      dims.badgeRadius,
    paddingHorizontal:
      dims.badgePadX,
    paddingVertical:
      dims.badgePadY,
  };

  if (stacked) {
    return (
      <View
        style={[
          styles.stack,
          style,
        ]}
      >
        {entries.map(
          (entry, index) => (
            <View
              key={
                index
              }
              style={
                styles.stackRow
              }
            >
              <View
                style={[
                  styles.badge,
                  badgeStyle,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      fontSize:
                        dims.badgeText,
                    },
                  ]}
                >
                  {entry.id}
                </Text>
              </View>

              {entry.rest.trim() ? (
                <Text
                  style={[
                    styles.rest,
                    {
                      fontSize:
                        dims.rest,
                    },
                  ]}
                >
                  {entry.rest.trim()}
                </Text>
              ) : null}
            </View>
          )
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize:
              dims.label,
            marginBottom:
              dims.gap + 3,
          },
        ]}
      >
        LOCKERS
      </Text>

      <View
        style={[
          styles.row,
          {
            gap:
              dims.gap,
          },
        ]}
      >
        {entries.map(
          (entry, index) => (
            <View
              key={
                index
              }
              style={[
                styles.entry,
                {
                  gap:
                    dims.gap,
                },
              ]}
            >
              <View
                style={[
                  styles.badge,
                  badgeStyle,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      fontSize:
                        dims.badgeText,
                    },
                  ]}
                >
                  {entry.id}
                </Text>
              </View>

              {entry.rest.trim() ? (
                <Text
                  style={[
                    styles.rest,
                    styles.restInline,
                    {
                      fontSize:
                        dims.rest,
                    },
                  ]}
                >
                  {entry.rest.trim()}
                </Text>
              ) : null}

              {index <
              entries.length -
                1 ? (
                <Text
                  style={[
                    styles.comma,
                    {
                      fontSize:
                        dims.comma,
                    },
                  ]}
                >
                  ,
                </Text>
              ) : null}
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      alignSelf:
        "flex-start",

      maxWidth:
        "100%",
    },

    row: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",
    },

    entry: {
      flexDirection:
        "row",

      alignItems:
        "center",

      flexShrink:
        1,
    },

    stack: {
      gap:
        8,
    },

    stackRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,
    },

    label: {
      color:
        colors.text,

      fontWeight:
        "800",

      letterSpacing:
        1,
    },

    badge: {
      backgroundColor:
        colors.wingsSoft,

      borderColor:
        colors.wings,
    },

    badgeText: {
      color:
        colors.text,

      fontWeight:
        "800",
    },

    comma: {
      color:
        colors.muted,

      fontWeight:
        "700",
    },

    rest: {
      color:
        colors.textSecondary,

      fontWeight:
        "600",
    },

    restInline: {
      flexShrink:
        1,
    },
  });
