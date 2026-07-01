const CACHE_NAME = "cml-portal-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-192.jpg",
  "/icon-512.png",
  "/icon-512.jpg",
  "/apple-touch-icon.png",
  "/apple-touch-icon.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests of relative assets (ignore API/Firebase channels)
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("version_info.json") ||
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("firebase")
  ) {
    return;
  }

  // Network-First Strategy: always try network first, fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Safe document fallback if disconnected
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});

// ==========================================
// Standard Mobile/Web Push Alert Event Listeners
// ==========================================

self.addEventListener("push", (event) => {
  let payload = {
    title: "CML HRMS Portal",
    body: "New notification alert received.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    clickAction: "/"
  };

  if (event.data) {
    try {
      const dataJson = event.data.json();
      payload = { ...payload, ...dataJson };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body || payload.message || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    vibrate: [100, 50, 100],
    tag: payload.tag || "cml-alert-tag",
    renotify: true,
    data: {
      url: payload.clickAction || payload.link || "/"
    },
    actions: [
      { action: "open", title: "View Request" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(clickUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});

// ============================================================================
// PWA Background Sync and Offline Caching Service Core
// ============================================================================

// Promisified IndexedDB initialization helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cml-offline-complaints-db", 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending-complaints")) {
        db.createObjectStore("pending-complaints", { keyPath: "id", autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Retrieve all complaints from IndexedDB
function getPendingComplaints(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("pending-complaints", "readonly");
    const store = transaction.objectStore("pending-complaints");
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Delete a synced complaint from IndexedDB
function deletePendingComplaint(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("pending-complaints", "readwrite");
    const store = transaction.objectStore("pending-complaints");
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Background Synchronization Logic
async function syncComplaintsToServer() {
  try {
    const db = await openDB();
    const complaints = await getPendingComplaints(db);
    
    if (!complaints || complaints.length === 0) {
      console.log("[SW Background Sync] No pending complaints to sync.");
      return;
    }

    console.log(`[SW Background Sync] Found ${complaints.length} pending guest complaints. Synchronizing...`);

    const response = await fetch("/api/sync-offline-complaints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ complaints })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[SW Background Sync] Synced ${result.count || complaints.length} complaints to Firestore successfully.`);
      
      // Clear offline IndexedDB logs
      for (const item of complaints) {
        await deletePendingComplaint(db, item.id);
      }

      // Notify open clients so they can update their UI state
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windowClients) {
        client.postMessage({
          type: "SYNC_COMPLETED",
          count: complaints.length,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.error("[SW Background Sync] Server sync error status:", response.status);
    }
  } catch (err) {
    console.error("[SW Background Sync] Execution failed:", err);
  }
}

// Listen for network connectivity sync trigger from the browser
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-complaints") {
    console.log("[SW Event] 'sync-complaints' background sync triggered.");
    event.waitUntil(syncComplaintsToServer());
  }
});

// Message listener for manually triggered sync fallback or immediate registration
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_SYNC") {
    console.log("[SW Event] Manual TRIGGER_SYNC received.");
    event.waitUntil(syncComplaintsToServer());
  }
});

