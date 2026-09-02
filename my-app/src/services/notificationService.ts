import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';

export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tickets', {
      name: 'Arıza bildirimleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  const isGranted = permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!isGranted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted && requested.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUserId = sessionData.session?.user.id;
  if (!sessionUserId || sessionUserId !== userId) return;

  const { error } = await supabase.rpc('register_push_token', {
    token_value: token,
    platform_value: Platform.OS,
  });
  if (error) throw error;
}