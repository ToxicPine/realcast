import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MediaLibrary from 'expo-media-library';

function CameraApp() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [cameraRatio, setCameraRatio] = useState(["1:1", 1]); 

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

  useEffect(() => {
    prepareRatio();
  }, []);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

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