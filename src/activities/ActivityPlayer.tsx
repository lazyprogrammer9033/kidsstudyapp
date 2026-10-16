import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, sizeForAge } from '../components/theme';
import { BigButton, Card, StarRow, speak } from '../components/ui';
import type { Activity } from '../content/types';
import { starsFor, type Stars } from '../logic/scoring';
import { Count, Match, MultipleChoice, Order, Spell, TrueFalse, TypeAnswer } from './engines';

const CHEERS = ['Great job!', 'Awesome!', 'You got it!', 'Super!', 'Brilliant!', 'Well done!'];

function renderItem(activity: Activity, index: number, scale: number, onDone: (ok: boolean, why?: string) => void) {
  const props = { scale, onDone };
  const key = `${activity.id}-${index}`;
  switch (activity.type) {
    case 'multipleChoice':
      return <MultipleChoice key={key} {...props} item={activity.items[index]} />;
    case 'count':
      return <Count key={key} {...props} item={activity.items[index]} />;
    case 'match':
      return <Match key={key} {...props} item={activity.items[index]} />;
    case 'order':
      return <Order key={key} {...props} item={activity.items[index]} />;
    case 'spell':
      return <Spell key={key} {...props} item={activity.items[index]} />;
    case 'trueFalse':
      return <TrueFalse key={key} {...props} item={activity.items[index]} />;
    case 'typeAnswer':
      return <TypeAnswer key={key} {...props} item={activity.items[index]} />;
  }
}

export function ActivityPlayer({
  activity,
  age,
  onFinish,
  onExit,
}: {
  activity: Activity;
  age: number;
  onFinish: (stars: Stars) => void;
  onExit: () => void;
}) {
  const { tile: scale } = sizeForAge(age);
  const total = activity.items.length;
  const [index, setIndex] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [solved, setSolved] = useState<{ cheer: string; explanation?: string } | null>(null);
  const [finalStars, setFinalStars] = useState<Stars | null>(null);

  const handleDone = (ok: boolean, explanation?: string) => {
    if (ok) setFirstTry((n) => n + 1);
    const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    speak(cheer);
    setSolved({ cheer, explanation });
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setSolved(null);
    } else {
      const stars = starsFor(firstTry, total);
      setFinalStars(stars);
      onFinish(stars);
      speak(stars === 3 ? 'Amazing! Three stars!' : 'You finished! Great work!');
    }
  };

  if (finalStars !== null) {
    return (
      <Card style={styles.finish}>
        <Text style={{ fontSize: 80 }}>{finalStars === 3 ? '🏆' : '🎉'}</Text>
        <Text style={styles.finishTitle}>You finished {activity.title}!</Text>
        <StarRow stars={finalStars} size={44} />
        <Text style={styles.muted}>
          {firstTry} of {total} right on the first try
        </Text>
        <BigButton label="Back to my activities" onPress={onExit} style={{ alignSelf: 'stretch' }} />
      </Card>
    );
  }

  return (
    <View>
      <View style={styles.progressTrack} accessibilityLabel={`Question ${index + 1} of ${total}`}>
        <View style={[styles.progressFill, { width: `${((index + (solved ? 1 : 0)) / total) * 100}%` }]} />
      </View>
      {index === 0 && !solved ? <Text style={styles.instructions}>{activity.instructions}</Text> : null}
      <View pointerEvents={solved ? 'none' : 'auto'} style={{ opacity: solved ? 0.85 : 1 }}>
        {renderItem(activity, index, scale, handleDone)}
      </View>
      {solved && (
        <View style={styles.solved}>
          <Text style={styles.cheer}>🎉 {solved.cheer}</Text>
          {solved.explanation ? <Text style={styles.explanation}>{solved.explanation}</Text> : null}
          <BigButton label={index + 1 < total ? 'Next ➜' : 'Finish 🏁'} color={colors.good} onPress={next} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 14, backgroundColor: colors.line, borderRadius: 7, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: colors.good, borderRadius: 7 },
  instructions: { fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 12 },
  solved: { marginTop: 16, padding: 16, backgroundColor: colors.goodBg, borderRadius: radius.md },
  cheer: { fontSize: 24, fontWeight: '800', color: colors.good, textAlign: 'center' },
  explanation: { fontSize: 17, color: colors.ink, textAlign: 'center', marginTop: 6 },
  finish: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  finishTitle: { fontSize: 24, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  muted: { fontSize: 16, color: colors.muted },
});
