import { router, type Href } from 'expo-router';

/** Go back if there is history (e.g. not after a deep link or web reload), otherwise go to `fallback`. */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
