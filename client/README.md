# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Zustand State Architecture

The frontend state and Supabase Realtime subscriptions have been centralized using **Zustand**. 

### Flow
`Supabase -> Zustand Store -> UI`

No React components subscribe to Supabase directly, manage timers, or execute network fetches in `useEffect`. Components operate strictly as pure render layers.

### Stores
- `useSessionStore`: Manages session state, global voting/poll status, and centralized timer logic with automatic sync limits based on backend data. 
- `useQueueStore`: Handles all raising hands, queue status, and transitions. 
- `useUserStore`: Stores user objects, JWT authentication in `localStorage`, and handles power cards and specific user realtime hooks.

### Refactored Files
- `shared/components/FloorStatus.jsx`
- `moderator/components/SpeakerQueue.jsx`
- `moderator/pages/Dashboard.jsx`
- `member/pages/Dashboard.jsx`

---

## Realtime Chat Restoration

The previously removed Realtime Chat has been fully restored and integrated into the global Zustand store architecture. 

### Chat Architecture Flow
`Supabase (chat_messages INSERT) -> useChatStore -> UI`

### Improvements
- **Multi-Tab Sync**: Leveraging exactly one `supabase.channel` subscription per active room securely handled in the `useChatStore`. Eliminates duplicate messages or runaway listener memory leaks. 
- **Predictable UX**: The Chat Panel instantly updates with incoming messages (no refresh required) and automatically scrolls downward only when necessary.
- **Premium Styling**: Bubble chat UI layout added, along with polished interaction feed (hover shadows, button tap scales, entry animations).

---

## Real-Time Floor Experience System

Cinematic UI upgrade using **Framer Motion** for state-driven animations. All animations react exclusively to Zustand store state. No animation logic inside stores.

### New Floor Components (`components/floor/`)
- `FloorCenter.jsx` — Animated active speaker panel with glow, pulse on urgency, and `AnimatePresence` transitions.
- `TimerDisplay.jsx` — Circular SVG countdown with green→yellow→red color progression, shake at 5s, flash at 0.
- `StageOverlay.jsx` — Full-screen backdrop-blur banner on stage changes, auto-dismisses after 3s.
- `PowerCardAnimation.jsx` — Floating notification toasts for interrupt, challenge, and add-time card activations.

### Upgraded Components
- `Leaderboard.jsx` — Animated ranking transitions with layout animations and floating crown for #1.
- `FloorStatus.jsx` — Now wraps `FloorCenter` and uses animated queue list.

---

## Moderator Chat Control

Moderators can clear all session chat messages instantly across all connected clients.

### Architecture
- Store action: `useChatStore.clearChat()` calls `DELETE /chat` API.
- Backend enforces `role === 'moderator'` check before deletion.
- Realtime `DELETE` event listener in `useChatStore` ensures all tabs clear instantly, no refresh needed.
- Confirmation modal prevents accidental deletion.
