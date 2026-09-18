import {
  Image,
  StyleSheet,
  View,
} from "react-native";

const LOGOS = {
  wings: {
    source: require(
      "../../assets/wings-alt-logo.png"
    ),
    aspect: 1,
    scale: 1.3,
    label: "Wings Arena",
  },

  gsc: {
    source: require(
      "../../assets/gsc-logo.png"
    ),
    aspect: 500 / 313,
    scale: 1,
    label: "GSC",
  },

  stateline: {
    source: require(
      "../../assets/stateline-logo.png"
    ),
    aspect: 1,
    scale: 1.4,
    label: "Stateline",
  },
};

function getLogo(
  organization
) {
  if (
    organization ===
    "Stateline"
  ) {
    return LOGOS.stateline;
  }

  if (
    organization ===
    "GSC"
  ) {
    return LOGOS.gsc;
  }

  return LOGOS.wings;
}

export default function OrganizationLogo({
  organization,
  height = 22,
  style,
}) {
  const logo =
    getLogo(
      organization
    );

  return (
    <View
      style={[
        styles.frame,
        {
          height,
          width:
            height *
            logo.aspect,
        },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        logo.label
      }
    >
      <Image
        source={
          logo.source
        }
        resizeMode="contain"
        style={[
          styles.image,
          logo.scale !== 1 && {
            transform: [
              {
                scale:
                  logo.scale,
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    frame: {
      overflow:
        "visible",
    },

    image: {
      width:
        "100%",

      height:
        "100%",
    },
  });
