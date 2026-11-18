import { Platform } from "react-native";
import { AndroidImportance } from "expo-notifications";
import * as Notifications from "expo-notifications";

import type { Lang } from "@/src/i18n";
import { apiGet, apiPost } from "./api";

type PushConfig = {
  android: boolean;
  web: boolean;
  vapidPublicKey: string | null;
};

function decodeVapidKey(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

function appBasePath(): string {
  const path = window.location.pathname;
  return path === "/app" || path.startsWith("/app/") ? "/app/" : "/";
}

export async function enablePush(vault: `0x${string}`, language: Lang): Promise<void> {
  const config = await apiGet<PushConfig>("/push/config");

  if (Platform.OS === "web") {
    if (!config.web || !config.vapidPublicKey) throw new Error("PushNotConfigured");
    if (!("Notification" in window) || !("serviceWorker" in navigator)) throw new Error("NotificationsUnavailable");
    const permission = await window.Notification.requestPermission();
    if (permission !== "granted") throw new Error("NotificationPermissionDenied");
    const basePath = appBasePath();
    const registration = await navigator.serviceWorker.register(`${basePath}sw.js`, { scope: basePath });
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(config.vapidPublicKey),
      }));
    await apiPost("/push/register", {
      platform: "web",
      vault,
      language,
      subscription: subscription.toJSON(),
    });
    return;
  }

  if (Platform.OS !== "android") throw new Error("NotificationsUnavailable");
  if (!config.android) throw new Error("PushNotConfigured");
  await Notifications.setNotificationChannelAsync("bluesafe", {
    name: "BlueSafe",
    importance: AndroidImportance.HIGH,
  });
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error("NotificationPermissionDenied");
  const deviceToken = await Notifications.getDevicePushTokenAsync();
  await apiPost("/push/register", {
    platform: "android",
    vault,
    language,
    token: String(deviceToken.data),
  });
}

/** Register an Android device only when notification permission is already granted. */
export async function ensurePushRegistered(vault: `0x${string}`, language: Lang): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  const config = await apiGet<PushConfig>("/push/config");
  if (!config.android) return false;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.setNotificationChannelAsync("bluesafe", {
    name: "BlueSafe",
    importance: AndroidImportance.HIGH,
  });
  const deviceToken = await Notifications.getDevicePushTokenAsync();
  await apiPost("/push/register", {
    platform: "android",
    vault,
    language,
    token: String(deviceToken.data),
  });
  return true;
}
