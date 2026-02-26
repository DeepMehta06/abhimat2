import { create } from "zustand";

const useRaiseHandWindowStore = create((set) => ({
  isEnabled: false,
  isWindowActive: false,
  timeRemaining: 0,
  hasRaised: false,

  setWindowState: (isEnabled, isWindowActive, timeRemaining, hasRaised = false) =>
    set({
      isEnabled,
      isWindowActive,
      timeRemaining,
      hasRaised,
    }),

  setTimeRemaining: (timeRemaining) =>
    set({
      timeRemaining: Math.max(0, timeRemaining),
    }),

  resetWindow: () =>
    set({
      isEnabled: false,
      isWindowActive: false,
      timeRemaining: 0,
      hasRaised: false,
    }),
}));

export default useRaiseHandWindowStore;
