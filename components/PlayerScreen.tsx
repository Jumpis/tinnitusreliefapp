import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  Platform,
  AppState,
  AppStateStatus,
  NativeEventSubscription
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { PlayerScreenProps } from '../types';
import { NotificationService, NotificationAction } from '../services/NotificationService';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';

export default function PlayerScreen({ onLogout }: PlayerScreenProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [durationMinutes, setDuration] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const timeLeftRef = useRef<number>(30 * 60);
  const isPlayingRef = useRef<boolean>(false);
  const durationRef = useRef<number>(30);
  const notificationSubscription = useRef<Notifications.EventSubscription | null>(null);

  const startTimer = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime: number) => {
        console.log('Timer tick:', prevTime);
        if (prevTime <= 1) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, []);

  const handleStop = useCallback(async (): Promise<void> => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeLeft(durationMinutes * 60);
      deactivateKeepAwake();
      NotificationService.hideNotification();
      NotificationService.stopBackgroundUpdates();
    }
  }, [sound, durationMinutes]);

  const stopAndReset = useCallback(async (): Promise<void> => {
    if (sound) {
      await sound.stopAsync();
    }
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    deactivateKeepAwake();
    NotificationService.hideNotification();
    NotificationService.stopBackgroundUpdates();
    setTimeout(() => {
      setTimeLeft(durationMinutes * 60);
    }, 100);
  }, [sound, durationMinutes]);

  const soundRef = useRef<Audio.Sound | null>(null);
  
  const handleNotificationAction = useCallback(async (action: NotificationAction) => {
    const currentSound = soundRef.current;
    if (!currentSound) return;
    
    switch (action) {
      case 'play':
        if (!isPlayingRef.current) {
          await currentSound.playAsync();
          setIsPlaying(true);
          startTimer();
          await activateKeepAwakeAsync();
        }
        break;
      case 'pause':
        if (isPlayingRef.current) {
          await currentSound.pauseAsync();
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          deactivateKeepAwake();
        }
        break;
      case 'stop':
        await handleStop();
        break;
    }
  }, [startTimer, handleStop]);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        notificationSubscription.current = await NotificationService.initialize();
        
        NotificationService.setActionCallback(handleNotificationAction);
        
        await loadSound();
      } catch {
        Alert.alert("오디오 설정 오류", "오디오 설정 중 문제가 발생했습니다.");
        setIsLoading(false);
      }
    })();

    const subscription: NativeEventSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      NotificationService.hideNotification();
      NotificationService.stopBackgroundUpdates();
      subscription.remove();
      if (notificationSubscription.current) {
        notificationSubscription.current.remove();
      }
    };
  }, []);

  const loadSound = async (): Promise<void> => {
    try {
      console.log('Loading sound...');
      const { sound: loadedSound } = await Audio.Sound.createAsync(
        require('../assets/sounds/white_noise.mp3'),
        {
          isLooping: true,
          shouldPlay: false,
          volume: 1.0,
        }
      );
      console.log('Sound loaded successfully');
      setSound(loadedSound);
      soundRef.current = loadedSound;
      setIsLoading(false);
    } catch (error) {
      console.error('Sound loading error:', error);
      Alert.alert("음원 로드 실패", "음원 파일을 확인해주세요.");
      setIsLoading(false);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      if (isPlayingRef.current || timeLeftRef.current < (durationRef.current * 60)) {
        NotificationService.showPlayingNotification(
          timeLeftRef.current, 
          isPlayingRef.current,
          durationRef.current
        );
        NotificationService.startBackgroundUpdates(
          () => timeLeftRef.current,
          () => isPlayingRef.current,
          () => durationRef.current
        );
      }
    } else if (nextAppState === 'active') {
      NotificationService.hideNotification();
      NotificationService.stopBackgroundUpdates();
    }
    appStateRef.current = nextAppState;
  };

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    if (timeLeft === 0 && isPlaying) {
      stopAndReset();
    }
  }, [timeLeft, isPlaying, stopAndReset]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    durationRef.current = durationMinutes;
  }, [durationMinutes]);

  const togglePlayback = useCallback(async (): Promise<void> => {
    if (!sound) {
      console.log('Sound not loaded');
      return;
    }

    try {
      if (isPlaying) {
        console.log('Pausing playback');
        await sound.pauseAsync();
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        deactivateKeepAwake();
        
        if (appStateRef.current.match(/inactive|background/)) {
          NotificationService.showPlayingNotification(timeLeft, false, durationMinutes);
        }
      } else {
        console.log('Starting playback');
        if (timeLeft <= 0) {
          setTimeLeft(durationMinutes * 60);
        }
        
        const status = await sound.getStatusAsync();
        console.log('Sound status before play:', status);
        
        await sound.playAsync();
        setIsPlaying(true);
        startTimer();
        await activateKeepAwakeAsync();
        
        if (appStateRef.current.match(/inactive|background/)) {
          NotificationService.showPlayingNotification(timeLeft, true, durationMinutes);
          NotificationService.startBackgroundUpdates(
            () => timeLeftRef.current,
            () => isPlayingRef.current,
            () => durationRef.current
          );
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('재생 오류', '오디오 재생 중 문제가 발생했습니다.');
    }
  }, [sound, isPlaying, timeLeft, durationMinutes, startTimer]);


  const handleDurationChange = (value: number): void => {
    if (isPlaying) return;
    setDuration(value);
    setTimeLeft(value * 60);
  };


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#00ACC1" />
        <Text style={styles.loadingText}>음원을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>이명 완화 테라피</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={24} color="#B0BEC5" />
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Text style={styles.timeLeft}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerLabel}>남은 시간</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.durationText}>재생 시간: {Math.round(durationMinutes)}분</Text>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={120}
          step={5}
          value={durationMinutes}
          onValueChange={handleDurationChange}
          minimumTrackTintColor="#00ACC1"
          maximumTrackTintColor="#5C6BC0"
          thumbTintColor="#00ACC1"
          disabled={isPlaying}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>5분</Text>
          <Text style={styles.sliderLabel}>120분</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={togglePlayback} 
          style={[styles.playButton, !sound && styles.disabledButton]} 
          disabled={!sound}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleStop()} 
          style={[styles.stopButton, (!sound || !isPlaying) && styles.disabledButton]} 
          disabled={!sound || !isPlaying}
        >
          <Ionicons name="stop" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>앱이 백그라운드에서도 계속 재생됩니다</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : 25,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoutButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  timerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    borderColor: '#00ACC1',
    backgroundColor: 'rgba(0, 172, 193, 0.1)',
  },
  timeLeft: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 16,
    color: '#B0BEC5',
    marginTop: 8,
  },
  controls: {
    alignItems: 'center',
    width: '85%',
    marginBottom: 40,
  },
  durationText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  playButton: {
    backgroundColor: '#00ACC1',
    padding: 25,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopButton: {
    backgroundColor: '#5C6BC0',
    padding: 18,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  info: {
    position: 'absolute',
    bottom: 40,
  },
  infoText: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  loadingText: {
    color: '#B0BEC5',
    fontSize: 16,
    marginTop: 20,
  },
});