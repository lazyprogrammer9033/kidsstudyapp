import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '../components/theme';
import { BigButton, feedback, SpeakButton } from '../components/ui';
import type {
  CountItem,
  MatchItem,
  MultipleChoiceItem,
  OrderItem,
  SpellItem,
  TrueFalseItem,
  TypeAnswerItem,
} from '../content/types';
import { normalizeAnswer, shuffle } from '../logic/scoring';
import { Tile, type TileState } from './Tile';

/**
 * Each engine renders one item and calls onDone exactly once, when the child reaches the
 * right answer. `firstTry` is false if any mistake was made along the way.
 */
export interface EngineProps<T> {
  item: T;
  scale: number;
  onDone: (firstTry: boolean, explanation?: string) => void;
}

function useDoneOnce(onDone: EngineProps<unknown>['onDone']) {
  const done = useRef(false);
  return (firstTry: boolean, explanation?: string) => {
    if (done.current) return;
    done.current = true;
    feedback.correct();
    onDone(firstTry, explanation);
  };
}

function Prompt({ text, emoji, scale }: { text: string; emoji?: string; scale: number }) {
  return (
    <View style={styles.promptRow}>
      <View style={{ flex: 1 }}>
        {emoji ? <Text style={{ fontSize: 64 * scale, textAlign: 'center' }}>{emoji}</Text> : null}
        <Text style={[styles.prompt, { fontSize: 22 * scale }]}>{text}</Text>
      </View>
      <SpeakButton text={text} />
    </View>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function MultipleChoice({ item, scale, onDone }: EngineProps<MultipleChoiceItem>) {
  const finish = useDoneOnce(onDone);
  const [wrong, setWrong] = useState<number[]>([]);
  const [correct, setCorrect] = useState(false);
  return (
    <View>
      <Prompt text={item.prompt} emoji={item.emoji} scale={scale} />
      <Grid>
        {item.choices.map((c, i) => {
          const state: TileState = correct && i === item.answer ? 'correct' : wrong.includes(i) ? 'wrong' : 'idle';
          return (
            <Tile
              key={i}
              label={c}
              scale={scale}
              state={state}
              style={styles.half}
              onPress={() => {
                if (correct || wrong.includes(i)) return;
                if (i === item.answer) {
                  setCorrect(true);
                  finish(wrong.length === 0, item.explanation);
                } else {
                  feedback.wrong();
                  setWrong((w) => [...w, i]);
                }
              }}
            />
          );
        })}
      </Grid>
    </View>
  );
}

export function TrueFalse({ item, scale, onDone }: EngineProps<TrueFalseItem>) {
  return (
    <MultipleChoice
      item={{ prompt: item.statement, choices: ['✅ True', '❌ False'], answer: item.answer ? 0 : 1, explanation: item.explanation }}
      scale={scale}
      onDone={onDone}
    />
  );
}

export function Count({ item, scale, onDone }: EngineProps<CountItem>) {
  const choices = useMemo(() => {
    const opts = new Set([item.count]);
    for (const d of shuffle([-2, -1, 1, 2, 3])) {
      if (opts.size >= 4) break;
      const n = item.count + d;
      if (n >= 1 && n <= 20) opts.add(n);
    }
    return [...opts].sort((a, b) => a - b).map(String);
  }, [item.count]);
  return (
    <View>
      <View style={styles.countBox}>
        {Array.from({ length: item.count }, (_, i) => (
          <Text key={i} style={{ fontSize: 44 * scale }}>
            {item.emoji}
          </Text>
        ))}
      </View>
      <MultipleChoice
        item={{ prompt: item.prompt ?? `How many ${item.emoji} can you count?`, choices, answer: choices.indexOf(String(item.count)) }}
        scale={scale}
        onDone={onDone}
      />
    </View>
  );
}

export function Match({ item, scale, onDone }: EngineProps<MatchItem>) {
  const finish = useDoneOnce(onDone);
  const lefts = useMemo(() => shuffle(item.pairs.map((p) => p[0])), [item]);
  const rights = useMemo(() => shuffle(item.pairs.map((p) => p[1])), [item]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongRight, setWrongRight] = useState<string | null>(null);
  const mistakes = useRef(0);
  const partner = (l: string) => item.pairs.find((p) => p[0] === l)![1];

  useEffect(() => {
    if (!wrongRight) return;
    const t = setTimeout(() => setWrongRight(null), 600);
    return () => clearTimeout(t);
  }, [wrongRight]);

  const prompt = item.prompt ?? 'Tap one on the left, then its match on the right.';
  return (
    <View>
      <Prompt text={prompt} scale={scale} />
      <View style={styles.columns}>
        <View style={styles.column}>
          {lefts.map((l) => (
            <Tile
              key={l}
              label={l}
              scale={scale}
              state={matched.includes(l) ? 'done' : selected === l ? 'selected' : 'idle'}
              onPress={() => {
                feedback.tap();
                setSelected(l);
              }}
            />
          ))}
        </View>
        <View style={styles.column}>
          {rights.map((r) => {
            const isMatched = matched.some((l) => partner(l) === r);
            return (
              <Tile
                key={r}
                label={r}
                scale={scale}
                state={isMatched ? 'done' : wrongRight === r ? 'wrong' : 'idle'}
                onPress={() => {
                  if (!selected) return;
                  if (partner(selected) === r) {
                    const next = [...matched, selected];
                    setMatched(next);
                    setSelected(null);
                    if (next.length === item.pairs.length) finish(mistakes.current === 0);
                    else feedback.tap();
                  } else {
                    mistakes.current++;
                    feedback.wrong();
                    setWrongRight(r);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function Order({ item, scale, onDone }: EngineProps<OrderItem>) {
  const finish = useDoneOnce(onDone);
  const pool = useMemo(() => {
    // Never present the cards already in the right order.
    let s = shuffle(item.sequence);
    for (let i = 0; i < 5 && s.every((v, j) => v === item.sequence[j]); i++) s = shuffle(item.sequence);
    return s;
  }, [item]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const mistakes = useRef(0);

  return (
    <View>
      <Prompt text={item.prompt} scale={scale} />
      <View style={styles.answerRow}>
        {item.sequence.map((_, i) => (
          <View key={i} style={[styles.slot, placed[i] ? styles.slotFilled : null]}>
            <Text style={{ fontSize: 18 * scale, fontWeight: '700', color: colors.ink }}>{placed[i] ?? i + 1}</Text>
          </View>
        ))}
      </View>
      <Grid>
        {pool.map((c) => (
          <Tile
            key={c}
            label={c}
            scale={scale}
            style={styles.half}
            state={placed.includes(c) ? 'done' : wrong === c ? 'wrong' : 'idle'}
            onPress={() => {
              if (c === item.sequence[placed.length]) {
                const next = [...placed, c];
                setPlaced(next);
                setWrong(null);
                if (next.length === item.sequence.length) finish(mistakes.current === 0);
                else feedback.tap();
              } else {
                mistakes.current++;
                feedback.wrong();
                setWrong(c);
              }
            }}
          />
        ))}
      </Grid>
    </View>
  );
}

export function Spell({ item, scale, onDone }: EngineProps<SpellItem>) {
  const finish = useDoneOnce(onDone);
  const word = item.word.toUpperCase();
  const tiles = useMemo(
    () => shuffle([...word, ...(item.extraLetters ?? '').toUpperCase()].map((ch, i) => ({ ch, id: i }))),
    [word, item.extraLetters],
  );
  const [used, setUsed] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const mistakes = useRef(0);
  const typed = used.map((id) => tiles.find((t) => t.id === id)!.ch).join('');

  return (
    <View>
      <View style={styles.promptRow}>
        <Text style={{ fontSize: 72 * scale, flex: 1, textAlign: 'center' }}>{item.hint}</Text>
        <SpeakButton text={item.word} />
      </View>
      <View style={styles.answerRow}>
        {[...word].map((_, i) => (
          <View key={i} style={[styles.letterSlot, typed[i] ? styles.slotFilled : null]}>
            <Text style={{ fontSize: 26 * scale, fontWeight: '800', color: colors.ink }}>{typed[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <View style={styles.letters}>
        {tiles.map((t) => (
          <Tile
            key={t.id}
            label={t.ch}
            scale={scale}
            style={{ width: 60 * scale }}
            state={used.includes(t.id) ? 'done' : wrong === t.id ? 'wrong' : 'idle'}
            onPress={() => {
              if (t.ch === word[used.length]) {
                const next = [...used, t.id];
                setUsed(next);
                setWrong(null);
                if (next.length === word.length) finish(mistakes.current === 0);
                else feedback.tap();
              } else {
                mistakes.current++;
                feedback.wrong();
                setWrong(t.id);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function TypeAnswer({ item, scale, onDone }: EngineProps<TypeAnswerItem>) {
  const finish = useDoneOnce(onDone);
  const [value, setValue] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'revealed'>('idle');
  const accepted = useMemo(() => item.answers.map(normalizeAnswer), [item.answers]);

  const check = () => {
    if (!value.trim()) return;
    if (accepted.includes(normalizeAnswer(value))) {
      finish(attempts === 0, item.explanation);
      return;
    }
    feedback.wrong();
    const n = attempts + 1;
    setAttempts(n);
    setStatus(n >= 2 ? 'revealed' : 'wrong');
  };

  return (
    <View>
      <Prompt text={item.prompt} scale={scale} />
      <TextInput
        value={value}
        onChangeText={(v) => {
          setValue(v);
          if (status === 'wrong') setStatus('idle');
        }}
        onSubmitEditing={check}
        keyboardType={item.keyboard === 'numeric' ? 'numbers-and-punctuation' : 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        placeholder="Type your answer"
        placeholderTextColor={colors.muted}
        style={[styles.input, status === 'wrong' && { borderColor: colors.bad }]}
      />
      {status === 'wrong' && <Text style={styles.hint}>Not quite — try again!</Text>}
      {status === 'revealed' ? (
        <>
          <Text style={styles.hint}>The answer is: {item.answers[0]}</Text>
          <BigButton label="Got it" color={colors.accent} onPress={() => finish(false, item.explanation)} />
        </>
      ) : (
        <BigButton label="Check" color={colors.accent} onPress={check} disabled={!value.trim()} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  prompt: { fontWeight: '700', color: colors.ink, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  half: { flexGrow: 1, flexBasis: '45%' },
  countBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
  },
  columns: { flexDirection: 'row', gap: 16 },
  column: { flex: 1, gap: 10 },
  answerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  slot: {
    minWidth: 56,
    minHeight: 48,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.locked,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSlot: {
    width: 48,
    height: 56,
    borderBottomWidth: 4,
    borderColor: colors.locked,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: { borderColor: colors.good, borderStyle: 'solid', backgroundColor: colors.goodBg },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.line,
    borderRadius: radius.md,
    fontSize: 22,
    padding: 16,
    color: colors.ink,
    marginBottom: 8,
  },
  hint: { fontSize: 18, color: colors.muted, textAlign: 'center', marginBottom: 8 },
});
