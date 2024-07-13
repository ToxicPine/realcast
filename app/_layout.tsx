import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { NeynarProvider } from 'farcasterkit-react-native';
import { useEffect } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import GuestHeaderLeft from '../components/GuestHeaderLeft';
import { CameraApp } from '../app/(tabs)/camera';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const neynarApiKey = process.env.EXPO_PUBLIC_NEYNAR_API_KEY;
  const fckitApiUrl = process.env.EXPO_PUBLIC_API_URL;

  return (
    <NeynarProvider apiKey={neynarApiKey as string} fcKitApiUrl={fckitApiUrl as string}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="guest" 
          options={{ 
            headerShown: true, 
            title: 'Feed', 
            headerTitleStyle: styles.headerTitleStyle, 
            headerLeft: GuestHeaderLeft, 
            headerStyle: styles.headerStyle 
          }}
        />
        <Stack.Screen 
          name="Camera" 
          options={{ 
            headerShown: true, 
            title: 'Camera' 
          }} 
        />
      </Stack>
    </ThemeProvider>
    </NeynarProvider>
  );
}

const styles = StyleSheet.create({
  headerTitleStyle: {
    color: 'black',
  },
  headerStyle: {
    backgroundColor: 'white',
  },
});