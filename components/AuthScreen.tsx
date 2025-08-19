import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  Platform 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { AuthScreenProps, GoogleAuthResponse } from '../types';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', 
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    const googleResponse = response as GoogleAuthResponse | null;
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication) {
        handleLoginSuccess(authentication);
      }
    } else if (googleResponse?.type === 'error') {
      Alert.alert('로그인 실패', '다시 시도해주세요.');
      setIsLoading(false);
    }
  }, [response, onLogin]);

  const handleLoginSuccess = async (authentication: { accessToken: string }) => {
    try {
      onLogin({
        accessToken: authentication.accessToken,
        user: { email: 'user@example.com' }
      });
    } catch {
      Alert.alert('오류', '로그인 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    onLogin({ 
      demo: true, 
      user: { email: 'demo@example.com', name: 'Demo User' } 
    });
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="musical-notes" size={48} color="#00ACC1" />
          </View>
        </View>

        <Text style={styles.title}>이명 완화 테라피</Text>
        <Text style={styles.subtitle}>
          편안한 사운드로{'\n'}이명 증상을 완화하세요
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="infinite-outline" size={24} color="#00ACC1" />
            <Text style={styles.featureText}>끊김 없는 무한 재생</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="timer-outline" size={24} color="#00ACC1" />
            <Text style={styles.featureText}>맞춤형 타이머 설정</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="moon-outline" size={24} color="#00ACC1" />
            <Text style={styles.featureText}>백그라운드 재생 지원</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.loginButton, styles.googleButton]}
            onPress={handleGoogleLogin}
            disabled={!request || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Google로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, styles.demoButton]}
            onPress={handleDemoLogin}
          >
            <Ionicons name="person-outline" size={20} color="#B0BEC5" />
            <Text style={[styles.buttonText, styles.demoButtonText]}>
              데모 모드로 시작
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.privacyText}>
          로그인 시 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의합니다
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E',
    paddingTop: Platform.OS === 'ios' ? 0 : 25,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 172, 193, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ACC1',
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 50,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: '#00ACC1',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#5C6BC0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  demoButtonText: {
    color: '#B0BEC5',
  },
  privacyText: {
    fontSize: 12,
    color: '#5C6BC0',
    textAlign: 'center',
    lineHeight: 18,
  },
});