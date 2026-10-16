import { router } from 'expo-router';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { colors } from '../components/theme';
import { BigButton, Card, Screen } from '../components/ui';
import { useContentStore } from '../content/contentService';
import { activitiesForAge } from '../content/types';
import { activityKey, FREE_DAILY_LIMIT } from '../logic/access';
import { demoPurchases } from '../purchases/purchases';
import { totalStars, useAppStore } from '../store/useAppStore';

// Reached only through a ParentGate.
export default function Parents() {
  const profiles = useAppStore((s) => s.profiles);
  const results = useAppStore((s) => s.results);
  const isPremium = useAppStore((s) => s.isPremium);
  const soundOn = useAppStore((s) => s.soundOn);
  const setSoundOn = useAppStore((s) => s.setSoundOn);
  const setPremium = useAppStore((s) => s.setPremium);
  const removeProfile = useAppStore((s) => s.removeProfile);
  const { currentWeekId, loaded, refresh, offline, status } = useContentStore();
  const week = currentWeekId ? loaded[currentWeekId] : undefined;

  return (
    <Screen>
      <Text style={styles.h2}>This week's progress</Text>
      {profiles.length === 0 && <Text style={styles.muted}>No learners yet.</Text>}
      {profiles.map((p) => {
        const mine = week ? activitiesForAge(week, p.age) : [];
        const done = week ? mine.filter((a) => results[p.id]?.[activityKey(week.id, a.id)]).length : 0;
        return (
          <Card key={p.id} style={styles.kid}>
            <Text style={{ fontSize: 40 }}>{p.avatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {p.name}, {p.age}
              </Text>
              <Text style={styles.muted}>
                {done}/{mine.length} activities this week · ⭐ {totalStars(results[p.id])} · 🔥 {p.streak}
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              <BigButton small label="Edit" color={colors.accent} onPress={() => router.push({ pathname: '/profile/edit', params: { id: p.id } })} />
              <BigButton
                small
                label="Remove"
                color={colors.bad}
                onPress={() =>
                  Alert.alert(`Remove ${p.name}?`, 'Their stars and progress will be deleted from this device.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => removeProfile(p.id) },
                  ])
                }
              />
            </View>
          </Card>
        );
      })}

      <Text style={styles.h2}>Subscription</Text>
      <Card style={{ gap: 8 }}>
        <Text style={styles.body}>
          {isPremium ? '🌟 Premium is active.' : `Free plan: ${FREE_DAILY_LIMIT} activities a day, current week only.`}
        </Text>
        <BigButton label={isPremium ? 'Manage' : 'See Premium'} onPress={() => router.push('/paywall')} />
        {demoPurchases && isPremium && (
          <BigButton small label="Demo: reset to free" color={colors.muted} onPress={() => setPremium(false)} />
        )}
      </Card>

      <Text style={styles.h2}>Settings</Text>
      <Card style={{ gap: 12 }}>
        <View style={styles.row}>
          <Text style={styles.body}>Read-aloud and voice cheers</Text>
          <Switch value={soundOn} onValueChange={setSoundOn} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.body, { flex: 1 }]}>
            Content: {week ? `${week.emoji} ${week.title}` : 'loading…'}
            {offline ? ' (offline)' : ''}
          </Text>
          <BigButton small label={status === 'loading' ? '…' : 'Check for new'} disabled={status === 'loading'} onPress={refresh} />
        </View>
      </Card>

      <Text style={styles.h2}>Privacy</Text>
      <Text style={styles.muted}>
        BrightWeek has no ads, no tracking and no accounts. Children's profiles and progress are stored only on this device.
        Purchases are handled by Apple or Google.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 20, marginBottom: 8 },
  body: { fontSize: 17, color: colors.ink },
  muted: { fontSize: 15, color: colors.muted },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  kid: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
