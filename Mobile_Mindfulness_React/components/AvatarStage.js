import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AvatarStage() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Avatar Preview</Text>
      <Text style={styles.body}>
        The live Three.js avatar is available on the iOS and Android app build. On web, this panel
        falls back to a static preview so the rest of the app still renders cleanly.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#173b31",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 10
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center"
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: "#d9ede6",
    textAlign: "center"
  }
});
