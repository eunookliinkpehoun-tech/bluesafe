import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "./Icon";

type ToastType = "success" | "error" | "info";
type Ctx = { show: (message: string, type?: ToastType) => void };
const ToastContext = createContext<Ctx>({ show: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, type });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const tint = toast?.type === "error" ? colors.accentRose : toast?.type === "info" ? colors.accentBlue : colors.accentEmerald;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
          <Animated.View key={toast.id} entering={FadeInUp.springify().damping(18)} exiting={FadeOutUp} testID="toast" style={styles.toast}>
            <Icon name={toast.type === "error" ? "alert" : toast.type === "info" ? "sparkles" : "checkCircle"} size={18} color={tint} />
            <Text style={styles.text} testID="toast-message">
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const useStyles = makeStyles((c) => ({
  host: { position: "absolute", start: 16, end: 16, alignItems: "center" },
  toast: {
    maxWidth: 480,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: c.sheet,
    borderWidth: 1,
    borderColor: c.white10,
    shadowColor: c.canvas,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  text: { flex: 1, color: c.onSurface, fontSize: 13, fontWeight: "500" },
}));
