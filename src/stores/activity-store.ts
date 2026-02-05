/**
 * Activity Store
 * 
 * Tracks recent activity and events in the application
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ActivityItem } from '@/types';

interface ActivityStore {
  // State
  activities: ActivityItem[];
  maxActivities: number;

  // Actions
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getRecentActivities: (count?: number) => ActivityItem[];
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const MAX_ACTIVITIES = 100;

const initialState = {
  activities: [] as ActivityItem[],
  maxActivities: MAX_ACTIVITIES,
};

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          activities: [newActivity, ...state.activities].slice(0, state.maxActivities),
        }));
      },

      clearActivities: () => {
        set({ activities: [] });
      },

      getRecentActivities: (count = 10) => {
        return get().activities.slice(0, count);
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'ollama-activity',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activities: state.activities,
      }),
    }
  )
);
