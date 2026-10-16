import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '../components/theme';
import { useContentStore } from '../content/contentService';
import { initPurchases } from '../purchases/purchases';
import { useAppStore } from '../store/useAppStore';

function useHydrated() {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

export default function RootLayout() {
  const hydrated = useHydrated();
  const refresh = useContentStore((s) => s.refresh);

  useEffect(() => {
    refresh();
    initPurchases();
  }, [refresh]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'BrightWeek' }} />
        <Stack.Screen name="home" options={{ title: '' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Child profile', presentation: 'modal' }} />
        <Stack.Screen name="activity/[weekId]/[id]" options={{ title: '' }} />
        <Stack.Screen name="paywall" options={{ title: 'BrightWeek Premium', presentation: 'modal' }} />
        <Stack.Screen name="parents" options={{ title: 'Grown-ups' }} />
      </Stack>
    </>
  );
}
