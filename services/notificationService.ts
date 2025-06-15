import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

    // Schedule notifications for all existing warranties
    await this.scheduleNotificationsForAllWarranties();
  }

  private async scheduleNotificationsForAllWarranties() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping warranty notification scheduling');
        return;
      }

      const response = await fetch(`${Constants.expoConfig?.extra?.SERVER_BACKEND_URL}/user-warranties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch warranties');
      }

      const { data: warranties } = await response.json();
      console.log(`Found ${warranties.length} warranties to schedule notifications for`);

      for (const warranty of warranties) {
        const expirationDate = new Date(warranty.expirationDate);
        // Only schedule if the warranty hasn't expired yet
        if (expirationDate > new Date()) {
          await this.scheduleWarrantyExpirationNotification(
            warranty._id,
            warranty.productName,
            expirationDate
          );
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications for existing warranties:', error);
    }
  }

  public async scheduleWarrantyExpirationNotification(
    warrantyId: string,
    productName: string,
    expirationDate: Date,
    testNotificationTime?: Date // Optional parameter for testing
  ) {
    if (!this.isInitialized) {
      console.log('Initializing notification service...');
      await this.initialize();
    }

    // Use test notification time if provided, otherwise calculate from expiration date
    const notificationDate = testNotificationTime || (() => {
      const date = new Date(expirationDate);
      date.setMonth(date.getMonth() - 1);
      
      // Set the time to a specific time
      date.setHours(15, 0, 0, 0);
      
      console.log('Calculated notification date:', date.toLocaleString());
      return date;
    })();

    // Don't schedule if the notification date is in the past
    if (notificationDate <= new Date()) {
      console.log('Notification date is in the past, skipping scheduling');
      console.log('Current time:', new Date().toLocaleString());
      console.log('Notification time:', notificationDate.toLocaleString());
      return;
    }

    // Cancel any existing notification for this warranty
    await this.cancelWarrantyNotification(warrantyId);

    try {
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

      console.log(`Successfully scheduled notification for ${productName} at ${notificationDate.toLocaleString()}`);
      
      // Verify the notification was scheduled
      const scheduledNotifications = await this.getAllScheduledNotifications();
      console.log('All scheduled notifications:', scheduledNotifications);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
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