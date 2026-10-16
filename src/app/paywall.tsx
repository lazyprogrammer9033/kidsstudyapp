import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { goBack } from '../components/nav';
import { colors, radius } from '../components/theme';
import { BigButton, Card, Screen } from '../components/ui';
import { CONTENT_BASE_URL } from '../content/contentService';
import { FREE_DAILY_LIMIT } from '../logic/access';
import { buy, demoPurchases, getPlans, restore, type Plan } from '../purchases/purchases';
import { useAppStore } from '../store/useAppStore';

const BENEFITS = [
  ['🗓️', 'Brand-new activities every week'],
  ['♾️', `Unlimited play (free is ${FREE_DAILY_LIMIT} a day)`],
  ['📚', 'Every past week, any time'],
  ['👨‍👩‍👧‍👦', 'Up to 6 kids, ages 2 to 16, one price'],
  ['🚫', 'No ads, ever'],
];

// Reached only through a ParentGate.
export default function Paywall() {
  const isPremium = useAppStore((s) => s.isPremium);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPlans()
      .then((p) => {
        setPlans(p);
        setSelected(p[0]?.id ?? null);
      })
      .catch(() => setPlans([]));
  }, []);

  const purchase = async () => {
    const plan = plans?.find((p) => p.id === selected);
    if (!plan) return;
    setBusy(true);
    try {
      if (await buy(plan)) goBack('/home');
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? 'Restored!' : 'Nothing to restore', ok ? 'Premium is active.' : 'No active subscription was found for this account.');
      if (ok) goBack('/home');
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (isPremium) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 64 }}>🌟</Text>
          <Text style={styles.title}>Premium is active</Text>
          <Text style={styles.muted}>Thank you for supporting BrightWeek!</Text>
          <BigButton label="Done" onPress={() => goBack('/home')} style={{ alignSelf: 'stretch' }} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Unlock every activity</Text>
      <Card style={{ gap: 10, marginVertical: 12 }}>
        {BENEFITS.map(([icon, text]) => (
          <View key={text} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
            <Text style={styles.benefit}>{text}</Text>
          </View>
        ))}
      </Card>

      {plans === null ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : plans.length === 0 ? (
        <Text style={styles.muted}>Subscriptions are not available right now. Please try again later.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {plans.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === p.id }}
              onPress={() => setSelected(p.id)}
              style={[styles.plan, selected === p.id && styles.planOn]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{p.title}</Text>
                <Text style={styles.muted}>
                  {p.price} {p.period}
                </Text>
              </View>
              {p.badge ? <Text style={styles.badge}>{p.badge}</Text> : null}
            </Pressable>
          ))}
          <BigButton label={busy ? 'Please wait…' : 'Continue'} disabled={busy || !selected} onPress={purchase} />
        </View>
      )}

      <BigButton label="Restore purchases" small color={colors.muted} disabled={busy} onPress={doRestore} />
      {demoPurchases && <Text style={styles.fine}>Demo mode: no store keys configured, purchases are simulated.</Text>}
      <Text style={styles.fine}>
        Subscriptions renew automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel
        any time in your App Store or Google Play account settings.
      </Text>
      <View style={styles.links}>
        <Text style={styles.link} onPress={() => Linking.openURL(`${CONTENT_BASE_URL}terms.html`)}>
          Terms of Use
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL(`${CONTENT_BASE_URL}privacy.html`)}>
          Privacy Policy
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  muted: { fontSize: 16, color: colors.muted },
  benefit: { fontSize: 17, color: colors.ink, flex: 1 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
  },
  planOn: { borderColor: colors.primary, backgroundColor: '#FFF1EA' },
  planTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  badge: { backgroundColor: colors.good, color: 'white', fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  fine: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 8 },
  link: { fontSize: 14, color: colors.accent, textDecorationLine: 'underline' },
});
