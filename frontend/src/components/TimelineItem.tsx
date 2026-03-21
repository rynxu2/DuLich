/**
 * TimelineItem Component — Single item in itinerary timeline
 * Supports status-based styling: PLANNED, COMPLETED, SKIPPED
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
    dotColor: theme.colors.primary,
    dotBorder: theme.colors.primaryLight,
    lineColor: theme.colors.primaryLight,
    cardBorder: 'transparent',
    iconName: 'circle-outline',
    badgeColor: theme.colors.primary,
    badgeLabel: 'Sắp tới',
  },
  COMPLETED: {
    dotColor: theme.colors.success,
    dotBorder: theme.colors.success + '40',
    lineColor: theme.colors.success + '60',
    cardBorder: theme.colors.success + '30',
    iconName: 'check-circle',
    badgeColor: theme.colors.success,
    badgeLabel: 'Hoàn thành',
  },
  SKIPPED: {
    dotColor: theme.colors.textLight,
    dotBorder: theme.colors.textLight + '40',
    lineColor: theme.colors.border,
    cardBorder: 'transparent',
    iconName: 'close-circle-outline',
    badgeColor: theme.colors.textLight,
    badgeLabel: 'Bỏ qua',
  },
};

export default function TimelineItem({
  activityTitle, description, startTime, location, isLast, status = 'PLANNED',
}: Props) {
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PLANNED;
  const isCompleted = status === 'COMPLETED';
  const isSkipped = status === 'SKIPPED';

  return (
    <View style={styles.container}>
      {/* Timeline line and dot */}
      <View style={styles.timelineColumn}>
        <View style={[
          styles.dot,
          { backgroundColor: statusStyle.dotColor, borderColor: statusStyle.dotBorder },
        ]}>
          {isCompleted && (
            <Icon name="check" size={8} color="#fff" />
          )}
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: statusStyle.lineColor }]} />}
      </View>

      {/* Content */}
      <View style={[
        styles.content,
        statusStyle.cardBorder !== 'transparent' && {
          borderLeftWidth: 3,
          borderLeftColor: statusStyle.cardBorder,
        },
        isSkipped && styles.skippedContent,
      ]}>
        <View style={styles.headerRow}>
          {startTime && (
            <Text style={[styles.time, isSkipped && styles.skippedText]}>
              {startTime}
            </Text>
          )}
          {/* Status badge */}
          {status !== 'PLANNED' && (
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.badgeColor + '15' }]}>
              <Icon name={statusStyle.iconName} size={12} color={statusStyle.badgeColor} />
              <Text style={[styles.statusLabel, { color: statusStyle.badgeColor }]}>
                {statusStyle.badgeLabel}
              </Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.title,
          isCompleted && styles.completedTitle,
          isSkipped && styles.skippedText,
        ]}>
          {activityTitle}
        </Text>
        {description && (
          <Text style={[styles.description, isSkipped && styles.skippedText]}>
            {description}
          </Text>
        )}
        {location && (
          <View style={styles.locationRow}>
            <Icon name="map-marker-outline" size={12} color={isSkipped ? theme.colors.textLight : theme.colors.textSecondary} />
            <Text style={[styles.locationText, isSkipped && styles.skippedText]}>{location}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 20,
  },
  timelineColumn: {
    width: 30,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginLeft: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  skippedContent: {
    opacity: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  time: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 15,
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  skippedText: {
    color: theme.colors.textLight,
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});
