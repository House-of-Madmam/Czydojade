// Re-export store types and hooks for easier imports
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';

// Re-export slice actions for convenience
// export * from './slices/auth';