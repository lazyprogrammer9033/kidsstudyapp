import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton } from './ui';
import { colors, radius } from './theme';

/**
 * Parental gate required by Apple (Kids Category, guideline 1.3) and Google Families
 * before purchases, external links and settings. A multiplication question that young
 * children cannot answer but any adult can.
 */
function newQuestion() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 7);
  const answer = a * b;
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + delta * (Math.random() < 0.5 ? 1 : a);
    if (candidate > 0) options.add(candidate);
  }
  return { a, b, answer, options: [...options].sort((x, y) => x - y) };
}

export function ParentGate({
  visible,
  onPass,
  onCancel,
}: {
  visible: boolean;
  onPass: () => void;
  onCancel: () => void;
}) {
  const [seed, setSeed] = useState(0);
  const [failed, setFailed] = useState(false);
  const q = useMemo(newQuestion, [seed, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Grown-ups only</Text>
          <Text style={styles.body}>To continue, please answer:</Text>
          <Text style={styles.question}>
            What is {q.a} × {q.b}?
          </Text>
          <View style={styles.row}>
            {q.options.map((o) => (
              <Pressable
                key={o}
                accessibilityRole="button"
                onPress={() => {
                  if (o === q.answer) {
                    setFailed(false);
                    onPass();
                  } else {
                    setFailed(true);
                    setSeed((s) => s + 1);
                  }
                }}
                style={styles.option}
              >
                <Text style={styles.optionText}>{o}</Text>
              </Pressable>
            ))}
          </View>
          {failed && <Text style={styles.failed}>Not quite — here is a new one.</Text>}
          <BigButton label="Cancel" small color={colors.muted} onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 420, backgroundColor: colors.card, borderRadius: radius.lg, padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  question: { fontSize: 28, fontWeight: '800', color: colors.accent, textAlign: 'center', marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 8 },
  option: {
    minWidth: 70,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.line,
  },
  optionText: { fontSize: 22, fontWeight: '700', color: colors.ink },
  failed: { color: colors.bad, textAlign: 'center' },
});
