import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";

const DURATION = 260;

export default function Collapsible({
  expanded,
  children,
}) {
  const [
    contentHeight,
    setContentHeight,
  ] = useState(0);

  const [
    measured,
    setMeasured,
  ] = useState(false);

  const progress =
    useRef(
      new Animated.Value(
        expanded ? 1 : 0
      )
    ).current;

  useEffect(() => {
    Animated.timing(
      progress,
      {
        toValue: expanded
          ? 1
          : 0,
        duration: DURATION,
        easing: expanded
          ? Easing.out(
              Easing.cubic
            )
          : Easing.in(
              Easing.cubic
            ),
        useNativeDriver: false,
      }
    ).start();
  }, [expanded, progress]);

  const handleLayout = (
    event
  ) => {
    const height =
      event.nativeEvent
        .layout.height;

    if (height > 0) {
      setContentHeight(
        height
      );

      setMeasured(true);
    }
  };

  const outerStyle =
    measured
      ? {
          height:
            progress.interpolate(
              {
                inputRange: [
                  0, 1,
                ],
                outputRange: [
                  0,
                  contentHeight,
                ],
              }
            ),
        }
      : expanded
        ? null
        : styles.collapsed;

  return (
    <Animated.View
      style={[
        styles.outer,
        outerStyle,
      ]}
      pointerEvents={
        expanded
          ? "auto"
          : "none"
      }
      accessibilityElementsHidden={
        !expanded
      }
      importantForAccessibility={
        expanded
          ? "auto"
          : "no-hide-descendants"
      }
    >
      <Animated.View
        onLayout={
          handleLayout
        }
        style={[
          measured ||
          !expanded
            ? styles.measure
            : null,
          {
            opacity: progress,
            transform: [
              {
                translateY:
                  progress.interpolate(
                    {
                      inputRange: [
                        0, 1,
                      ],
                      outputRange:
                        [-14, 0],
                    }
                  ),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles =
  StyleSheet.create({
    outer: {
      overflow:
        "hidden",
    },

    collapsed: {
      height: 0,
    },

    measure: {
      position:
        "absolute",

      left: 0,
      right: 0,
    },
  });
