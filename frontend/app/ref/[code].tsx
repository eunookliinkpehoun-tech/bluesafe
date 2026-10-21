import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

/** Deep link tirelire://ref/CODE: remembers the sponsor code, then continues to the app. */
export default function ReferralLink() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { setPendingRefCode } = useApp();

  useEffect(() => {
    setPendingRefCode(String(code ?? "").toUpperCase()).then(() => router.replace("/"));
  }, [code, setPendingRefCode]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.brandPrimary} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.canvas },
}));
