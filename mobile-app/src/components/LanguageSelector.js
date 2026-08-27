import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { useLanguage } from '../context/LanguageContext';

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'de', label: 'Deutsch' },
  { code: 'vi', label: 'Tiếng Việt' },
];

export function languageLabel(locale) {
  return LANGUAGE_OPTIONS.find((option) => option.code === locale)?.label || 'English';
}

export function LanguageChips({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {LANGUAGE_OPTIONS.map((option) => {
        const selected = value === option.code;
        return (
          <Pressable
            key={option.code}
            accessibilityRole="button"
            accessibilityLabel={t('useLanguageOption', { language: option.label })}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.code)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function LanguageMenuButton({ value, onChange, light = false }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const select = (code) => {
    onChange(code);
    setVisible(false);
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('languageCurrent', { language: languageLabel(value) })}
        accessibilityHint={t('opensLanguageSelector')}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.trigger, light && styles.triggerLight, pressed && styles.pressed]}
      >
        <Text style={[styles.triggerText, light && styles.triggerTextLight]}>{languageLabel(value)}</Text>
        <Text style={[styles.chevron, light && styles.triggerTextLight]} accessible={false}>⌄</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} accessibilityRole="button" accessibilityLabel={t('closeLanguageSelector')}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('languageHeading')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('closeLanguageSelector')} onPress={() => setVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.optionList}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = value === option.code;
                return (
                  <Pressable
                    key={option.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => select(option.code)}
                    style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  trigger: { minHeight: 38, maxWidth: 150, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.45)', backgroundColor: 'rgba(255,255,255,.12)', flexDirection: 'row', alignItems: 'center', gap: 7 },
  triggerLight: { borderColor: ThemeColor.INPUT_BORDER, backgroundColor: ThemeColor.WHITE },
  triggerText: { color: ThemeColor.WHITE, fontSize: 13, fontWeight: '800', flexShrink: 1 },
  triggerTextLight: { color: ThemeColor.TEXT_PRIMARY },
  chevron: { color: ThemeColor.WHITE, fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(9,16,36,.52)', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 440, maxHeight: '78%', alignSelf: 'center', backgroundColor: ThemeColor.WHITE, borderRadius: 20, padding: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { color: ThemeColor.TEXT_PRIMARY, fontSize: 22, fontWeight: '900' },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ThemeColor.INPUT_BG },
  closeText: { color: ThemeColor.TEXT_PRIMARY, fontSize: 25, lineHeight: 27 },
  optionList: { gap: 8, paddingBottom: 4 },
  option: { minHeight: 48, borderRadius: ThemeRadius.MD, borderWidth: 1, borderColor: ThemeColor.INPUT_BORDER, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { borderColor: ThemeColor.BRAND, backgroundColor: '#efedff' },
  optionText: { color: ThemeColor.TEXT_PRIMARY, fontSize: 16, fontWeight: '700' },
  optionTextSelected: { color: ThemeColor.BRAND, fontWeight: '900' },
  check: { color: ThemeColor.BRAND, fontSize: 18, fontWeight: '900' },
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 14 },
  chip: { minHeight: 42, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: ThemeColor.INPUT_BORDER, backgroundColor: ThemeColor.WHITE, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { borderColor: ThemeColor.BRAND, backgroundColor: '#efedff' },
  chipText: { color: ThemeColor.TEXT_MUTED, fontSize: 14, fontWeight: '700' },
  chipTextSelected: { color: ThemeColor.BRAND, fontWeight: '900' },
});
