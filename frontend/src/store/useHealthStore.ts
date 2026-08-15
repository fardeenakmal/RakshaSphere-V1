import { create } from 'zustand';
import { apiService } from '@/services/api';

interface HealthState {
  healthData: any | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  notification: string | null;
  isPolling: boolean;
  pollingIntervalId: NodeJS.Timeout | null;
  subscribers: number;

  fetchHealth: () => Promise<void>;
  subscribeToPolling: (intervalMs?: number) => void;
  unsubscribeFromPolling: () => void;
  refresh: () => Promise<void>;
  clearNotification: () => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  healthData: null,
  isLoading: true,
  error: null,
  lastUpdated: null,
  notification: null,
  isPolling: false,
  pollingIntervalId: null,
  subscribers: 0,

  fetchHealth: async () => {
    // Only set loading to true if we don't have data yet to avoid flicker
    if (!get().healthData) {
      set({ isLoading: true, error: null });
    }
    
    try {
      const data = await apiService.getSystemHealth();
      
      const { healthData: prevData } = get();
      let newNotification: string | null = null;
      
      if (prevData?.services && data?.services) {
        for (const service of data.services) {
          const prev = prevData.services.find((s: any) => s.id === service.id);
          if (prev && prev.status !== service.status) {
            if (service.status === 'HEALTHY' && prev.status !== 'HEALTHY') {
              newNotification = `${service.name} recovered`;
            } else if (service.status === 'DOWN' && prev.status === 'HEALTHY') {
              newNotification = `${service.name} is unavailable`;
            } else if (service.status === 'DEGRADED' && prev.status === 'HEALTHY') {
              newNotification = `${service.name} degraded`;
            }
          }
        }
      }

      set({
        healthData: data,
        lastUpdated: new Date().toLocaleTimeString(),
        isLoading: false,
        error: null,
        ...(newNotification && { notification: newNotification })
      });
      
      if (newNotification) {
        setTimeout(() => {
          set((state) => (state.notification === newNotification ? { notification: null } : {}));
        }, 5000);
      }
    } catch (err: any) {
      console.warn('Failed to fetch system health:', err);
      // Phase 10: Preserve previous health data if available
      set({ 
        error: err.message || 'Failed to fetch health data', 
        isLoading: false 
      });
    }
  },

  subscribeToPolling: (intervalMs = 12000) => {
    const { subscribers, isPolling, fetchHealth, pollingIntervalId } = get();
    const newSubscribers = subscribers + 1;
    
    set({ subscribers: newSubscribers });

    // Only start polling if it's the first subscriber
    if (newSubscribers === 1 && !isPolling) {
      if (!get().healthData) {
        fetchHealth(); // Initial fetch if no data
      } else {
        // Still fetch silently in background to refresh
        fetchHealth();
      }
      
      if (pollingIntervalId) clearInterval(pollingIntervalId);
      const intervalId = setInterval(() => {
        get().fetchHealth();
      }, intervalMs);
      
      set({ isPolling: true, pollingIntervalId: intervalId });
    }
  },

  unsubscribeFromPolling: () => {
    const { subscribers, pollingIntervalId } = get();
    const newSubscribers = Math.max(0, subscribers - 1);
    
    set({ subscribers: newSubscribers });

    // Stop polling if there are no more subscribers
    if (newSubscribers === 0) {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      set({ isPolling: false, pollingIntervalId: null });
    }
  },

  refresh: async () => {
    set({ isLoading: true });
    await get().fetchHealth();
  },
  
  clearNotification: () => {
    set({ notification: null });
  }
}));
