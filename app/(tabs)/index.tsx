import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import AuthScreen from '@/components/AuthScreen';
import PlayerScreen from '@/components/PlayerScreen';
import { AuthenticationResponse } from '@/types';

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLogin = (authData: AuthenticationResponse) => {
    console.log('Login successful:', authData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('Logged out');
    setIsAuthenticated(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1A237E"
        translucent={false}
      />
      {isAuthenticated ? (
        <PlayerScreen onLogout={handleLogout} />
      ) : (
        <AuthScreen onLogin={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});