import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { ActivityPlayer } from '../../../activities/ActivityPlayer';
import { goBack } from '../../../components/nav';
import { colors } from '../../../components/theme';
import { Screen } from '../../../components/ui';
import { useContentStore } from '../../../content/contentService';
import { activityKey, checkAccess } from '../../../logic/access';
import { localDayKey } from '../../../logic/dates';
import { useActiveProfile, useAppStore } from '../../../store/useAppStore';

export default function ActivityScreen() {
  const { weekId, id } = useLocalSearchParams<{ weekId: string; id: string }>();
  const profile = useActiveProfile();
  const week = useContentStore((s) => s.loaded[weekId]);
  const currentWeekId = useContentStore((s) => s.currentWeekId);
  const ensureWeek = useContentStore((s) => s.ensureWeek);
  const isPremium = useAppStore((s) => s.isPremium);
  const markStarted = useAppStore((s) => s.markStarted);
  const recordResult = useAppStore((s) => s.recordResult);

  const key = activityKey(weekId, id);
  // Decide access once on entry; starting the activity changes usage, which must not kick the child out.
  const decision = useRef(
    checkAccess({
      isPremium,
      key,
      isCurrentWeek: weekId === currentWeekId,
      usage: useAppStore.getState().dailyUsage,
      today: localDayKey(),
    }),
  ).current;

  useEffect(() => {
    if (decision.allowed && decision.reason === 'free') markStarted(key);
  }, [decision, key, markStarted]);

  useEffect(() => {
    ensureWeek(weekId);
  }, [ensureWeek, weekId]);

  if (!profile) return <Redirect href="/" />;
  if (!decision.allowed) return <Redirect href="/home" />;
  if (!week) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }
  const activity = week.activities.find((a) => a.id === id);
  if (!activity) {
    return (
      <Screen>
        <Text>Activity not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink, textAlign: 'center', marginBottom: 12 }}>
        {activity.emoji} {activity.title}
      </Text>
      <ActivityPlayer
        activity={activity}
        age={profile.age}
        onFinish={(stars) => recordResult(profile.id, key, stars)}
        onExit={() => goBack('/home')}
      />
    </Screen>
  );
}
