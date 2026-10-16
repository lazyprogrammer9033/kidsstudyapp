import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { goBack } from '../../components/nav';
import { colors, radius } from '../../components/theme';
import { BigButton, Screen } from '../../components/ui';
import { MAX_AGE, MIN_AGE } from '../../content/types';
import { AVATARS, useAppStore } from '../../store/useAppStore';

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

export default function EditProfile() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useAppStore((s) => s.profiles.find((p) => p.id === id));
  const addProfile = useAppStore((s) => s.addProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(existing?.name ?? '');
  const [age, setAge] = useState<number | null>(existing?.age ?? null);
  const [avatar, setAvatar] = useState<string>(existing?.avatar ?? AVATARS[0]);
  const valid = name.trim().length > 0 && age !== null;

  const save = () => {
    if (!valid) return;
    if (existing) updateProfile(existing.id, { name, age, avatar });
    else addProfile({ name, age, avatar });
    goBack();
  };

  return (
    <Screen>
      <Text style={styles.label}>First name or nickname</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={20}
        placeholder="e.g. Sia"
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCorrect={false}
      />
      <Text style={styles.label}>Age</Text>
      <View style={styles.wrap}>
        {AGES.map((a) => (
          <Pressable
            key={a}
            accessibilityRole="button"
            accessibilityState={{ selected: age === a }}
            onPress={() => setAge(a)}
            style={[styles.chip, age === a && styles.chipOn]}
          >
            <Text style={[styles.chipText, age === a && { color: 'white' }]}>{a}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Pick a buddy</Text>
      <View style={styles.wrap}>
        {AVATARS.map((a) => (
          <Pressable
            key={a}
            accessibilityRole="button"
            accessibilityState={{ selected: avatar === a }}
            onPress={() => setAvatar(a)}
            style={[styles.avatar, avatar === a && styles.avatarOn]}
          >
            <Text style={{ fontSize: 36 }}>{a}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.note}>Profiles stay on this device. We never ask for a child's full name, photo or email.</Text>
      <BigButton label={existing ? 'Save' : 'Add learner'} onPress={save} disabled={!valid} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    fontSize: 20,
    padding: 14,
    color: colors.ink,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 18, fontWeight: '700', color: colors.ink },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOn: { borderColor: colors.accent, backgroundColor: '#EEEBFF' },
  note: { fontSize: 14, color: colors.muted, marginVertical: 16 },
});
