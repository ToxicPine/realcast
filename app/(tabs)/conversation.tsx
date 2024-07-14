import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatDistanceToNow } from 'date-fns';
import _ from 'lodash';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import ComposeCast from '../../components/ComposeCast';
import { useLogin } from 'farcasterkit-react-native';

export type NeynarCastV1 = {
  hash: string;
  parentHash: string | null;
  parentUrl: string | null;
  threadHash: string;
  parentAuthor: {
    fid: number | null;
  };
  author: {
    fid: number;
    custodyAddress: string;
    username: string;
    displayName: string;
    pfp: {
      url: string;
    };
    profile: {
      bio: {
        text: string;
        mentionedProfiles: any[];
      };
    };
    followerCount: number;
    followingCount: number;
    verifications: string[];
    activeStatus: 'active' | 'inactive';
  };
  text: string;
  timestamp: string;
  embeds: { url: string }[];
  mentionedProfiles: {
    fid: number;
    custodyAddress: string;
    username: string;
    displayName: string;
    pfp: {
      url: string;
    };
    profile: {
      bio: {
        text: string;
        mentionedProfiles: any[];
      };
    };
    followerCount: number;
    followingCount: number;
    verifications: string[];
    activeStatus: 'active' | 'inactive';
  }[];
  reactions: {
    count: number;
    fids: number[];
    fnames: string[];
  };
  recasts: {
    count: number;
    fids: number[];
  };
  recasters: string[];
  viewerContext: {
    liked: boolean;
    recasted: boolean;
  };
  replies: {
    count: number;
  };
};

export default function ConversationScreen() {
  const route = useRoute();
  const hash = route.params?.hash as string;
  const { farcasterUser } = useLogin();
  const [parentHash, setParentHash] = useState<string | null>(null); // todo: rename, this is just for fetchThread
  const [navigationParentHash, setNavigationParentHash] = useState<string | null>(hash);
  const [thread, setThread] = useState<NeynarCastV1[]>([]);
  const navigation = useNavigation();
  const neynarApiKey = process.env.EXPO_PUBLIC_NEYNAR_API_KEY;

  const handleBackPress = () => {
    navigation.navigate('index');
    setNavigationParentHash(null);
  };

  const handleCastPress = (childHash: string) => {
    navigation.setParams({ hash: childHash });
    setNavigationParentHash(childHash);
  };

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} style={{ paddingLeft: 20, paddingRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="arrow-back" size={24} color="black" style={{ fontWeight: '400' }} />
        </TouchableOpacity>
      ),
      title: 'Thread',
      headerTitleStyle: {
        color: 'black',
      },
    });
  }, [hash, navigation]);

  useEffect(() => {
    async function fetchThread() {
      if (thread.some((cast) => cast.hash === hash)) {
        const itemIndex = thread.findIndex((cast) => cast.hash === hash);
        if (itemIndex > 0) {
          const newThread = thread.slice(itemIndex);
          if (newThread[0].hash !== parentHash) {
            setParentHash(newThread[0].parentHash);
          } else {
            setParentHash(null);
          }
          setThread(newThread);
        }
      } else {
        const url = `https://api.neynar.com/v1/farcaster/all-casts-in-thread?threadHash=${hash}&viewerFid=${farcasterUser?.fid}`;
        try {
          const response = await fetch(url, {
            headers: {
              Accept: 'application/json',
              api_key: neynarApiKey as string,
            },
            method: 'GET',
          });
          const data = await response.json();
          const newThread = organizeThread(data.result.casts);
          setThread(newThread);
          if (newThread[0].hash !== parentHash) {
            setParentHash(newThread[0].parentHash);
          } else {
            setParentHash(null);
          }
        } catch (error) {
          console.error('Error fetching thread:', error);
        }
      }
    }
    if (hash) {
      fetchThread();
    }
  }, [hash]);

  const organizeThread = (data: NeynarCastV1[]): NeynarCastV1[] => {
    let thread: NeynarCastV1[] = [];
    let map: { [key: string]: NeynarCastV1 } = {};
    data.forEach((cast) => {
      map[cast.hash] = cast;
      cast.children = [];
      thread.push(cast);
    });
    return thread;
  };

  const renderCast = ({ item: cast }) => {
    const renderImages = () => {
      const regex = /https?:\/\/\S+\.(?:jpg|jpeg|png|gif)/g;
      const textMatches = cast.text.match(regex) || [];
      const embedMatches = cast.embeds
        .filter((embed) => embed.url && embed.url.match(regex))
        .map((embed) => embed.url);
      const allMatches = Array.from(new Set([...textMatches, ...embedMatches]));
      return (
        <View style={imageStyles.imagesContainer}>
          {allMatches.map((url) => (
            <View key={url} style={imageStyles.imageContainer}>
              <Image source={{ uri: url }} style={imageStyles.image} />
            </View>
          ))}
        </View>
      );
    };

    const relativeTime = formatDistanceToNow(new Date(cast.timestamp), {
      addSuffix: true,
    });

    return (
      <TouchableOpacity onPress={() => handleCastPress(cast.hash)}>
        <View style={containerStyles.castContainer}>
          <Image source={{ uri: cast.author.pfp.url }} style={imageStyles.pfpImage} />
          <View style={containerStyles.contentContainer}>
            <View style={containerStyles.headerContainer}>
              <Text style={textStyles.displayName}>{cast.author.displayName}</Text>
              <Text style={textStyles.timestamp}>{_.replace(relativeTime, 'about ', '')}</Text>
            </View>
            <Text style={textStyles.castText}>{cast.text}</Text>
            {renderImages()}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlashList
        contentContainerStyle={styles.scrollView}
        data={thread}
        renderItem={renderCast}
        keyExtractor={(item) => item.hash}
        estimatedItemSize={125}
      />
      {thread.length > 0 && <ComposeCast hash={thread[0].hash} />}
    </View>
  );
}

const containerStyles = StyleSheet.create({
  castContainer: {
    borderBottomWidth: 1,
    borderColor: '#eaeaea',
    flexDirection: 'row',
    padding: 16,
    zIndex: -50,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 4,
    paddingTop: 2,
    gap: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  reactionsGroupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 4,
    gap: 4,
  },
});

const textStyles = StyleSheet.create({
  castText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 0,
    paddingRight: 8,
    paddingBottom: 3,
  },
  displayName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    fontWeight: '300',
    paddingRight: 6,
  },
  reactionText: {
    color: '#000',
    fontSize: 12,
  },
  reactionTextFirst: {
    color: '#000',
    fontSize: 12,
  },
});

const imageStyles = StyleSheet.create({
  pfpImage: {
    borderRadius: 18,
    height: 36,
    width: 36,
    marginLeft: 0,
    marginRight: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 'auto',
    maxHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    backgroundColor: '#ffffff',
  },
});