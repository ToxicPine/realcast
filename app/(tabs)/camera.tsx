import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import { EventEmitter, Subscription } from "expo-modules-core";
import LibRealModule from '../LibRealModule';
import { API_URL } from '../../constants/Farcaster';

const FILE_URL_PREFIX = 'https://192.168.129.214:8000/download/';
const FILE_UPLOAD_URL = 'http://192.168.129.214:8000/upload/';

function CameraApp() {
  const [facing, setFacing] = useState('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [cameraRatio, setCameraRatio] = useState(["1:1", 1]); 
  const [uploadStatus, setUploadStatus] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  const { type: routeType } = route.params;

  const handleBackPress = () => {
    navigation.navigate('index');
  };

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} style={{ paddingLeft: 20, paddingRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="arrow-back" size={24} color="black" style={{ fontWeight: '400' }} />
        </TouchableOpacity>
      ),
      title: 'Attested Camera',
      headerTitleStyle: {
        color: 'black',
      },
    });
  }, [navigation]);

  const cameraRef = useRef(null);

  const generateRandomFilename = () => {
    return Math.random().toString(36).substring(2, 8) + '.jpg';
  };

  const uploadFile = async (photo) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg', // or photo.type
        name: generateRandomFilename(), // generate random filename
      });

      const response = await fetch(FILE_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`File uploaded successfully: ${result.filename}`);
        onUploadSuccess(result?.filename);
        navigation.navigate('index');
      } else {
        setUploadStatus('File upload failed');
        Alert.alert('Error', 'File upload failed');
      }
    } catch (err) {
      setUploadStatus(`Unknown error: ${err.message}`);
      Alert.alert('Error', `Unknown error: ${err.message}`);
    }
  };

  useEffect(() => {
    prepareRatio();
  }, []);

  if (!cameraPermission || !mediaPermission) {
    // Permissions are still loading
    return <View />;
  }

  if (!cameraPermission.granted || !mediaPermission.granted) {
    // Permissions are not granted yet
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 16,
      }}>
        <Text style={{ textAlign: 'center' }}>We Need Permission To Use The Camera and Media Library</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 8 }}>
          {!cameraPermission.granted && (
            <Button onPress={requestCameraPermission} title="Grant Camera Permission" />
          )}
          {!mediaPermission.granted && (
            <Button onPress={requestMediaPermission} title="Grant Media Permission" />
          )}
        </View>
      </View>
    );
  }

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
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
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

          // Upload the photo after saving it
          await uploadFile(photo);
        } catch (error) {
          console.log('error saving', error);
          Alert.alert('Error', 'Failed to save photo');
        }
      }
    }
  }

  async function onUploadSuccess(filename: string) {
    // Handle successful upload
    console.log('Upload was successful');

    // Logic for posting to farcaster
    const DEFAULT_PLACEHOLDER = 'Type to Cast...';
    const text = `Attested Image: ${FILE_URL_PREFIX}${filename}`;
    const farcasterUser = { signer_uuid: '7efc93ab-d667-4f45-89c5-ad2858af5ea2' }; // Replace with actual farcasterUser object

    // Generate an idempotency key
    const generateIdem = () => {
      return Math.random().toString(36).substring(2, 18);
    };

    try {
      const respBody = {
        parent: '',
        signer_uuid: farcasterUser.signer_uuid,
        text: text,
        channel_id: 'farcaster',
        idem: generateIdem(),
        parent_author_fid: 'arbion'
      };
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          api_key: process.env.EXPO_PUBLIC_NEYNAR_API_KEY || '', 
          'content-type': 'application/json'
        },
        body: JSON.stringify(respBody)
      };
      const response = await fetch('https://api.neynar.com/v2/farcaster/cast', options);

      const result = await response.json();
      if (response.ok) {
        console.log('Cast posted successfully!');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Could not send the cast', error);
      Alert.alert('Error', 'Could not send the cast');
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        onCameraReady={prepareRatio}
        ratio={cameraRatio[0]}
        style={{ flex: 0, aspectRatio: cameraRatio[1] }}
        facing={facing}
      >
      </CameraView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <MaterialCommunityIcons name="camera-iris" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <MaterialCommunityIcons name="camera-flip" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {uploadStatus ? <Text>{uploadStatus}</Text> : null}
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

export default CameraApp;