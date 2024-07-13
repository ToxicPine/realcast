import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import ComposeCast from '../../components/ComposeCast';
import { Link, useNavigation } from 'expo-router';
import { Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import { useLogin } from 'farcasterkit-react-native';


const UserScreen = () => {
  const { farcasterUser } = useLogin();
  const route = useRoute();
  const fname = route.params?.fname as string;
  const navigation = useNavigation();
  const handleBackPress = () => {
    navigation.navigate('index');
  };

  // TODO: re-implement for other user-pages to fetch their data
  // const [warpcastUser, setWarpcastUser] = useState<WarpcastUserProfile | null>(null);
  // useEffect(() => {
  //   (async function fetchWarpcastUser() {
  //     if(farcasterUser !== null) {
  //       const response = await fetch(`https://client.warpcast.com/v2/user?fid=${farcasterUser.fid}`);
  //       const data = await response.json() as WarpcastUserProfileResponse;
  //       const user = data.result.user;
  //       setWarpcastUser(user);
  //     }
  //   })();
  // }, [farcasterUser]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} style={{ paddingLeft: 20, paddingRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="arrow-back" size={24} color="black" style={{ fontWeight: '400' }} />
        </TouchableOpacity>
      ),
      title: 'User Details',
      headerTitleStyle: {
        color: 'black',
      },
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {farcasterUser !== null && 
      <>
      <View style={styles.detailsContainer}>
        <Image source={{ uri: farcasterUser.pfp }} style={styles.pfpImage} alt={`PFP for @${farcasterUser.fname}`} width={48} height={48} />
        <View style={styles.detailsNameContainer}>
          <Text style={styles.detailsName}>{farcasterUser.displayName}</Text>
          <Text style={styles.detailsUsername}>@{farcasterUser.fname}</Text>
          <Text style={styles.detailsBio}>{farcasterUser.profile.bio}</Text>
        </View>
      </View>
      </>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'space-between',
  },
  pfpImage: {
    width: 50,
    height: 50,
    borderRadius: 36,
  },
  detailsContainer: {
    padding: 16,
    flex: 1,
    flexDirection: 'row'
  },
  detailsNameContainer: {
    flexDirection: 'column',
    paddingLeft: 16,
    paddingTop: 0,
    gap: 2
  },
  detailsName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
});

export default UserScreen;