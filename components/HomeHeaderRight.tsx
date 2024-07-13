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
  const fontSize = 22;
  const { setFarcasterUser } = useLogin();

  const handlePressNotAvailable = (section: string) => {
    Alert.alert(
      'Coming Soon',
      `${section} section will be available soon.`,
      [{ onPress: () => console.log('Alert closed'), text: 'Close' }]
    );
  };

  // this is 90% done but wasn't fully working so commented it out in the meantime
  // todo: add this logic directly to NeynarProvider
  // const handleLogout = () => {
  //   (async () => {
  //     try {
  //       await AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.FARCASTER_USER);
  //       setFarcasterUser(null);
  //       router.push('/');
  //     } catch (error) {
  //       console.error("Failed to remove item from AsyncStorage", error);
  //     }
  //   })();
  // }

  // todo: fix this function, it's broken
  const isSelected = (name: string) => {
    if(currentRoute === null){
      return false
    }
    else{
      if(name === 'index' && currentRoute.name === 'index'){
        return true
      }
      else if(name === 'trending' && currentRoute.name === 'channel' && currentRoute.params?.type === 'trending'){
        return true
      }
      else if(name === DEV_CHANNEL_URL && currentRoute.name === 'channel' && currentRoute.params?.parent_url === DEV_CHANNEL_URL){
        return true
      }
      else if(name === PURPLE_CHANNEL_URL && currentRoute.name === 'channel' && currentRoute.params?.parent_url === PURPLE_CHANNEL_URL){
        return true
      }
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
            <Text style={[styles.linkText, { opacity: isSelected('index') ? 1 : 0.7 }]}>Home</Text>
          </Link>
          <Link href="/(tabs)/channel?type=trending" asChild>
            <Text style={[styles.linkText, { opacity: isSelected('trending') ? 1 : 0.7 }]}>Trending</Text>
          </Link>
          <Link href={`/(tabs)/channel?type=channel&parent_url=${DEV_CHANNEL_URL}`} asChild>
            <Text style={[styles.linkText, { opacity: isSelected(DEV_CHANNEL_URL) ? 1 : 0.7 }]}>/dev</Text>
          </Link>
          <Link href={`/(tabs)/channel?type=channel&parent_url=${PURPLE_CHANNEL_URL}`} asChild>
            <Text style={[styles.linkText, { opacity: isSelected(PURPLE_CHANNEL_URL) ? 1 : 0.7 }]}>Purple</Text>
          </Link>
          <Pressable onPress={() => handlePressNotAvailable('Logout')}>
            <Text style={[styles.linkText, styles.logoutText]}>Logout</Text>
          </Pressable>
    </ScrollView>
      <Pressable onPress={() => handlePressNotAvailable('Search')}>
        <FontAwesome name="search" size={15} color="#565555" style={styles.searchIcon} />
      </Pressable>
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
    marginRight: 50,
  },
  linkText: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  logoutText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'normal',
  },
  searchIcon: {
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 15,
  },
});

export default HomeHeaderRight;