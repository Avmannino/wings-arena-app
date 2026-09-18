import {
  NavigationContainer,
  DarkTheme,
} from "@react-navigation/native";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  StatusBar,
} from "expo-status-bar";

import {
  SafeAreaProvider,
} from "react-native-safe-area-context";

import {
  EventDetailProvider,
} from "./src/context/EventDetailContext";

import {
  ScheduleProvider,
} from "./src/context/ScheduleContext";

import withSlideIn from "./src/components/withSlideIn";

import HomeScreen from "./src/screens/HomeScreen";
import ScheduleScreen from "./src/screens/ScheduleScreen";
import IceCutsScreen from "./src/screens/IceCutsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

import {
  colors,
} from "./src/theme";

const Tab =
  createBottomTabNavigator();

const AnimatedHomeScreen =
  withSlideIn(HomeScreen);

const AnimatedScheduleScreen =
  withSlideIn(ScheduleScreen);

const AnimatedIceCutsScreen =
  withSlideIn(IceCutsScreen);

const AnimatedSettingsScreen =
  withSlideIn(SettingsScreen);

const navigationTheme = {
  ...DarkTheme,

  colors: {
    ...DarkTheme.colors,

    primary:
      colors.accent,

    background:
      colors.background,

    card:
      colors.surface,

    text:
      colors.text,

    border:
      colors.border,

    notification:
      colors.red,
  },
};

function getTabIcon(
  routeName,
  focused
) {
  if (
    routeName === "Home"
  ) {
    return focused
      ? "home"
      : "home-outline";
  }

  if (
    routeName === "Schedule"
  ) {
    return focused
      ? "calendar"
      : "calendar-outline";
  }

  if (
    routeName === "Ice Cuts"
  ) {
    return focused
      ? "snow"
      : "snow-outline";
  }

  return focused
    ? "settings"
    : "settings-outline";
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ScheduleProvider>
        <EventDetailProvider>
        <NavigationContainer
          theme={
            navigationTheme
          }
        >
          <StatusBar
            style="light"
          />

          <Tab.Navigator
            screenOptions={({
              route,
            }) => ({
              headerShown:
                false,

              sceneStyle: {
                overflow:
                  "hidden",

                backgroundColor:
                  colors.background,
              },

              tabBarActiveTintColor:
                colors.text,

              tabBarInactiveTintColor:
                colors.muted,

              tabBarStyle: {
                backgroundColor:
                  "#0B1016",

                borderTopWidth:
                  1,

                borderTopColor:
                  colors.border,

                height:
                  88,

                paddingTop:
                  10,

                paddingBottom:
                  16,

                elevation:
                  0,

                shadowOpacity:
                  0,
              },

              tabBarLabelStyle: {
                fontSize:
                  11,

                fontWeight:
                  "600",

                marginTop:
                  1,
              },

              tabBarIcon: ({
                color,
                size,
                focused,
              }) => (
                <Ionicons
                  name={getTabIcon(
                    route.name,
                    focused
                  )}
                  size={
                    focused
                      ? size
                      : size - 1
                  }
                  color={color}
                />
              ),
            })}
          >
            <Tab.Screen
              name="Home"
              component={
                AnimatedHomeScreen
              }
            />

            <Tab.Screen
              name="Schedule"
              component={
                AnimatedScheduleScreen
              }
            />

            <Tab.Screen
              name="Ice Cuts"
              component={
                AnimatedIceCutsScreen
              }
            />

            <Tab.Screen
              name="Settings"
              component={
                AnimatedSettingsScreen
              }
            />
          </Tab.Navigator>
        </NavigationContainer>
        </EventDetailProvider>
      </ScheduleProvider>
    </SafeAreaProvider>
  );
}