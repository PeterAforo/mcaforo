import { forwardRef } from 'react'
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native'

import { colors, radius, spacing } from '@/theme/tokens'

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '700' }}>
      {children}
    </Text>
  )
}

export function Muted({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
      {children}
    </Text>
  )
}

interface ButtonProps extends PressableProps {
  title: string
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ title, loading, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const bg =
    variant === 'primary' ? colors.mcaforoOrange : variant === 'secondary' ? colors.surface : 'transparent'
  const fg = variant === 'ghost' ? colors.textPrimary : '#fff'
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: 14,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || disabled ? 0.7 : 1,
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '600', fontSize: 16 }}>{title}</Text>
      )}
    </Pressable>
  )
}

interface FieldProps extends TextInputProps {
  label: string
  error?: string
}
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, style, ...rest },
  ref
) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: colors.textPrimary, marginBottom: 6, fontWeight: '500' }}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textSecondary}
        style={[
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16, // 16px prevents iOS zoom
            minHeight: 48,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={{ color: colors.danger, marginTop: 4, fontSize: 13 }}>{error}</Text>
      ) : null}
    </View>
  )
})

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}
