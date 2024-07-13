import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '../constants/Farcaster';
import { useLogin } from 'farcasterkit-react-native';
// import { useLogin } from '../providers/NeynarProvider';

const ComposeCast = ({ hash }: { hash?: string }) => {
  const DEFAULT_PLACEHOLDER = 'Type to Cast...';
  const [text, setText] = useState<string>('');
  const [placeholder, setPlaceholder] = useState<string>(DEFAULT_PLACEHOLDER);
  const [isInputVisible, setInputVisible] = useState<boolean>(false);
  const { farcasterUser } = useLogin();

  const handleCast = useHandleCast({ text, setText, setPlaceholder, farcasterUser, hash });

  const handleOutsidePress = (event: any) => {
    if (event.target !== textInputRef.current) {
      setInputVisible(false);
      Keyboard.dismiss();
    }
  };

  const textInputRef = React.useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
          {isInputVisible ? (
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={styles.composeInputContainer}>
                <TextInput
                  ref={textInputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={placeholder}
                  placeholderTextColor={"#fff"} // Changed placeholder text color to white
                  style={styles.composeInput}
                />
                <TouchableOpacity onPress={handleCast} style={styles.composeButton}>
                  <MaterialIcons name="send" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.roundButton}
              onPress={() => setInputVisible(true)}
            >
              <MaterialIcons name="edit" size={24} color="white" />
            </TouchableOpacity>
          )}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export const useHandleCast = ({
  text,
  setText,
  setPlaceholder,
  farcasterUser,
  hash,
}: {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  setPlaceholder: React.Dispatch<React.SetStateAction<string>>;
  farcasterUser: { signer_uuid: string } | null;
  hash?: string;
}) => {
  const DEFAULT_PLACEHOLDER = 'Type to Cast...';

  return useCallback(async () => {
    if (farcasterUser) {
      try {
        const respBody = {
          parent: hash ? hash : '',
          signer_uuid: farcasterUser.signer_uuid,
          text: text,
        };
        const response = await fetch(`${API_URL}/neynar/cast`, {
          body: JSON.stringify(respBody),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        const result = await response.json();
        if (response.ok) {
          setText('');
          setPlaceholder('cast posted!');
          setTimeout(() => setPlaceholder(DEFAULT_PLACEHOLDER), 1500);
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Could not send the cast', error);
      }
    }
  }, [text, farcasterUser, hash, setText, setPlaceholder]);
};

const styles = StyleSheet.create({
  composeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    paddingRight: 0,
  },
  composeInputContainer: {
    display: 'flex',
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#2f2f2f',
    borderRadius: 64,
    margin: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  composeInput: {
    color: 'white',
    flex: 1,
  },
  roundButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 64,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ComposeCast;