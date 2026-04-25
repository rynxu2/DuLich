import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { wsService } from '../services/websocket';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tracking'>;
  route: RouteProp<RootStackParamList, 'Tracking'>;
};

// Initial region (e.g. Da Nang / Hoian)
const INITIAL_REGION = {
  latitude: 16.0544,
  longitude: 108.2022,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function TrackingScreen({ navigation, route }: Props) {
  const { tourId } = route.params;
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // Live location received from websocket
  const [guideLocation, setGuideLocation] = useState({
    latitude: 16.0544,
    longitude: 108.2022,
  });

  // Example route
  const [routeCoordinates, setRouteCoordinates] = useState([
    { latitude: 16.0544, longitude: 108.2022 },
    { latitude: 16.0600, longitude: 108.2100 },
    { latitude: 16.0700, longitude: 108.2200 },
  ]);

  const slideAnim = useRef(new Animated.Value(200)).current;

  useEffect(() => {
    // Slide up bottom panel
    const anim = Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    });
    anim.start();

    // Subscribe to STOMP topic for live guide locations
    const topic = `/topic/tracking.${tourId}`;
    const subId = wsService.subscribe(topic, (msg: any) => {
      if (msg && msg.latitude && msg.longitude) {
        setGuideLocation({
          latitude: msg.latitude,
          longitude: msg.longitude,
        });

        // Optionally update polyline
        setRouteCoordinates(prev => [...prev, { latitude: msg.latitude, longitude: msg.longitude }]);

        // Animate map to new location smoothly
        mapRef.current?.animateToRegion({
          latitude: msg.latitude,
          longitude: msg.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    });

    return () => {
      anim.stop();
      wsService.unsubscribe(subId);
    };
  }, [tourId, slideAnim]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={theme.colors.primary}
          strokeWidth={4}
          lineDashPattern={[1]}
        />
        <Marker coordinate={guideLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerContainer}>
            <View style={styles.markerBadge}>
              <Icon name="bus-side" size={16} color="#fff" />
            </View>
            <View style={styles.markerArrow} />
          </View>
        </Marker>
      </MapView>

      {/* Floating Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.headerTitle}>Live Tracking</Text>
        </View>
      </View>

      {/* Bottom Info Panel */}
      <Animated.View
        style={[
          styles.bottomPanel,
          { paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.dragHandle} />
        <View style={styles.guideInfo}>
          <View style={styles.guideAvatar}>
            <Icon name="account-tie" size={32} color="#fff" />
          </View>
          <View style={styles.guideDetails}>
            <Text style={styles.guideName}>Trần Văn Hướng Dẫn</Text>
            <Text style={styles.guideRole}>Hướng dẫn viên - Xe Bus 01</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Icon name="phone" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Icon name="speedometer" size={22} color={theme.colors.textSecondary} />
            <Text style={styles.statusValue}>45 km/h</Text>
            <Text style={styles.statusLabel}>Tốc độ</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Icon name="clock-outline" size={22} color={theme.colors.textSecondary} />
            <Text style={styles.statusValue}>15 phút</Text>
            <Text style={styles.statusLabel}>Đến điểm tiếp</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  map: { ...StyleSheet.absoluteFillObject },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginLeft: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  liveIndicator: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.error, marginRight: 8,
  },
  headerTitle: { ...theme.typography.button, color: theme.colors.text },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerBadge: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  markerArrow: {
    width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.colors.primary,
    marginTop: -2,
  },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12, elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
  },
  dragHandle: {
    width: 40, height: 5, borderRadius: 3, backgroundColor: theme.colors.border,
    alignSelf: 'center', marginBottom: 20,
  },
  guideInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  guideAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.accent,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  guideDetails: { flex: 1 },
  guideName: { ...theme.typography.h3, color: theme.colors.text },
  guideRole: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row', backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md, padding: 16,
  },
  statusItem: { flex: 1, alignItems: 'center' },
  statusValue: { ...theme.typography.body, fontWeight: '700', color: theme.colors.text, marginTop: 6 },
  statusLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  statusDivider: { width: 1, backgroundColor: theme.colors.border },
});
