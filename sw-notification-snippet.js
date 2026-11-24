// Tambahkan ke sw.js kamu (taruh di bagian bawah).
// Bikin tombol "Mark Returned" di notifikasi loan beneran jalan,
// dan tap notifikasi membuka Markd.
self.addEventListener("notificationclick", (event) => {
  const n = event.notification, d = n.data || {};
  n.close();
  event.waitUntil((async () => {
    const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const isReturn = event.action === "return" && d.loanKey;
    if (wins.length) {
      const w = wins[0];
      if (isReturn) w.postMessage({ type: "markd-loan-return", loanKey: d.loanKey });
      return w.focus();
    }
    const base = d.url || "./";
    return clients.openWindow(isReturn ? base + "?loanReturn=" + encodeURIComponent(d.loanKey) : base);
  })());
});
