/**
 * Premium TimelineItem Component — Sleek shadow card with seamless timeline dot
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';

interface Props {
  activityTitle: string;
  description?: string;
  startTime?: string;
  location?: string;
  isLast?: boolean;
  status?: 'PLANNED' | 'COMPLETED' | 'SKIPPED';
}

const STATUS_STYLES = {
  PLANNED: {
    dotColor: '#fff',
    dotBorder: theme.colors.primary,
    lineColor: theme.colors.primary + '40',
    iconName: 'clock-outline',
    badgeColor: theme.colors.primary,
    badgeBg: theme.colors.primary + '15',
    badgeLabel: 'Sắp tới',
  },
  COMPLETED: {
    dotColor: theme.colors.success,
    dotBorder: theme.colors.success + '40',
    lineColor: theme.colors.success + '80',
    iconName: 'check-circle',
    badgeColor: theme.colors.success,
    badgeBg: theme.colors.success + '15',
    badgeLabel: 'Hoàn thành',
  },
  SKIPPED: {
    dotColor: '#F3F4F6',
    dotBorder: '#D1D5DB',
    lineColor: '#E5E7EB',
    iconName: 'cancel',
    badgeColor: theme.colors.textLight,
    badgeBg: '#F3F4F6',
    badgeLabel: 'Bỏ qua',
  },
};

export default function TimelineItem({
  activityTitle, description, startTime, location, isLast, status = 'PLANNED',
}: Props) {
  const currentStyle = STATUS_STYLES[status] || STATUS_STYLES.PLANNED;
  const isCompleted = status === 'COMPLETED';
  const isSkipped = status === 'SKIPPED';

  return (
    <View style={styles.container}>
      {/* Timeline Stroke */}
      <View style={styles.timelineColumn}>
        <View style={[styles.dot, { backgroundColor: currentStyle.dotColor, borderColor: currentStyle.dotBorder }]}>
          {isCompleted && <Icon name="check" size={10} color="#fff" />}
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: currentStyle.lineColor }]} />}
      </View>

      {/* Content Card */}
      <View style={[styles.card, isSkipped && styles.cardSkipped]}>
        <View style={styles.headerRow}>
          {startTime && (
            <View style={styles.timeTag}>
              <Icon name="clock-time-four-outline" size={14} color={isSkipped ? theme.colors.textLight : theme.colors.primary} />
              <Text style={[styles.timeText, isSkipped && { color: theme.colors.textLight }]}>{startTime}</Text>
            </View>
          )}
          {status !== 'PLANNED' && (
            <View style={[styles.statusBadge, { backgroundColor: currentStyle.badgeBg }]}>
              <Icon name={currentStyle.iconName} size={12} color={currentStyle.badgeColor} />
              <Text style={[styles.statusLabel, { color: currentStyle.badgeColor }]}>{currentStyle.badgeLabel}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, isCompleted && styles.titleCompleted, isSkipped && styles.titleSkipped]}>
          {activityTitle}
        </Text>
        
        {description && <Text style={[styles.desc, isSkipped && styles.titleSkipped]}>{description}</Text>}
        
        {location && (
          <View style={styles.locationRow}>
            <Icon name="map-marker-outline" size={14} color={isSkipped ? theme.colors.textLight : theme.colors.textSecondary} />
            <Text style={[styles.locationText, isSkipped && styles.titleSkipped]}>{location}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingBottom: 20 },
  timelineColumn: { width: 32, alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, marginTop: 4, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  line: { position: 'absolute', top: 20, bottom: -24, width: 2, zIndex: 1 },
  
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  cardSkipped: { opacity: 0.6, backgroundColor: '#F9FAFB' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  timeText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusLabel: { fontSize: 11, fontWeight: '800' },
  
  title: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  titleCompleted: { textDecorationLine: 'line-through', color: theme.colors.textSecondary },
  titleSkipped: { color: theme.colors.textLight },
  
  desc: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
});
