import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import { API_URL } from '../constants/Farcaster';
import { Link } from 'expo-router';
import { useLogin } from 'farcasterkit-react-native';

const HomeHeaderLeft = () => {
  const { farcasterUser } = useLogin();

  return (
    <View style={styles.container}>
      {farcasterUser && farcasterUser.pfp && 
      <Link href={`/user?fname=${farcasterUser?.fname}`}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: farcasterUser.pfp }} style={styles.image} />
        </View>
      </Link>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 15,
    marginVertical: 'auto',
  },
  imageContainer: {
    backgroundColor: 'black',
    borderRadius: 4,
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
    borderRadius: 4,
  }
});

export default HomeHeaderLeft;
