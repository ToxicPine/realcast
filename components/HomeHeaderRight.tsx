import { FontAwesome } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Link, useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Text, ScrollView, Alert, TouchableOpacity, View, Pressable, StyleSheet } from 'react-native';
import { LOCAL_STORAGE_KEYS } from '../constants/Farcaster';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogin } from 'farcasterkit-react-native';

const DEV_CHANNEL_URL = 'chain://eip155:1/erc721:0x7dd4e31f1530ac682c8ea4d8016e95773e08d8b0';
const PURPLE_CHANNEL_URL = 'chain://eip155:1/erc721:0xa45662638e9f3bbb7a6fecb4b17853b7ba0f3a60';

const HomeHeaderRight = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const currentRoute = useRoute();
  const { setFarcasterUser } = useLogin();

  const handleLogout = () => {
     (async () => {
      try {
        await AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.FARCASTER_USER);
        setFarcasterUser(null);
        router.push('/');
        Alert.alert(
          'Logged Out',
          `You have been logged out.`,
          [{ onPress: () => console.log('Alert closed'), text: 'Close' }]
        );
      } catch (error) {
        console.error("Failed to remove item from AsyncStorage", error);
      }
    })();
  }

  const handleSearch = () => {
    Alert.alert(
      'Coming Soon',
      `Search will be available soon.`,
      [{ onPress: () => console.log('Alert closed'), text: 'Close' }]
    );
  }
  const isSelected = (name: string) => {
    if (!currentRoute) {
      return false;
    }
    if (name === 'index' && currentRoute.name === 'index') {
      return true;
    }
    if (name === 'trending' && currentRoute.name === 'channel' && currentRoute.params?.type === 'trending') {
      return true;
    }
    if (name === DEV_CHANNEL_URL && currentRoute.name === 'channel' && currentRoute.params?.parent_url === DEV_CHANNEL_URL) {
      return true;
    }
    if (name === PURPLE_CHANNEL_URL && currentRoute.name === 'channel' && currentRoute.params?.parent_url === PURPLE_CHANNEL_URL) {
      return true;
    }
    return false;
  }

  const handleBackToHome = () => {
    navigation.navigate('home', {key: ''})
  }

  return (
    <View style={styles.headerContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContainer}>
          <Link href="/(tabs)" asChild>
            <Text style={[styles.linkText, isSelected('index') ? styles.selectedText : styles.unselectedText]}>Home</Text>
          </Link>
          <Link href="/(tabs)/channel?type=trending" asChild>
            <Text style={[styles.linkText, isSelected('trending') ? styles.selectedText : styles.unselectedText]}>Trending</Text>
          </Link>
          <Link href={`/(tabs)/channel?type=channel&parent_url=${DEV_CHANNEL_URL}`} asChild>
            <Text style={[styles.linkText, isSelected(DEV_CHANNEL_URL) ? styles.selectedText : styles.unselectedText]}>/dev</Text>
          </Link>
          <Link href={`/(tabs)/channel?type=channel&parent_url=${PURPLE_CHANNEL_URL}`} asChild>
            <Text style={[styles.linkText, isSelected(PURPLE_CHANNEL_URL) ? styles.selectedText : styles.unselectedText]}>Purple</Text>
          </Link>
          <Pressable onPress={() => handleLogout()}>
            <Text style={[styles.linkText, styles.logoutText]}>Logout</Text>
          </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
  },
  scrollViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginRight: 48,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutText: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'normal',
  },
  searchIcon: {
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 15,
  },
  selectedText: {
    color: 'blue',
  },
  unselectedText: {
    color: 'gray',
  },
});

export default HomeHeaderRight;