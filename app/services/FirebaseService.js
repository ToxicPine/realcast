import firebase from '@react-native-firebase/app';
import '@react-native-firebase/app-check';

async function getAppCheckToken() {
  try {
    const credentials = {
      clientId: process.env.FIREBASE_CLIENT_ID,
      appId: process.env.FIREBASE_APP_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
    
    const config = {
      name: process.env.FIREBASE_APP_NAME,
    };
    let app;
    if (firebase.apps && firebase.apps.length > 0) {
      app = firebase.apps.find(app => app.name === config.name);
    } else {
      app = await firebase.initializeApp(credentials, config);r
    }
    let rnfbProvider = firebase.appCheck(app).newReactNativeFirebaseAppCheckProvider();
    rnfbProvider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
        debugToken: process.env.FIREBASE_DEBUG_TOKEN,
      },
    });
    firebase.appCheck(app).initializeAppCheck({ provider: rnfbProvider, isTokenAutoRefreshEnabled: true });
    const tokenResult = await firebase.appCheck(app).getToken();
    console.log("Token Result:", tokenResult);
    return tokenResult.token;
  } catch (error) {
    console.error("Failed to get App Check token", error);
    return null;
  }
}

async function fetchDataWithAppCheck() {
  const token = await getAppCheckToken();
  if (!token) {
    console.error("No App Check token available");
    return;
  }

  try {
    const response = await fetch(`${process.env.API_URL}/playintegrity/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'credential_request': '0x' + [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
        })
      });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data with App Check token:", error);
  }
}

export { fetchDataWithAppCheck };