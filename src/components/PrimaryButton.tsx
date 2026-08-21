import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        { backgroundColor: variant === 'danger' ? colors.danger : colors.primary },
        (loading || disabled) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});