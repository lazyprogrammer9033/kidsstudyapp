import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParentGate } from '../components/ParentGate';
import { colors, radius, useLayout } from '../components/theme';
import { BigButton, Card, Screen, StarRow } from '../components/ui';
import { useContentStore } from '../content/contentService';
import { activitiesForAge, SUBJECT_LABELS, type Activity } from '../content/types';
import { activityKey, checkAccess, FREE_DAILY_LIMIT, freeRemaining } from '../logic/access';
import { localDayKey } from '../logic/dates';
import { totalStars, useActiveProfile, useAppStore } from '../store/useAppStore';

export default function Home() {
  const profile = useActiveProfile();
  const { status, weeks, currentWeekId, loaded, ensureWeek, refresh, offline } = useContentStore();
  const results = useAppStore((s) => (profile ? s.results[profile.id] : undefined));
  const isPremium = useAppStore((s) => s.isPremium);
  const dailyUsage = useAppStore((s) => s.dailyUsage);
  const { columns } = useLayout();

  const [weekId, setWeekId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<'daily-limit' | 'past-week' | null>(null);
  const [gate, setGate] = useState(false);
  const selectedWeekId = weekId ?? currentWeekId;
  const week = selectedWeekId ? loaded[selectedWeekId] : undefined;

  useEffect(() => {
    if (selectedWeekId) ensureWeek(selectedWeekId);
  }, [selectedWeekId, ensureWeek]);

  if (!profile) return <Redirect href="/" />;

  const today = localDayKey();
  const remaining = freeRemaining(dailyUsage, today);
  const activities = week ? activitiesForAge(week, profile.age) : [];
  const done = activities.filter((a) => results?.[activityKey(week!.id, a.id)]).length;

  const open = (a: Activity) => {
    const decision = checkAccess({
      isPremium,
      key: activityKey(week!.id, a.id),
      isCurrentWeek: week!.id === currentWeekId,
      usage: dailyUsage,
      today,
    });
    if (!decision.allowed) setBlocked(decision.reason);
    else router.push({ pathname: '/activity/[weekId]/[id]', params: { weekId: week!.id, id: a.id } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={{ fontSize: 56 }}>{profile.avatar}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hi {profile.name}!</Text>
          <Text style={styles.meta}>
            ⭐ {totalStars(results)} stars{profile.streak > 1 ? `  ·  🔥 ${profile.streak}-day streak` : ''}
          </Text>
        </View>
      </View>

      {weeks.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weeks}>
          {weeks.map((w) => {
            const on = w.id === selectedWeekId;
            const locked = !isPremium && w.id !== currentWeekId;
            return (
              <Pressable key={w.id} onPress={() => setWeekId(w.id)} style={[styles.weekChip, on && styles.weekChipOn]}>
                <Text style={[styles.weekChipText, on && { color: 'white' }]}>
                  {locked ? '🔒 ' : `${w.emoji} `}
                  {w.id === currentWeekId ? 'This week' : w.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {!week ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          {status === 'ready' ? (
            <>
              <Text style={styles.meta}>We couldn't load this week's activities. Check your internet connection.</Text>
              <BigButton label="Try again" small onPress={refresh} />
            </>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </Card>
      ) : (
        <>
          <Card style={styles.weekCard}>
            <Text style={{ fontSize: 44 }}>{week.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.weekTitle}>{week.title}</Text>
              <Text style={styles.meta}>{week.theme}</Text>
              <Text style={styles.meta}>
                {done} of {activities.length} done
              </Text>
            </View>
          </Card>

          {!isPremium && (
            <Pressable onPress={() => setGate(true)} style={styles.freeBanner}>
              <Text style={styles.freeText}>
                {remaining > 0
                  ? `🎁 ${remaining} free ${remaining === 1 ? 'activity' : 'activities'} left today`
                  : '🌙 Free activities are done for today'}
              </Text>
              <Text style={styles.freeLink}>Grown-ups: unlock all ›</Text>
            </Pressable>
          )}

          <View style={styles.grid}>
            {activities.map((a) => {
              const r = results?.[activityKey(week.id, a.id)];
              const subject = SUBJECT_LABELS[a.subject];
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.title}, ${subject.label}`}
                  onPress={() => open(a)}
                  style={({ pressed }) => [
                    styles.activity,
                    { flexBasis: `${100 / columns - 4}%`, borderColor: subject.color },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={{ fontSize: 48 }}>{a.emoji}</Text>
                  <Text style={styles.activityTitle} numberOfLines={2}>
                    {a.title}
                  </Text>
                  <Text style={[styles.subject, { backgroundColor: subject.color }]}>{subject.label}</Text>
                  {r ? <StarRow stars={r.stars} size={18} /> : <Text style={styles.meta}>{a.minutes ?? 5} min</Text>}
                </Pressable>
              );
            })}
          </View>
          {activities.length === 0 && (
            <Text style={styles.meta}>No activities for age {profile.age} this week yet — check back soon!</Text>
          )}
          {offline && <Text style={[styles.meta, { textAlign: 'center', marginTop: 12 }]}>Offline — showing saved activities.</Text>}
        </>
      )}

      <Modal visible={blocked !== null} transparent animationType="fade" onRequestClose={() => setBlocked(null)}>
        <View style={styles.backdrop}>
          <Card style={{ maxWidth: 420, width: '100%', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 64 }}>{blocked === 'past-week' ? '📚' : '🌙'}</Text>
            <Text style={styles.weekTitle}>
              {blocked === 'past-week' ? 'Past weeks are for Premium' : `That's ${FREE_DAILY_LIMIT} for today!`}
            </Text>
            <Text style={[styles.meta, { textAlign: 'center' }]}>
              {blocked === 'past-week'
                ? 'Ask a grown-up to unlock every week.'
                : 'Come back tomorrow for more, or ask a grown-up to unlock everything.'}
            </Text>
            <BigButton
              label="Ask a grown-up"
              color={colors.accent}
              style={{ alignSelf: 'stretch' }}
              onPress={() => {
                setBlocked(null);
                setGate(true);
              }}
            />
            <BigButton label="OK" small color={colors.muted} onPress={() => setBlocked(null)} />
          </Card>
        </View>
      </Modal>

      <ParentGate
        visible={gate}
        onCancel={() => setGate(false)}
        onPass={() => {
          setGate(false);
          router.push('/paywall');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  hello: { fontSize: 28, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 15, color: colors.muted },
  weeks: { gap: 8, paddingBottom: 12 },
  weekChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  weekChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  weekChipText: { fontWeight: '700', color: colors.ink },
  weekCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  weekTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  freeBanner: { backgroundColor: '#FFF0C2', borderRadius: radius.md, padding: 12, marginBottom: 12, alignItems: 'center' },
  freeText: { fontSize: 17, fontWeight: '700', color: colors.ink },
  freeLink: { fontSize: 14, color: colors.primaryDark, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  activity: {
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 3,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  activityTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  subject: { color: 'white', fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
});
