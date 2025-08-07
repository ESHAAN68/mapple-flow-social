import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalyticsData {
  totalBoards: number;
  activeCollabs: number;
  totalViews: number;
  completedProjects: number;
  totalMessages: number;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  lastUpdated: string;
}

interface AnalyticsState extends AnalyticsData {
  isLoading: boolean;
  isPremium: boolean;
  updateAnalytics: (data: Partial<AnalyticsData>) => void;
  setLoading: (loading: boolean) => void;
  setPremium: (premium: boolean) => void;
  incrementViews: () => void;
  incrementMessages: () => void;
  incrementBoards: () => void;
  incrementCollabs: () => void;
  updateStorage: (used: number) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      totalBoards: 0,
      activeCollabs: 0,
      totalViews: 0,
      completedProjects: 0,
      totalMessages: 0,
      storageUsed: 0,
      storageLimit: 100, // 100MB for free users
      lastUpdated: new Date().toISOString(),
      isLoading: false,
      isPremium: false,
      
      updateAnalytics: (data) => {
        set((state) => ({
          ...state,
          ...data,
          lastUpdated: new Date().toISOString(),
        }));
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setPremium: (premium) => set({ 
        isPremium: premium,
        storageLimit: premium ? 10000 : 100 // 10GB for premium, 100MB for free
      }),
      
      incrementViews: () => set((state) => ({ 
        totalViews: state.totalViews + 1,
        lastUpdated: new Date().toISOString()
      })),
      
      incrementMessages: () => set((state) => ({ 
        totalMessages: state.totalMessages + 1,
        lastUpdated: new Date().toISOString()
      })),
      
      incrementBoards: () => set((state) => ({ 
        totalBoards: state.totalBoards + 1,
        lastUpdated: new Date().toISOString()
      })),
      
      incrementCollabs: () => set((state) => ({ 
        activeCollabs: state.activeCollabs + 1,
        lastUpdated: new Date().toISOString()
      })),
      
      updateStorage: (used) => set((state) => ({ 
        storageUsed: used,
        lastUpdated: new Date().toISOString()
      })),
    }),
    {
      name: 'analytics-storage',
    }
  )
);