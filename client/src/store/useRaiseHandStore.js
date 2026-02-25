import { create } from "zustand";
import { persist } from "zustand/middleware";

const useRaiseHandStore = create(
  persist(
    (set) => ({
      raiseHandEnabled: true,
      toggleRaiseHandAccess: () =>
        set((state) => ({
          raiseHandEnabled: !state.raiseHandEnabled,
        })),
      setRaiseHandAccess: (enabled) =>
        set({
          raiseHandEnabled: enabled,
        }),
    }),
    {
      name: "raise-hand-access",
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);

export default useRaiseHandStore;
