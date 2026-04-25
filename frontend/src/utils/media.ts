import { Platform } from 'react-native';

export const getMediaUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (__DEV__ && Platform.OS === 'android') {
    // Android emulator alias for localhost is 10.0.2.2
    // Replace internal docker DNS "minio" or "localhost" with emulator alias
    return url.replace('http://minio:9000', 'http://10.0.2.2:9000')
              .replace('http://localhost:9000', 'http://10.0.2.2:9000');
  }
  return url;
};
