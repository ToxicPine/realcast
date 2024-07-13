import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const GuestHeaderLeft = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={24} color="black" style={{ fontWeight: '400' }} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 10,
    paddingRight: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'black',
  }
});

export default GuestHeaderLeft;
