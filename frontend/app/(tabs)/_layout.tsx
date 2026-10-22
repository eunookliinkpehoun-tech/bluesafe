import { Tabs } from "expo-router/js-tabs";
import { View } from "react-native";

import { FloatingTabBar } from "@/src/components/FloatingTabBar";
import { OverlayHost } from "@/src/components/OverlayHost";
import { OverlayProvider } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";

// Access control lives in the root layout guard: keeping the navigator mounted here
// avoids an update loop when the wallet is locked or the demo is closed.
export default function TabsLayout() {
  const styles = useStyles();
  const { colors } = useTheme();

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
