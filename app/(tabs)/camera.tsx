import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import MediaLibrary from 'expo-media-library';

export const CameraApp = () => {
  const [type, setType] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [cameraRatio, setCameraRatio] = useState(["1:1", 1]); 
  
  const cameraRef = useRef(null);

  useEffect(() => {
    prepareRatio();
  }, []);

  /* @hide if (!permission) ... */
  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }
  /* @end */

  /* @hide if (!permission.granted) ... */
  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 16,
        }}>
        <Text style={{ textAlign: 'center' }}>We Need Permission To Use The Camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }
  /* @end */
  
  async function prepareRatio() {
    if (cameraRef.current) {
      const ratios = await cameraRef.current.getSupportedRatiosAsync();
      const ratio_string = ratios[0];
      const ratioParts = ratio_string.split(':');
      const ratio = parseInt(ratioParts[1]) / parseInt(ratioParts[0]);
      setCameraRatio([ratio_string, ratio]);
      console.log(ratio_string, ratio);
    }
  };

  // Toggle Camera
  async function toggleCameraType() {
    setType(current => (current === 'back' ? 'front' : 'back'));
    await prepareRatio();
  }

  // Take Picture
  async function takePicture() {
    if (cameraRef.current) {
      let photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        try {
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          await MediaLibrary.createAlbumAsync('Wink', asset, false);
          Alert.alert('Photo saved', 'Your photo has been saved to your gallery.');
        } catch (error) {
          console.log('error saving', error);
          Alert.alert('Error', 'Failed to save photo');
        }
      }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef} 
        onCameraReady={prepareRatio}
        ratio={cameraRatio[0]}
        style={{ flex: 0, aspectRatio: cameraRatio[1] }}  
        type={type}
      >
      </CameraView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <MaterialCommunityIcons name="image" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <MaterialCommunityIcons name="camera-iris" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
          <MaterialCommunityIcons name="camera-flip" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    margin: 32,
  },
  footerContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 32,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    paddingVertical: 16,
  },
  badge: { 
    backgroundColor: '#ffffff', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8 
  },
  imageViewHeader: {
    alignSelf: 'flex-end',
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'black',
    fontSize: 16,
  },
  imageDetails: {
    color: 'white',
    fontSize: 16,
  },
});