import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '../components/theme';

export type TileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'done';

const BG: Record<TileState, string> = {
  idle: colors.card,
  selected: '#EEEBFF',
  correct: colors.goodBg,
  wrong: colors.badBg,
  done: colors.goodBg,
};
const BORDER: Record<TileState, string> = {
  idle: colors.line,
  selected: colors.accent,
  correct: colors.good,
  wrong: colors.bad,
  done: colors.good,
};

/** Emoji-only labels render big; words render at a readable size that scales with age. */
export function isEmojiOnly(s: string): boolean {
  return /^[\p{Extended_Pictographic}\p{Emoji_Component}‍️\s]+$/u.test(s) && !/^[\d#*\s]+$/.test(s);
}

export function Tile({
  label,
  state = 'idle',
  onPress,
  scale = 1,
  style,
}: {
  label: string;
  state?: TileState;
  onPress?: () => void;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const emoji = isEmojiOnly(label);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: state === 'selected', disabled: state === 'done' }}
      disabled={state === 'done' || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { minHeight: 64 * scale, backgroundColor: BG[state], borderColor: BORDER[state] },
        pressed && { transform: [{ scale: 0.96 }] },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: (emoji ? 40 : 20) * scale }, state === 'done' && { opacity: 0.6 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.ink, fontWeight: '700', textAlign: 'center' },
});
