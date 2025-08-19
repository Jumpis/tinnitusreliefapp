import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

export type NotificationAction = 'play' | 'pause' | 'stop';

export class NotificationService {
  private static notificationId: string | null = null;
  private static updateInterval: NodeJS.Timeout | null = null;
  private static actionCallback: ((action: NotificationAction) => void) | null = null;

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
        bypassDnd: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: false,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('알림 권한이 거부되었습니다');
    }

    // 알림 액션 응답 리스너 설정
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const action = response.notification.request.content.data?.action as NotificationAction;
      if (action && this.actionCallback) {
        this.actionCallback(action);
      }
    });

    return subscription;
  }

  static setActionCallback(callback: (action: NotificationAction) => void) {
    this.actionCallback = callback;
  }

  static async showPlayingNotification(
    timeLeft: number, 
    isPlaying: boolean,
    durationMinutes: number
  ) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    const totalSeconds = durationMinutes * 60;
    const progress = Math.max(0, Math.min(1, (totalSeconds - timeLeft) / totalSeconds));

    const notificationContent: Notifications.NotificationContentInput = {
      title: '이명 완화 테라피',
      body: `${isPlaying ? '재생 중' : '일시정지'} - 남은 시간: ${timeString}`,
      subtitle: `전체 ${durationMinutes}분 중 ${Math.round(progress * 100)}% 진행`,
      data: { 
        timeLeft, 
        isPlaying,
        durationMinutes,
        progress 
      },
      sticky: true,
      autoDismiss: false,
    };

    if (Platform.OS === 'android') {
      notificationContent.categoryIdentifier = 'media';
      notificationContent.priority = 'low';
      notificationContent.vibrate = [];
      
      // Android 미디어 스타일 알림 설정
      const androidConfig: any = {
        ...notificationContent,
        ongoing: true,
        autoCancel: false,
        smallIcon: 'notification_icon',
        largeIcon: 'notification_icon',
        color: '#00ACC1',
        chronometerCountDown: false,
        showWhen: true,
        when: Date.now(),
        usesChronometer: false,
        progress: {
          max: totalSeconds,
          current: totalSeconds - timeLeft,
          indeterminate: false,
        },
        actions: isPlaying ? [
          {
            title: '⏸ 일시정지',
            pressAction: {
              id: 'pause',
              launchActivity: 'default',
            },
          },
          {
            title: '⏹ 정지',
            pressAction: {
              id: 'stop',
              launchActivity: 'default',
            },
          },
        ] : [
          {
            title: '▶️ 재생',
            pressAction: {
              id: 'play',
              launchActivity: 'default',
            },
          },
          {
            title: '⏹ 정지',
            pressAction: {
              id: 'stop',
              launchActivity: 'default',
            },
          },
        ],
      };
      
      Object.assign(notificationContent, androidConfig);
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
    getIsPlaying: () => boolean,
    getDurationMinutes: () => number
  ) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // 즉시 알림 표시
    const timeLeft = getTimeLeft();
    const isPlaying = getIsPlaying();
    const durationMinutes = getDurationMinutes();
    
    if (isPlaying && timeLeft > 0) {
      this.showPlayingNotification(timeLeft, isPlaying, durationMinutes);
    }

    // 1초마다 업데이트
    this.updateInterval = setInterval(async () => {
      const currentTimeLeft = getTimeLeft();
      const currentIsPlaying = getIsPlaying();
      const currentDuration = getDurationMinutes();
      
      if (currentTimeLeft > 0) {
        await this.showPlayingNotification(
          currentTimeLeft, 
          currentIsPlaying, 
          currentDuration
        );
      } else {
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

// 백그라운드 태스크 정의
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  return Notifications.BackgroundFetchResult.NewData;
});