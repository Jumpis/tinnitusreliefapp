# 이명 완화 테라피 앱 (Tinnitus Relief App)

이명 증상 완화를 위한 백색소음 플레이어 앱입니다. React Native와 Expo를 사용하여 개발되었습니다.

## 주요 기능

- 🎵 백색소음 무한 루프 재생
- ⏰ 맞춤형 타이머 설정 (5분 ~ 120분)
- 🌙 백그라운드 재생 지원
- 📱 알림바 미니 플레이어 (재생 시간 표시)
- 🔐 Google 로그인 지원
- 📲 iOS/Android 크로스 플랫폼 지원

## 기술 스택

- **프레임워크**: React Native + Expo
- **언어**: TypeScript
- **오디오**: expo-av
- **알림**: expo-notifications
- **인증**: expo-auth-session (Google OAuth)
- **UI 컴포넌트**: @expo/vector-icons, @react-native-community/slider

## 설치 및 실행

### 필수 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Expo CLI
- iOS 시뮬레이터 (Mac) 또는 Android 에뮬레이터

### 설치
```bash
# 저장소 클론
git clone https://github.com/yourusername/TinnitusReliefApp.git
cd TinnitusReliefApp

# 의존성 설치
npm install
```

### 실행
```bash
# Expo 개발 서버 시작
npm start

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android
```

## 프로젝트 구조

```
TinnitusReliefApp/
├── app/                    # 앱 화면 및 라우팅
│   └── (tabs)/
│       └── index.tsx      # 메인 화면
├── components/            # React 컴포넌트
│   ├── AuthScreen.tsx    # 로그인 화면
│   └── PlayerScreen.tsx  # 플레이어 화면
├── services/             # 서비스 모듈
│   └── NotificationService.ts  # 알림 관리
├── types/                # TypeScript 타입 정의
│   └── index.ts
├── assets/              # 리소스 파일
│   └── sounds/
│       └── white_noise.mp3  # 백색소음 파일
└── app.json            # Expo 설정

```

## 설정

### Google OAuth 설정
`components/AuthScreen.tsx` 파일에서 Google OAuth 클라이언트 ID를 설정해야 합니다:

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
});
```

## 빌드

### iOS 빌드
```bash
expo build:ios
```

### Android 빌드
```bash
expo build:android
```

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트를 환영합니다!