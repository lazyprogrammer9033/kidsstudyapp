import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ParentGate } from '../components/ParentGate';
import { colors, radius, useLayout } from '../components/theme';
import { BigButton, Screen } from '../components/ui';
import { MAX_PROFILES, totalStars, useAppStore } from '../store/useAppStore';

export default function WhoIsLearning() {
  const profiles = useAppStore((s) => s.profiles);
  const results = useAppStore((s) => s.results);
  const setActive = useAppStore((s) => s.setActiveProfile);
  const [gate, setGate] = useState(false);
  const { columns } = useLayout();

  return (
    <Screen>
      <Text style={styles.title}>Who's learning today?</Text>
      {profiles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 72 }}>🌟</Text>
          <Text style={styles.emptyText}>
            Fresh activities every week for ages 2 to 16. Add your first learner to get started.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {profiles.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, age ${p.age}`}
              style={({ pressed }) => [styles.kid, { flexBasis: `${100 / columns - 4}%` }, pressed && { transform: [{ scale: 0.97 }] }]}
              onPress={() => {
                setActive(p.id);
                router.push('/home');
              }}
            >
              <Text style={{ fontSize: 64 }}>{p.avatar}</Text>
              <Text style={styles.kidName}>{p.name}</Text>
              <Text style={styles.kidMeta}>
                Age {p.age} · ⭐ {totalStars(results[p.id])}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {profiles.length < MAX_PROFILES && (
        <BigButton label="+ Add a learner" color={colors.accent} onPress={() => router.push('/profile/edit')} />
      )}
      <BigButton label="Grown-ups" small color={colors.muted} onPress={() => setGate(true)} style={{ marginTop: 24 }} />
      <ParentGate
        visible={gate}
        onCancel={() => setGate(false)}
        onPass={() => {
          setGate(false);
          router.push('/parents');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, textAlign: 'center', marginBottom: 20 },
  empty: { alignItems: 'center', gap: 12, marginBottom: 24 },
  emptyText: { fontSize: 18, color: colors.muted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16 },
  kid: {
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.line,
    alignItems: 'center',
    paddingVertical: 20,
  },
  kidName: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 4 },
  kidMeta: { fontSize: 15, color: colors.muted },
});
