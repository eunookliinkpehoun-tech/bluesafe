import "react-native-get-random-values";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { ToastProvider } from "@/src/components/Toast";
import { I18nProvider, useI18n } from "@/src/i18n";
import { queryClient } from "@/src/query-client";
import { AppProvider } from "@/src/state/app";
import { dirStyle, makeStyles, useTheme, webDir } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

function Shell() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  return (
    <View style={[styles.root, dirStyle(isRTL ? "rtl" : "ltr")]} {...webDir(isRTL ? "rtl" : "ltr")}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.canvas } }} />
    </View>
  );
}

export default function RootLayout() {
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
