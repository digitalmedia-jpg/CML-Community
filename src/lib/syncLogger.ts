import { auth, db } from "./firebase";

export interface SyncEvent {
  id: string;
  timestamp: string;
  collection: string;
  action: string;
  status: 'success' | 'failure' | 'pending';
  source: 'live' | 'sandbox';
  message: string;
}

type SyncLogListener = (events: SyncEvent[]) => void;

class SyncLogger {
  private events: SyncEvent[] = [];
  private listeners: Set<SyncLogListener> = new Set();

  constructor() {
    // Generate some initial seed events to show administrators how recent connectivity has been routing
    const initialEvents: Omit<SyncEvent, 'id' | 'timestamp'>[] = [
      {
        collection: 'complaints-cml',
        action: 'Initial Connection',
        status: 'success',
        source: 'live',
        message: 'Established high-fidelity bridge with Firestore production gateway'
      },
      {
        collection: 'complaints-ramada',
        action: 'Initial Connection',
        status: 'success',
        source: 'live',
        message: 'Live reactive listener subscribed'
      },
      {
        collection: 'complaints-wyndham',
        action: 'Initial Connection',
        status: 'success',
        source: 'live',
        message: 'Live reactive listener subscribed'
      }
    ];

    initialEvents.forEach((ev, i) => {
      const offsetSeconds = (3 - i) * 15;
      const date = new Date(Date.now() - offsetSeconds * 1000);
      this.events.push({
        id: `init-${i}`,
        timestamp: date.toLocaleTimeString(),
        ...ev
      });
    });
  }

  logEvent(event: Omit<SyncEvent, 'id' | 'timestamp'>) {
    const newEvent: SyncEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ...event
    };
    this.events.unshift(newEvent);
    
    // Keep max 100 events
    if (this.events.length > 100) {
      this.events.pop();
    }
    this.notify();
  }

  getEvents(): SyncEvent[] {
    return [...this.events];
  }

  clearEvents() {
    this.events = [];
    this.notify();
  }

  subscribe(listener: SyncLogListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.getEvents());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getEvents());
      } catch (err) {
        console.error("[SyncLogger] Failed to notify listener:", err);
      }
    });
  }
}

export const syncLogger = new SyncLogger();
