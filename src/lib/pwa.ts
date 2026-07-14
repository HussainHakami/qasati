export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.error("SW registration failed:", error);
      });
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  const permission = await Notification.requestPermission();
  return permission;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if ("serviceWorker" in navigator && Notification.permission === "granted") {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-72x72.png",
        dir: "rtl",
        lang: "ar",
        ...options,
      });
    });
  }
}

export function isInstallable(): boolean {
  return "standalone" in window.navigator ||
    window.matchMedia("(display-mode: standalone)").matches;
}
