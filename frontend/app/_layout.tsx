import "@/src/polyfills";

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack, useRootNavigationState, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { ToastProvider } from "@/src/components/Toast";
import { useRelayStatusQuery, useVaultView } from "@/src/hooks/useVault";
import { I18nProvider, useI18n } from "@/src/i18n";
import { ensurePushRegistered } from "@/src/lib/push";
import { queryClient } from "@/src/query-client";
import { AppProvider, useApp } from "@/src/state/app";
import { dirStyle, fontAssets, makeStyles, useTheme, webDir } from "@/src/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Routes that need an unlocked wallet. The splash ("/") does its own routing.
const PROTECTED = new Set(["(tabs)", "activate", "setup"]);

/** Single place that sends the user to the PIN screen or to Welcome, whatever route is open (deep link, reload, lock, sign out). */
function useAuthGuard() {
  const { status } = useApp();
  const segments = useSegments();
  const navReady = !!useRootNavigationState()?.key;
  const first = segments[0] as string | undefined;

  useEffect(() => {
    if (!navReady || status === "loading" || !first) return;
    if (status === "locked" && first !== "pin") router.replace({ pathname: "/pin", params: { mode: "unlock" } });
    else if (status === "none" && PROTECTED.has(first)) router.replace("/welcome");
  }, [navReady, status, first]);
}

function Shell() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, lang } = useI18n();
  const { view } = useVaultView();
  const segments = useSegments();
  useRelayStatusQuery();
  useAuthGuard();
  useEffect(() => {
    const first = segments[0] as string | undefined;
    if (first && first !== "index") SplashScreen.hideAsync().catch(() => undefined);
  }, [segments]);
  useEffect(() => {
    if (!view?.vault) return;
    ensurePushRegistered(view.vault, lang).catch(() => undefined);
  }, [view?.vault, lang]);
  return (
    <View style={[styles.root, dirStyle(isRTL ? "rtl" : "ltr")]} {...webDir(isRTL ? "rtl" : "ltr")}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.canvas } }} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  if (!fontsLoaded && !fontError) return null;

  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app.
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <I18nProvider>
            <AppProvider>
              <ToastProvider>
                <Shell />
              </ToastProvider>
            </AppProvider>
          </I18nProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
}));
