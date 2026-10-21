import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { View } from "react-native";

import { FloatingTabBar } from "@/src/components/FloatingTabBar";
import { OverlayHost } from "@/src/components/OverlayHost";
import { useApp } from "@/src/state/app";
import { OverlayProvider } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";

export default function TabsLayout() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { status } = useApp();
  if (status !== "ready" && status !== "demo") return <Redirect href="/" />;

  return (
    <OverlayProvider>
      <View style={styles.root}>
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{ headerShown: false, animation: "fade", sceneStyle: { backgroundColor: colors.canvas } }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="history" />
          <Tabs.Screen name="team" />
          <Tabs.Screen name="subaccounts" options={{ href: null }} />
        </Tabs>
        <OverlayHost />
      </View>
    </OverlayProvider>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
}));
