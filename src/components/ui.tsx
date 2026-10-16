import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/useAppStore';
import { colors, font, radius, useLayout } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { contentWidth } = useLayout();
  const inner = <View style={{ width: contentWidth, alignSelf: 'center', paddingHorizontal: 16 }}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function BigButton({
  label,
  onPress,
  color = colors.primary,
  disabled,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: disabled ? colors.locked : color, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <Text style={[styles.buttonText, small && { fontSize: 16 }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StarRow({ stars, size = 22 }: { stars: number; size?: number }) {
  return (
    <Text accessibilityLabel={`${stars} of 3 stars`} style={{ fontSize: size }}>
      {[1, 2, 3].map((n) => (n <= stars ? '⭐' : '☆')).join('')}
    </Text>
  );
}

/** Read-aloud button: essential for pre-readers (ages 2-6). */
export function SpeakButton({ text }: { text: string }) {
  const soundOn = useAppStore((s) => s.soundOn);
  if (!soundOn) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Read aloud"
      hitSlop={12}
      onPress={() => {
        Speech.stop();
        Speech.speak(text, { rate: 0.9 });
      }}
      style={styles.speak}
    >
      <Text style={{ fontSize: 24 }}>🔊</Text>
    </Pressable>
  );
}

export function speak(text: string) {
  if (!useAppStore.getState().soundOn) return;
  Speech.stop();
  Speech.speak(text, { rate: 0.9 });
}

export const feedback = {
  correct: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  wrong: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
  tap: () => Haptics.selectionAsync().catch(() => {}),
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  button: {
    minHeight: 60,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  buttonSmall: { minHeight: 44, paddingHorizontal: 16 },
  buttonText: { color: 'white', fontSize: 20, fontWeight: '800' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.line,
  },
  speak: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.line,
  },
});

export { font };
