// Ambient module shims for packages that are dynamically imported (native-only)
// and don't ship TypeScript types in this project.

// react-native-iap is loaded lazily in IapTestScreen via `await import('react-native-iap')`
// and is only present in native builds. Declare it so the typecheck passes.
declare module 'react-native-iap';
