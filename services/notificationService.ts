import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    this.isInitialized = true;
  }

  public async scheduleWarrantyExpirationNotification(
    warrantyId: string,
    productName: string,
    expirationDate: Date
  ) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Calculate notification date (1 month before expiration)
    const notificationDate = new Date(expirationDate);
    notificationDate.setMonth(notificationDate.getMonth() - 1);

    // Don't schedule if the notification date is in the past
    if (notificationDate <= new Date()) {
      return;
    }

    // Cancel any existing notification for this warranty
    await this.cancelWarrantyNotification(warrantyId);

    // Schedule new notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Warranty Expiring Soon',
        body: `Your warranty for ${productName} will expire in one month.`,
        data: { warrantyId },
      },
      trigger: {
        type: 'date',
        date: notificationDate,
      },
      identifier: `warranty-${warrantyId}`,
    });
  }

  public async cancelWarrantyNotification(warrantyId: string) {
    await Notifications.cancelScheduledNotificationAsync(`warranty-${warrantyId}`);
  }

  public async cancelAllWarrantyNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  public async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  public async scheduleTestNotification() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Schedule a notification for 10 seconds from now
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification to verify the notification system is working.',
      },
      trigger: {
        type: 'timeInterval',
        seconds: 10,
      },
      identifier: 'test-notification',
    });
  }
}

export default NotificationService.getInstance(); 