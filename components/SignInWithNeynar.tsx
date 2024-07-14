import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Text, View } from 'react-native';
import {NeynarSigninButton, ISuccessMessage} from "@neynar/react-native-signin";
import { router } from 'expo-router';
import { useLogin } from 'farcasterkit-react-native';
import useWarpcastUser from '../hooks/useWarpcastUser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_STORAGE_KEYS } from '../constants/Farcaster';

export default function SignInWithNeynar() {
  const { farcasterUser, setFarcasterUser } = useLogin();
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [fid, setFid] = useState<number | null>(null);
  const { user: warpcastUser, loading, error } = useWarpcastUser(fid);
  const neynarApiKey = process.env.EXPO_PUBLIC_NEYNAR_API_KEY;
  const neynarClientId = process.env.EXPO_PUBLIC_NEYNAR_CLIENT_ID;

  useEffect(() => {
    if (warpcastUser && signerUuid) {
      const farcasterUser = {
        signer_uuid: signerUuid,
        fid: Number(warpcastUser.fid),
        fname: warpcastUser?.username,
        displayName: warpcastUser?.displayName,
        profile: {
          bio: warpcastUser.profile.bio.text,
          location: warpcastUser.profile.location.placeId
        },
        pfp: warpcastUser.pfp.url,
        followerCount: warpcastUser?.followerCount,
        followingCount: warpcastUser?.followingCount,
      };
      AsyncStorage.setItem(LOCAL_STORAGE_KEYS.FARCASTER_USER, JSON.stringify(farcasterUser));
      setFarcasterUser(farcasterUser);
      router.push('/(tabs)');
    }
  }, [warpcastUser]);
  
  useEffect(() => {
    if (farcasterUser) {
      router.push('/(tabs)');
    }
  }, [farcasterUser]);

  const handleSignin = async (data: ISuccessMessage) => {
    setFid(Number(data.fid));
    setSignerUuid(data.signer_uuid);
  };

  const handleError = (err: Error) => {
    console.log(err);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.neynarSignInBtn} onPress={() => handleSignin({ fid: '123', signer_uuid: 'abc' })}>
        <Text style={styles.neynarSignInText}>Sign in with Neynar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      alignItems: 'flex-start',
      marginTop: 0,
      height: 'auto',
    },
    neynarSignInBtn: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      margin: 0,
      height: 'auto',
      width: 'auto',
      backgroundColor: 'black',
      lineHeight: 16,
    },
    neynarSignInText: {
      color: 'white',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: 'medium'
    }
});
  