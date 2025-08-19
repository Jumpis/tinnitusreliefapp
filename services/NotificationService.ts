import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

export class NotificationService {
  private static notificationId: string | null = null;
  private static updateInterval: NodeJS.Timeout | null = null;

  static async initialize() {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('tinnitus-player', {
        name: '이명 완화 플레이어',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        sound: undefined,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('알림 권한이 거부되었습니다');
    }
  }

  static async showPlayingNotification(timeLeft: number, isPlaying: boolean) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const notificationContent: Notifications.NotificationContentInput = {
      title: '이명 완화 테라피',
      body: isPlaying ? `재생 중 - 남은 시간: ${timeString}` : '일시정지됨',
      data: { timeLeft, isPlaying },
      sticky: true,
    };

    if (Platform.OS === 'android') {
      notificationContent.categoryIdentifier = 'media';
      notificationContent.priority = 'low';
    }

    if (this.notificationId) {
      await Notifications.dismissNotificationAsync(this.notificationId);
    }

    this.notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });
  }

  static async hideNotification() {
    if (this.notificationId) {
      await Notifications.dismissNotificationAsync(this.notificationId);
      this.notificationId = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  static startBackgroundUpdates(
    getTimeLeft: () => number,
    getIsPlaying: () => boolean
  ) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      const timeLeft = getTimeLeft();
      const isPlaying = getIsPlaying();
      
      if (isPlaying && timeLeft > 0) {
        await this.showPlayingNotification(timeLeft, isPlaying);
      } else if (timeLeft <= 0) {
        await this.hideNotification();
      }
    }, 1000);
  }

  static stopBackgroundUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  return Notifications.BackgroundFetchResult.NewData;
});