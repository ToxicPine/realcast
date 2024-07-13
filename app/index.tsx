import React, { useEffect } from 'react';
import { StyleSheet, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import SignInWithNeynar from '../components/SignInWithNeynar';
import { Text, View } from '../components/Themed';
import ConnectAsGuest from '../components/ConnectAsGuest';
import { useLogin } from 'farcasterkit-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const { farcasterUser } = useLogin();
  const router = useRouter();
  useEffect(() => {
    if(farcasterUser){
      router.push('/(tabs)');
    }
  }, [farcasterUser]);

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Realcaster</Text>
          <Text style={styles.subtitle}>Farcaster, With Provably Real Content</Text>
        </View>
        <View style={styles.buttonContainer}>
          <ConnectAsGuest />
          <SignInWithNeynar />
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: 'white',
    color: 'black',
    justifyContent: 'space-between',
    padding: 40,
    paddingBottom: 20
  },
  textContainer: {
    marginTop: 64,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 36,
    fontWeight: '500',
    color: 'black',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'black'
  },
  buttonContainer: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 32,
    gap: 16,
    width: '100%'
  },
  homepageHeader: {
    width: '100%', 
    height: undefined,
    aspectRatio: 2150 / 200,
  },
});