import { create } from 'zustand';
import { Alert, AlertStatus, Severity } from '@/types';
import { apiService } from '@/services/api';

interface AlertState {
  alerts: Alert[];
  searchQuery: string;
  selectedSeverity: Severity | 'ALL';
  selectedStatus: AlertStatus | 'ALL';
  selectedAlert: Alert | null;
  isLoading: boolean;

  setSearchQuery: (query: string) => void;
  setSeverityFilter: (severity: Severity | 'ALL') => void;
  setStatusFilter: (status: AlertStatus | 'ALL') => void;
  setSelectedAlert: (alert: Alert | null) => void;
  
  fetchAlerts: () => Promise<void>;
  containAlert: (alertId: string, actionName?: string) => Promise<void>;
  divertToHoneypot: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  revertAction: (alertId: string) => Promise<void>;
  addLiveAlert: (newAlert: Alert) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  searchQuery: '',
  selectedSeverity: 'ALL',
  selectedStatus: 'ALL',
  selectedAlert: null,
  isLoading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSeverityFilter: (severity) => set({ selectedSeverity: severity }),
  setStatusFilter: (status) => set({ selectedStatus: status }),
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const data = await apiService.getAlerts();
      if (Array.isArray(data)) {
        set({ alerts: data, isLoading: false });
      } else {
        set({ alerts: [], isLoading: false });
      }
    } catch (err) {
      console.warn('Backend alerts endpoint unreachable:', err);
      set({ alerts: [], isLoading: false });
    }
  },

  containAlert: async (alertId, actionName = 'eBPF / XDP Instant Drop Rule Injected') => {
    await apiService.remediateAlert(alertId, 'eBPF_DROP');
    
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'CONTAINED',
              remediationAction: actionName
            }
          : a
      ),
      selectedAlert:
        state.selectedAlert?.id === alertId
          ? {
              ...state.selectedAlert,
              status: 'CONTAINED',
              remediationAction: actionName
            }
          : state.selectedAlert
    }));
  },

  divertToHoneypot: async (alertId) => {
    await apiService.remediateAlert(alertId, 'HONEYPOT');

    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'HONEYPOT_DIVERTED',
              remediationAction: 'Diverted to Adaptive Deception Trap'
            }
          : a
      ),
      selectedAlert:
        state.selectedAlert?.id === alertId
          ? {
              ...state.selectedAlert,
              status: 'HONEYPOT_DIVERTED',
              remediationAction: 'Diverted to Adaptive Deception Trap'
            }
          : state.selectedAlert
    }));
  },

  resolveAlert: async (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'RESOLVED',
              remediationAction: 'Marked as Resolved by Analyst'
            }
          : a
      ),
      selectedAlert:
        state.selectedAlert?.id === alertId
          ? {
              ...state.selectedAlert,
              status: 'RESOLVED',
              remediationAction: 'Marked as Resolved by Analyst'
            }
          : state.selectedAlert
    }));
  },

  revertAction: async (alertId) => {
    await apiService.remediateAlert(alertId, 'REVERT');

    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'ACTIVE',
              remediationAction: 'eBPF Drop Rule Reverted'
            }
          : a
      ),
      selectedAlert:
        state.selectedAlert?.id === alertId
          ? {
              ...state.selectedAlert,
              status: 'ACTIVE',
              remediationAction: 'eBPF Drop Rule Reverted'
            }
          : state.selectedAlert
    }));
  },

  addLiveAlert: (newAlert) => {
    set((state) => ({
      alerts: [newAlert, ...state.alerts]
    }));
  }
}));
