import {
  useLayoutEffect,
  useRef,
} from "react";

import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import {
  useIsFocused,
} from "@react-navigation/native";

let firstScreenShown =
  false;

let lastTabIndex = 0;

export default function withSlideIn(
  Screen
) {
  function SlideInScreen(
    props
  ) {
    const isFocused =
      useIsFocused();

    const {
      width,
    } =
      useWindowDimensions();

    const widthRef =
      useRef(width);

    widthRef.current =
      width;

    const translateX =
      useRef(
        new Animated.Value(0)
      ).current;

    useLayoutEffect(() => {
      if (!isFocused) {
        return;
      }

      const tabIndex =
        props.navigation.getState()
          .index;

      if (
        !firstScreenShown
      ) {
        firstScreenShown =
          true;

        lastTabIndex =
          tabIndex;

        return;
      }

      const direction =
        tabIndex >=
        lastTabIndex
          ? 1
          : -1;

      lastTabIndex =
        tabIndex;

      translateX.setValue(
        direction *
          widthRef.current
      );

      Animated.timing(
        translateX,
        {
          toValue: 0,
          duration: 280,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ).start();
    }, [
      isFocused,
      translateX,
    ]);

    return (
      <Animated.View
        style={[
          styles.fill,
          {
            transform: [
              {
                translateX,
              },
            ],
          },
        ]}
      >
        <Screen
          {...props}
        />
      </Animated.View>
    );
  }

  SlideInScreen.displayName =
    `SlideIn(${
      Screen.displayName ||
      Screen.name ||
      "Screen"
    })`;

  return SlideInScreen;
}

const styles =
  StyleSheet.create({
    fill: {
      flex:
        1,
    },
  });
