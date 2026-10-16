import { store } from '../store';

let logEvent = null;

const getLogger = async () => {
  if (logEvent) return logEvent;
  const { useLogEventMutation } = await import('../slices/userBehaviorApiSlice');
  return null;
};

export const trackEvent = (eventType, data = {}) => {
  const state = store.getState();
  const user = state.auth?.userInfo;
  if (!user) return;

  if (typeof store.__logEvent === 'function') {
    store.__logEvent({ eventType, ...data });
  }
};
