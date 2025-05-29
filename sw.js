// TimeBox Ultimate Service Worker - Enhanced Version
const CACHE_NAME = 'timebox-ultimate-v2.0.0';
const STATIC_CACHE_NAME = 'timebox-static-v2.0.0';
const DYNAMIC_CACHE_NAME = 'timebox-dynamic-v2.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css', 
  '/script.js',
  '/manifest.json',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png'
];

// Install Event - Cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing v2.0.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Static files cached successfully');
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache static files:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating v2.0.0...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('timebox-')) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated and ready');
        // Broadcast update to all clients
        return broadcastMessage({
          type: 'SW_UPDATED',
          version: CACHE_NAME,
          message: 'Service Worker updated successfully!'
        });
      })
      .then(() => {
        return self.clients.claim(); // Take control of all clients
      })
  );
});

// Fetch Event - Enhanced caching strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }
  
  // Different strategies for different types of requests
  if (STATIC_FILES.includes(requestUrl.pathname) || requestUrl.pathname === '/') {
    // Cache first strategy for static files
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    // Network first with cache fallback for dynamic content
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// Cache First Strategy - For static files
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🔴 Service Worker: Cache first failed:', request.url);
    return caches.match('/index.html'); // Fallback to index
  }
}

// Network First Strategy - For dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('💾 Service Worker: Cached from network:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔴 Service Worker: Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If requesting HTML and offline, return cached index
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Enhanced Push Event - Handle various notification types
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  let notificationData = {
    title: 'TimeBox Ultimate',
    body: 'Your focus session is complete! Time for a break.',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'timebox-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-96.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now(),
      type: 'session_complete'
    },
    vibrate: [200, 100, 200, 100, 200]
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
      
      // Customize based on notification type
      if (pushData.type === 'break_over') {
        notificationData.body = 'Break time is over! Ready for another focus session?';
        notificationData.icon = '/icon-192.png';
        notificationData.vibrate = [100, 50, 100];
      } else if (pushData.type === 'daily_reminder') {
        notificationData.body = 'Don\'t forget to continue your productivity streak today!';
        notificationData.tag = 'daily-reminder';
        notificationData.requireInteraction = false;
      } else if (pushData.type === 'achievement') {
        notificationData.body = `🎉 Achievement unlocked: ${pushData.achievement}!`;
        notificationData.vibrate = [200, 100, 200, 100, 200, 100, 200];
      }
    } catch (error) {
      console.log('📝 Service Worker: Using text data from push');
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Enhanced Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'dismiss') {
    // Log dismissal for analytics
    broadcastMessage({
      type: 'NOTIFICATION_DISMISSED',
      notificationType: notificationData.type,
      timestamp: Date.now()
    });
    return;
  }
  
  // Handle different notification types
  let targetUrl = '/';
  
  if (notificationData.type === 'session_complete') {
    targetUrl = '/#break';
  } else if (notificationData.type === 'break_over') {
    targetUrl = '/#focus';
  } else if (notificationData.type === 'achievement') {
    targetUrl = '/#stats';
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Send message to update UI based on notification type
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              notificationType: notificationData.type,
              targetUrl: targetUrl
            });
            return client.focus();
          }
        }
        
        // No existing window found, open new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background Sync Event - Enhanced data synchronization
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'timebox-sync':
      event.waitUntil(syncTimeBoxData());
      break;
    case 'timebox-stats-sync':
      event.waitUntil(syncStatsData());
      break;
    case 'timebox-backup':
      event.waitUntil(performBackup());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Enhanced sync functions
async function syncTimeBoxData() {
  try {
    console.log('📤 Service Worker: Syncing app data...');
    
    // In a real app, this would sync with your backend
    // For now, we'll just ensure data integrity and cleanup
    await cleanupOldData();
    await optimizeLocalStorage();
    
    // Notify clients about successful sync
    broadcastMessage({
      type: 'DATA_SYNCED',
      timestamp: Date.now(),
      success: true
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('🚨 Service Worker: Data sync failed:', error);
    
    broadcastMessage({
      type: 'DATA_SYNC_FAILED',
      error: error.message,
      timestamp: Date.now()
    });
    
    throw error;
  }
}

async function syncStatsData() {
  try {
    console.log('📊 Service Worker: Syncing stats data...');
    
    // Calculate and update daily statistics
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('timebox-stats') || '{}');
    
    if (stats.lastSyncDate !== today) {
      // Update daily stats, streaks, etc.
      stats.lastSyncDate = today;
      localStorage.setItem('timebox-stats', JSON.stringify(stats));
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('📊 Stats sync failed:', error);
    throw error;
  }
}

async function performBackup() {
  try {
    console.log('💾 Service Worker: Performing backup...');
    
    const backupData = {
      tasks: localStorage.getItem('timebox-tasks'),
      stats: localStorage.getItem('timebox-stats'),
      settings: localStorage.getItem('timebox-settings'),
      patterns: localStorage.getItem('smartPatterns'),
      timestamp: Date.now()
    };
    
    // Store backup locally (in a real app, send to server)
    localStorage.setItem('timebox-backup', JSON.stringify(backupData));
    
    broadcastMessage({
      type: 'BACKUP_COMPLETE',
      timestamp: Date.now()
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('💾 Backup failed:', error);
    throw error;
  }
}

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Service Worker: Periodic sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'timebox-daily-sync':
      event.waitUntil(performDailyMaintenance());
      break;
    case 'timebox-weekly-backup':
      event.waitUntil(performBackup());
      break;
  }
});

async function performDailyMaintenance() {
  try {
    console.log('🧹 Service Worker: Performing daily maintenance...');
    
    // Clean up old cache entries
    await limitCacheSize(DYNAMIC_CACHE_NAME, 100);
    
    // Clean up old patterns
    const patterns = JSON.parse(localStorage.getItem('smartPatterns') || '[]');
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentPatterns = patterns.filter(p => new Date(p.timestamp).getTime() > weekAgo);
    localStorage.setItem('smartPatterns', JSON.stringify(recentPatterns));
    
    // Update statistics
    await syncStatsData();
    
    broadcastMessage({
      type: 'MAINTENANCE_COMPLETE',
      timestamp: Date.now()
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('🧹 Daily maintenance failed:', error);
    throw error;
  }
}

// Enhanced Message Event - Handle various message types
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ 
        version: CACHE_NAME,
        features: ['offline-support', 'background-sync', 'push-notifications', 'smart-caching']
      });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'SCHEDULE_NOTIFICATION':
      event.waitUntil(scheduleNotification(data));
      break;
      
    case 'REQUEST_SYNC':
      event.waitUntil(requestSync(data.tag || 'timebox-sync'));
      break;
      
    case 'UPDATE_SETTINGS':
      handleSettingsUpdate(data);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((cacheName) => {
      if (cacheName.startsWith('timebox-')) {
        console.log('🗑️ Service Worker: Clearing cache:', cacheName);
        return caches.delete(cacheName);
      }
    });
    
    await Promise.all(deletePromises);
    
    broadcastMessage({
      type: 'CACHES_CLEARED',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('🗑️ Cache clearing failed:', error);
  }
}

async function scheduleNotification(notificationData) {
  try {
    // In a real app with a backend, you'd schedule this on the server
    // For now, we'll store it locally and set a timeout
    const scheduledNotifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
    scheduledNotifications.push({
      ...notificationData,
      id: Date.now(),
      scheduledAt: Date.now()
    });
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
    
    console.log('📅 Notification scheduled:', notificationData);
  } catch (error) {
    console.error('📅 Failed to schedule notification:', error);
  }
}

async function requestSync(tag) {
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await self.registration;
      await registration.sync.register(tag);
      console.log('🔄 Background sync requested:', tag);
    }
  } catch (error) {
    console.error('🔄 Failed to request sync:', error);
  }
}

function handleSettingsUpdate(settings) {
  // Update service worker behavior based on settings
  if (settings.notifications === false) {
    // Cancel any scheduled notifications
    const scheduledNotifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
    localStorage.setItem('scheduledNotifications', JSON.stringify([]));
  }
  
  console.log('⚙️ Settings updated in service worker');
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('🚨 Service Worker: Error occurred:', event.error);
  
  broadcastMessage({
    type: 'SW_ERROR',
    error: event.error.message,
    timestamp: Date.now()
  });
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Service Worker: Unhandled promise rejection:', event.reason);
  
  broadcastMessage({
    type: 'SW_UNHANDLED_REJECTION',
    reason: event.reason,
    timestamp: Date.now()
  });
});

// Utility Functions

// Enhanced message broadcasting
async function broadcastMessage(message) {
  try {
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });
    
    clients.forEach((client) => {
      client.postMessage({
        source: 'service-worker',
        timestamp: Date.now(),
        ...message
      });
    });
    
    console.log('📡 Message broadcasted to', clients.length, 'clients:', message);
  } catch (error) {
    console.error('📡 Failed to broadcast message:', error);
  }
}

// Enhanced cache cleanup
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((cacheName) => {
      if (cacheName.startsWith('timebox-') && 
          cacheName !== STATIC_CACHE_NAME && 
          cacheName !== DYNAMIC_CACHE_NAME) {
        console.log('🧹 Cleaning up old cache:', cacheName);
        return caches.delete(cacheName);
      }
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('🧹 Cache cleanup failed:', error);
  }
}

// Enhanced cache size management
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      // Delete oldest entries (FIFO)
      const deleteCount = keys.length - maxItems;
      const deletePromises = keys.slice(0, deleteCount).map((key) => {
        console.log('🗑️ Removing old cache entry:', key.url);
        return cache.delete(key);
      });
      
      await Promise.all(deletePromises);
      console.log(`📦 Cache ${cacheName} cleaned: removed ${deleteCount} items`);
    }
  } catch (error) {
    console.error('📦 Cache size limiting failed:', error);
  }
}

// Local storage optimization
async function optimizeLocalStorage() {
  try {
    // Clean up old data and optimize storage
    const tasks = JSON.parse(localStorage.getItem('timebox-tasks') || '[]');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Remove very old completed tasks
    const optimizedTasks = tasks.filter(task => {
      if (task.completed && task.completedAt) {
        return new Date(task.completedAt).getTime() > thirtyDaysAgo;
      }
      return true;
    });
    
    if (optimizedTasks.length !== tasks.length) {
      localStorage.setItem('timebox-tasks', JSON.stringify(optimizedTasks));
      console.log('🧹 Cleaned up old completed tasks');
    }
  } catch (error) {
    console.error('🧹 Storage optimization failed:', error);
  }
}

async function cleanupOldData() {
  try {
    await optimizeLocalStorage();
    await cleanupOldCaches();
    console.log('🧹 Data cleanup completed');
  } catch (error) {
    console.error('🧹 Data cleanup failed:', error);
  }
}

// Periodically manage cache size
setInterval(() => {
  limitCacheSize(DYNAMIC_CACHE_NAME, 100); // Keep only 100 items
}, 300000); // Check every 5 minutes

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.duration > 1000) { // Log slow operations
      console.log('⚠️ Slow operation detected:', entry.name, entry.duration + 'ms');
    }
  });
});

try {
  performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
} catch (error) {
  console.log('Performance observer not supported');
}

console.log('🚀 Service Worker v2.0.0 script loaded successfully');
console.log('📱 Enhanced PWA features:');
console.log('  ✅ Advanced offline support');
console.log('  ✅ Smart caching strategies');
console.log('  ✅ Background sync with cleanup');
console.log('  ✅ Rich push notifications');
console.log('  ✅ Automatic data optimization');
console.log('  ✅ Performance monitoring');
console.log('  ✅ Enhanced error handling');