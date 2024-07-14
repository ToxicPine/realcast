import * as SecureStore from 'expo-secure-store';

const storeData = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error storing data", error);
  }
}

const getData = async (key) => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error retrieving data", error);
  }
}

export { storeData, getData };