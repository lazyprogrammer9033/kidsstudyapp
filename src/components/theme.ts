import { useWindowDimensions } from 'react-native';

export const colors = {
  bg: '#FFF7E8',
  card: '#FFFFFF',
  ink: '#2D2A32',
  muted: '#7A7480',
  primary: '#FF7A45',
  primaryDark: '#E25F2B',
  accent: '#7B6CF6',
  good: '#2BB673',
  goodBg: '#E3F7EC',
  bad: '#E5484D',
  badBg: '#FDE8E8',
  line: '#EFE6D8',
  star: '#FFC233',
  locked: '#C9C2B8',
};

export const radius = { sm: 12, md: 18, lg: 28 };

export const font = {
  title: { fontSize: 30, fontWeight: '800' as const, color: colors.ink },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 18, color: colors.ink },
  small: { fontSize: 14, color: colors.muted },
};

/** Phones get bigger relative targets for small fingers; tablets get more columns. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const contentWidth = Math.min(width, isTablet ? 900 : width);
  return { width, height, isTablet, contentWidth, columns: isTablet ? 3 : 2 };
}

/** Younger kids get larger text and tiles. */
export function sizeForAge(age: number) {
  if (age <= 4) return { tile: 1.25, text: 1.3 };
  if (age <= 7) return { tile: 1.1, text: 1.15 };
  return { tile: 1, text: 1 };
}
