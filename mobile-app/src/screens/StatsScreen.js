import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { useLanguage } from '../context/LanguageContext';

function formatMinutes(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

function StatCard({ icon, label, value, hint, accent }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accent.background }]}>
        <Ionicons name={icon} size={18} color={accent.foreground} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
    </View>
  );
}

function formatSessionDate(timestamp, locale) {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date) return '';
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function shiftMonth(date, amount) {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  return next;
}

function formatMonth(date, locale) {
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' });
}

function formatCalendarDay(dateKeyValue, locale) {
  return new Date(`${dateKeyValue}T12:00:00`).toLocaleDateString(
    locale === 'ko' ? 'ko-KR' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' },
  );
}

function buildActivityCalendar(sessions, visibleMonth) {
  const counts = new Map();
  sessions.forEach((session) => {
    const date = session.localDate
      ? new Date(`${session.localDate}T12:00:00`)
      : session.createdAt?.toDate?.();
    if (!date || Number.isNaN(date.getTime())) return;
    const key = dateKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
  const firstWeek = startOfWeek(monthStart);
  const lastWeek = startOfWeek(monthEnd);
  const weekCount = Math.round((lastWeek - firstWeek) / (7 * 24 * 60 * 60 * 1000)) + 1;
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => (
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(firstWeek);
      date.setDate(firstWeek.getDate() + (weekIndex * 7) + dayIndex);
      const count = counts.get(dateKey(date)) || 0;
      return {
        date: dateKey(date),
        count,
        inMonth: date.getMonth() === visibleMonth.getMonth() && date.getFullYear() === visibleMonth.getFullYear(),
        level: count === 0 ? 0 : Math.min(count, 4),
      };
    })
  ));

  const visibleDays = weeks.flat().filter((day) => day.inMonth);

  return {
    weeks,
    startDate: dateKey(monthStart),
    endDate: dateKey(monthEnd),
    activeDays: visibleDays.filter((day) => day.count > 0).length,
    activeWeeks: weeks.filter((week) => week.some((day) => day.inMonth && day.count > 0)).length,
  };
}

function ActivityCalendar({ calendar, calendarEndDate, t, locale, onMove, canMoveForward }) {
  const weekdayLabels = [
    t('weekdaySun'),
    t('weekdayMon'),
    t('weekdayTue'),
    t('weekdayWed'),
    t('weekdayThu'),
    t('weekdayFri'),
    t('weekdaySat'),
  ];
  const [hoveredControl, setHoveredControl] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const rangeLabel = formatMonth(calendarEndDate, locale);
  const previousLabel = t('calendarPrevious', { month: formatMonth(shiftMonth(calendarEndDate, -1), locale) });
  const nextLabel = t('calendarNext', { month: formatMonth(shiftMonth(calendarEndDate, 1), locale) });
  useEffect(() => setSelectedDay(null), [calendarEndDate]);
  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <View style={styles.calendarTitleWrap}>
          <Text style={styles.calendarTitle}>{t('activityCalendar')}</Text>
          <Text style={styles.calendarRange}>{rangeLabel}</Text>
          <Text style={styles.calendarSummary}>
            {t('activityCalendarSummary', { days: calendar.activeDays, weeks: calendar.activeWeeks })}
          </Text>
        </View>
        <View style={styles.calendarControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={previousLabel}
            onPress={() => onMove(-1)}
            onHoverIn={() => setHoveredControl('previous')}
            onHoverOut={() => setHoveredControl(null)}
            style={({ pressed }) => [styles.calendarArrow, pressed && styles.calendarArrowPressed]}
          >
            <Ionicons name="chevron-back" size={17} color={ThemeColor.BRAND} />
            {hoveredControl === 'previous' ? <Text style={styles.calendarTooltip}>{previousLabel}</Text> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
            onPress={() => onMove(1)}
            onHoverIn={() => setHoveredControl('next')}
            onHoverOut={() => setHoveredControl(null)}
            disabled={!canMoveForward}
            style={({ pressed }) => [styles.calendarArrow, !canMoveForward && styles.calendarArrowDisabled, pressed && styles.calendarArrowPressed]}
          >
            <Ionicons name="chevron-forward" size={17} color={canMoveForward ? ThemeColor.BRAND : '#b9b4c8'} />
            {hoveredControl === 'next' ? <Text style={styles.calendarTooltip}>{nextLabel}</Text> : null}
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.calendarScroller}>
        <View>
          <View style={styles.calendarGrid}>
            <View style={styles.calendarWeekdayHeader}>
              <View style={styles.calendarWeekNumberSpacer} />
              {weekdayLabels.map((label, index) => <Text key={index} style={styles.weekdayLabel}>{label}</Text>)}
            </View>
            <View style={styles.calendarWeekRows}>
              {calendar.weeks.map((week, weekIndex) => (
                <View
                  key={`week-${weekIndex}`}
                  style={styles.calendarWeekRow}
                  accessibilityLabel={t('calendarWeek', { week: weekIndex + 1 })}
                >
                  <Text style={styles.calendarWeekNumber}>{weekIndex + 1}</Text>
                  {week.map((day) => (
                    <Pressable
                      key={day.date}
                      disabled={!day.inMonth}
                      accessibilityRole="button"
                      accessibilityElementsHidden={!day.inMonth}
                      accessibilityState={{ selected: selectedDay?.date === day.date }}
                      accessibilityLabel={t('activityTooltip', {
                        date: formatCalendarDay(day.date, locale),
                        count: day.count,
                        suffix: day.count === 1 ? '' : 's',
                      })}
                      onPress={() => setSelectedDay(day)}
                      onHoverIn={() => setSelectedDay(day)}
                      style={({ pressed }) => [
                        styles.calendarCell,
                        !day.inMonth && styles.calendarCellOutsideMonth,
                        selectedDay?.date === day.date && styles.calendarCellSelected,
                        pressed && styles.calendarCellPressed,
                        day.level === 1 && styles.calendarLevel1,
                        day.level === 2 && styles.calendarLevel2,
                        day.level === 3 && styles.calendarLevel3,
                        day.level === 4 && styles.calendarLevel4,
                      ]}
                    >
                      {day.inMonth ? (
                        <Text style={[styles.calendarDayNumber, day.level >= 3 && styles.calendarDayNumberStrong]}>
                          {Number(day.date.slice(-2))}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      {selectedDay ? (
        <View style={styles.calendarSelection} accessibilityLiveRegion="polite">
          <Text style={styles.calendarSelectionDate}>{formatCalendarDay(selectedDay.date, locale)}</Text>
          <Text style={styles.calendarSelectionCount}>
            {t('activityTooltip', {
              date: formatCalendarDay(selectedDay.date, locale),
              count: selectedDay.count,
              suffix: selectedDay.count === 1 ? '' : 's',
            })}
          </Text>
        </View>
      ) : null}
      <View style={styles.calendarLegend}>
        <Text style={styles.legendLabel}>{t('lessActivity')}</Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View key={level} style={[
            styles.legendCell,
            level === 1 && styles.calendarLevel1,
            level === 2 && styles.calendarLevel2,
            level === 3 && styles.calendarLevel3,
            level === 4 && styles.calendarLevel4,
          ]} />
        ))}
        <Text style={styles.legendLabel}>{t('moreActivity')}</Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { t, locale } = useLanguage();
  const [userData, setUserData] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [uid, setUid] = useState(auth.currentUser?.uid ?? null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [calendarEndDate, setCalendarEndDate] = useState(() => new Date());
  const rhythmEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      rhythmEntrance.setValue(1);
      return undefined;
    }
    Animated.timing(rhythmEntrance, {
      toValue: 1,
      duration: 460,
      delay: 90,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    return undefined;
  }, [reduceMotion, rhythmEntrance]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      if (!user) {
        setUserData(null);
        setRecentSessions([]);
        setSyncError(false);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return undefined;
    setLoading(true);
    setSyncError(false);
    const userRef = doc(db, 'users', uid);
    const sessionsQuery = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('createdAt', 'desc'),
      limit(500),
    );
    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        setUserData(snap.exists() ? snap.data() : {});
        setLoading(false);
      },
      () => {
        setSyncError(true);
        setLoading(false);
      },
    );
    const unsubSessions = onSnapshot(
      sessionsQuery,
      (snap) => setRecentSessions(snap.docs.map((session) => ({ id: session.id, ...session.data() }))),
      () => setSyncError(true),
    );
    return () => {
      unsubUser();
      unsubSessions();
    };
  }, [retryKey, uid]);

  const totalSessionSeconds =
    userData?.totalSessionSeconds ?? userData?.totalSessionTime ?? 0;
  const currentStreak = userData?.currentStreak ?? 0;
  const longestStreak = userData?.longestStreak ?? 0;
  const totalActiveDays =
    userData?.totalActiveDays ?? userData?.totalDays ?? 0;
  const sessionsFinished = userData?.sessionsFinished ?? 0;
  const activityCalendar = useMemo(
    () => buildActivityCalendar(recentSessions, calendarEndDate),
    [calendarEndDate, recentSessions],
  );
  const canMoveCalendarForward = dateKey(calendarEndDate) < dateKey(new Date());
  const visibleRecentSessions = recentSessions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>{t('statsEyebrow')}</Text>
        <Text style={styles.title}>{t('statsTitle')}</Text>
        <Text style={styles.subtitle}>
          {loading ? t('statsLoading') : !uid ? t('statsSignedOut') : t('statsSubtitle')}
        </Text>

        {syncError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={21} color="#9b5b20" />
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>{t('syncErrorTitle')}</Text>
              <Text style={styles.errorBody}>{t('syncErrorBody')}</Text>
            </View>
            <Pressable onPress={() => setRetryKey((value) => value + 1)} accessibilityRole="button" style={styles.retryButton}>
              <Text style={styles.retryText}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        <Animated.View
          style={[styles.featureCard, {
            opacity: rhythmEntrance,
            transform: [{ scale: rhythmEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
          }]}
        >
          <View style={styles.featureIcon}><Ionicons name="leaf-outline" size={22} color="#2d6b62" /></View>
          <View style={styles.featureCopy}>
            <Text style={styles.featureLabel}>{t('currentRhythm')}</Text>
            <Text style={styles.featureValue}>{t(currentStreak === 1 ? 'dayCountOne' : 'dayCountMany', { count: currentStreak })}</Text>
            <Text style={styles.featureHint}>{currentStreak > 0 ? t('keepReturning') : t('startPractice')}</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionLabel}>{t('statsNumbers')}</Text>
        <View style={styles.grid}>
          <StatCard
            icon="flame-outline"
            label={t('dayStreak')}
            value={String(currentStreak)}
            accent={{ background: '#fff2df', foreground: '#a5651b' }}
            hint={
              longestStreak > 0
                ? t('longestStreak', { count: longestStreak, suffix: longestStreak === 1 ? '' : 's' })
                : undefined
            }
          />
          <StatCard
            icon="calendar-outline"
            label={t('daysActive')}
            value={String(totalActiveDays)}
            accent={{ background: '#edf3fb', foreground: '#1f3c88' }}
            hint={totalActiveDays > 0 ? t('totalUniqueDays') : undefined}
          />
          <StatCard
            icon="time-outline"
            label={t('timeInSessions')}
            value={formatMinutes(totalSessionSeconds)}
            accent={{ background: '#f1ecfb', foreground: '#7656a6' }}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label={t('sessionsCompleted')}
            value={String(sessionsFinished)}
            accent={{ background: '#eaf4ef', foreground: '#2d6b62' }}
          />
        </View>

        <Text style={styles.sectionLabel}>{t('activityCalendar')}</Text>
        <ActivityCalendar
          calendar={activityCalendar}
          calendarEndDate={calendarEndDate}
          t={t}
          locale={locale}
          canMoveForward={canMoveCalendarForward}
          onMove={(amount) => setCalendarEndDate((current) => {
            const next = shiftMonth(current, amount);
            if (amount > 0 && next > new Date()) return new Date();
            return next;
          })}
        />

        <Text style={styles.sectionLabel}>{t('recentPractice')}</Text>
        <View style={styles.history}>
          {visibleRecentSessions.length === 0 ? (
            <Text style={styles.emptyText}>{t('noRecentPractice')}</Text>
          ) : visibleRecentSessions.map((session, index) => (
            <View key={session.id} style={[styles.historyRow, index < visibleRecentSessions.length - 1 && styles.historyDivider]}>
              <View style={styles.historyDot}><Ionicons name="checkmark" size={13} color="#2d6b62" /></View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle} numberOfLines={1}>{session.sessionTitle || t('sessionsCompleted')}</Text>
                <Text style={styles.historyMeta}>{formatSessionDate(session.createdAt, locale)} · {formatMinutes(session.durationSeconds || 0)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: ThemeColor.SHADOW_SLATE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ThemeColor.SCREEN_BG,
  },
  container: {
    padding: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: { color: '#2d6b62', fontSize: 11, letterSpacing: 1.8, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: '#162846', marginBottom: 7 },
  subtitle: {
    fontSize: 14,
    color: ThemeColor.HOME_CARD_TEXT,
    marginBottom: 22,
  },
  errorBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff6e9', borderWidth: 1, borderColor: '#f1dfc0', borderRadius: ThemeRadius.MD, marginBottom: 22 },
  errorCopy: { flex: 1, marginHorizontal: 10 },
  errorTitle: { color: '#774b1f', fontSize: 13, fontWeight: '800' },
  errorBody: { color: '#8c6a43', fontSize: 12, marginTop: 2 },
  retryButton: { paddingVertical: 7, paddingHorizontal: 9 },
  retryText: { color: '#8a531c', fontSize: 12, fontWeight: '800' },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eaf2ef', borderRadius: ThemeRadius.MD, padding: 18, marginBottom: 28 },
  featureIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  featureCopy: { marginLeft: 13 },
  featureLabel: { color: '#52716b', fontSize: 12, fontWeight: '700' },
  featureValue: { color: '#245449', fontSize: 24, fontWeight: '800', marginTop: 1 },
  featureHint: { color: '#5c746e', fontSize: 12, marginTop: 2 },
  sectionLabel: { color: '#526477', fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', fontWeight: '800', marginBottom: 9 },
  history: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e7ed', borderRadius: ThemeRadius.MD, paddingHorizontal: 15, marginBottom: 22 },
  historyRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center' },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  historyDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eaf4ef', alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1, marginLeft: 11 },
  historyTitle: { color: '#162846', fontSize: 14, fontWeight: '700' },
  historyMeta: { color: '#7a849c', fontSize: 12, marginTop: 3 },
  emptyText: { color: '#7a849c', fontSize: 13, lineHeight: 19, paddingVertical: 17 },
  calendarCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3dff1', borderRadius: 18, padding: 16, marginBottom: 24 },
  calendarHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  calendarTitleWrap: { flex: 1 },
  calendarTitle: { color: '#292541', fontSize: 16, fontWeight: '800' },
  calendarRange: { color: ThemeColor.BRAND, fontSize: 14, fontWeight: '800', marginTop: 4 },
  calendarSummary: { color: '#746f88', fontSize: 12, marginTop: 4 },
  calendarScroller: { paddingBottom: 8, minWidth: '100%' },
  calendarControls: { flexDirection: 'row', gap: 6, position: 'relative' },
  calendarArrow: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#efedff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  calendarArrowPressed: { opacity: 0.7 },
  calendarArrowDisabled: { backgroundColor: '#f3f1f7' },
  calendarTooltip: { position: 'absolute', top: 38, right: 0, zIndex: 5, minWidth: 94, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 7, backgroundColor: '#292541', color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  calendarGrid: { position: 'relative', zIndex: 1 },
  calendarWeekdayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  calendarWeekNumberSpacer: { width: 28, marginRight: 4 },
  weekdayLabel: { width: 44, color: '#746f88', fontSize: 11, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  calendarWeekRows: { gap: 0, position: 'relative', zIndex: 2 },
  calendarWeekRow: { flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'visible' },
  calendarWeekNumber: { width: 28, marginRight: 4, color: '#746f88', fontSize: 11, lineHeight: 18, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
  calendarCell: { width: 44, height: 44, borderRadius: 11, borderWidth: 2, borderColor: '#fff', backgroundColor: '#f0eef6', alignItems: 'center', justifyContent: 'center' },
  calendarCellOutsideMonth: { opacity: 0, pointerEvents: 'none' },
  calendarCellSelected: { borderColor: '#292541', transform: [{ scale: 0.94 }] },
  calendarCellPressed: { opacity: 0.72 },
  calendarDayNumber: { color: '#554f69', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  calendarDayNumberStrong: { color: '#fff' },
  calendarSelection: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: '#efedff' },
  calendarSelectionDate: { color: '#292541', fontSize: 14, fontWeight: '800' },
  calendarSelectionCount: { color: '#625d73', fontSize: 13, lineHeight: 18, marginTop: 2 },
  calendarLevel1: { backgroundColor: '#ddd9fa' },
  calendarLevel2: { backgroundColor: '#aaa3eb' },
  calendarLevel3: { backgroundColor: '#7e76dc' },
  calendarLevel4: { backgroundColor: '#5046b6' },
  calendarLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 15 },
  legendLabel: { color: '#8793a5', fontSize: 10 },
  legendCell: { width: 11, height: 11, borderRadius: 3, backgroundColor: '#eef2f4' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 136,
    borderRadius: ThemeRadius.MD,
    backgroundColor: ThemeColor.WHITE,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER_SOFT,
    padding: 15,
    justifyContent: 'flex-start',
    ...cardShadow,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  cardValue: {
    fontSize: 27,
    fontWeight: '800',
    color: ThemeColor.BRAND,
  },
  cardLabel: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: ThemeColor.HOME_CARD_TEXT,
  },
  cardHint: {
    marginTop: 2,
    fontSize: 12,
    color: ThemeColor.TEXT_MUTED,
  },
});
