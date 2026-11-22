const V = "markd-v37", SHELL = ["./", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("markd-v") && k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put("./", cp)); return res; }).catch(() => caches.match("./")));
    return;
  }
  e.respondWith(caches.match(r).then((hit) => { const net = fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; }).catch(() => hit); return hit || net; }));
});
const day = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
async function remind() {
  try {
    const c = await caches.open("markd-meta"), res = await c.match("/__reminder"); if (!res) return;
    const r = await res.json(); if (!r.on) return;
    const n = new Date(), k = day(n); if (r.last === k) return;
    const [h, m] = String(r.time || "").split(":").map(Number); if (isNaN(h)) return;
    if (n < new Date(n.getFullYear(), n.getMonth(), n.getDate(), h, m || 0)) return;
    if (r.skip && r.lastRead === k) return;
    r.last = k; await c.put("/__reminder", new Response(JSON.stringify(r)));
    await self.registration.showNotification("Time to read 📖", { body: "A few pages tonight? Your book is waiting.", icon: "icons/icon-192.png", tag: "markd-daily", data: { url: "./" } });
  } catch (e) {}
}
self.addEventListener("periodicsync", (e) => { if (e.tag === "markd-reminder") e.waitUntil(remind()); });
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || "Time to read 📖", { body: d.body || "A few pages tonight? Your book is waiting.", icon: "icons/icon-192.png", tag: "markd-daily", data: { url: "./" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ("focus" in c) return c.focus(); } return self.clients.openWindow(url); }));
});
