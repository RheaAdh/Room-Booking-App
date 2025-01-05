import { Platform } from 'react-native';

export const BASE_URL =
  Platform.OS === 'ios' || Platform.OS === 'android'
    ? 'http://192.168.1.12:8080/api/v1' // Mobile
    : 'http://localhost:8080/api/v1'; // Web
