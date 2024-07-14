import _ from 'lodash'
import { formatDistanceToNow } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useLogin, useReaction } from 'farcasterkit-react-native'
import { useNavigation } from '@react-navigation/native'

const Cast = ({ cast }: { cast: NeynarCastV2 }) => {
  const { farcasterUser } = useLogin()
  const postReaction = useReaction()
  const navigation = useNavigation()
  const [reactions, setReactions] = useState<Reactions>({
    likes: [],
    recasts: [],
  }) // track reactions in state to optimistically update when the user reacts

  useEffect(() => {
    setReactions(cast.reactions)
  }, [cast])

  const handleReaction = async (type: 'like' | 'recast', hash: string) => {
    try {
      if (!farcasterUser) throw new Error('Not logged in')
      await postReaction(type, hash)
      // TODO: handle unlikes and un-recasts
      if (type === 'like') {
        setReactions({
          ...reactions,
          likes: [...reactions.likes, farcasterUser],
        })
      } else if (type === 'recast') {
        setReactions({
          ...reactions,
          recasts: [...reactions.recasts, farcasterUser],
        })
      }
      console.log(`${type}d cast with hash ${hash}`)
    } catch (error) {
      console.error('Error posting reaction:', error)
    }
  }

  const renderImages = () => {
    // Regex to match image URLs
    const regex = /https?:\/\/\S+\.(?:jpg|jpeg|png|gif)/g

    // Find matches in cast.text
    const textMatches = cast.text.match(regex) || []

    // Extract URLs from cast.embeds
    const embedMatches = cast.embeds
      .filter((embed) => embed.url && embed.url.match(regex))
      .map((embed) => embed.url)

    // Combine and de-duplicate URLs from text and embeds
    const allMatches = Array.from(new Set([...textMatches, ...embedMatches]))

    // Render images
    return (
      <View style={imageStyles.imagesContainer}>
        {allMatches.map((url) => (
          <View key={url} style={imageStyles.imageContainer}>
            <Image source={{ uri: url }} style={imageStyles.image} />
            {true && (
              <View style={imageStyles.securityIconContainer}>
                <MaterialIcons name="security" size={20} color="white" />
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  const relativeTime = formatDistanceToNow(new Date(cast.timestamp), {
    addSuffix: true,
  })
  return (
    <TouchableOpacity onPress={() => navigation.navigate('conversation', { hash: cast.hash })}>
      <View style={containerStyles.castContainer}>
        <Image
          source={{ uri: cast.author.pfp_url ?? '' }}
          style={imageStyles.pfpImage}
        />
        <View style={containerStyles.contentContainer}>
          <View style={containerStyles.headerContainer}>
            <Text style={textStyles.displayName}>
              {cast.author.display_name}
            </Text>
            <Text style={textStyles.timestamp}>
              {_.replace(relativeTime, 'about ', '')}
            </Text>
            {/* <Text style={styles.timestamp}>{_.replace(relativeTime, 'about ', '')}</Text> */}
          </View>
          <Text style={textStyles.castText}>{cast.text}</Text>
          {renderImages()}
          <View style={containerStyles.reactionsContainer}>
            <View style={containerStyles.reactionsGroupContainer}>
              <MaterialIcons 
              name="comment" 
              size={16} 
              color="black" 
              />
              <Text style={textStyles.reactionText}> {cast.replies.count}</Text>
            </View>
            <TouchableOpacity
              disabled={!farcasterUser}
              onPress={() => handleReaction('recast', cast.hash)}
            >
              <View style={containerStyles.reactionsGroupContainer}>
                <MaterialIcons
                  name="repeat"
                  size={16}
                  color={
                    reactions.recasts.some((r) => r.fid === farcasterUser?.fid)
                      ? 'green'
                      : 'black'
                  }
                  style={{ opacity: farcasterUser ? 100 : 50 }}
                />
                <Text style={textStyles.reactionText}>
                  {' '}
                  {reactions.recasts.length}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!farcasterUser}
              onPress={() => handleReaction('like', cast.hash)}
            >
              <View style={containerStyles.reactionsGroupContainer}>
                <MaterialIcons
                  name={
                    reactions.likes.some((r) => r.fid === farcasterUser?.fid)
                      ? 'favorite'
                      : 'favorite-border'
                  }
                  size={16}
                  color={
                    reactions.likes.some((r) => r.fid === farcasterUser?.fid)
                      ? 'red'
                      : 'black'
                  }
                  style={{ opacity: farcasterUser ? 100 : 50 }}
                />
                <Text style={textStyles.reactionTextFirst}>
                  {' '}
                  {reactions.likes.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
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
    justifyContent: 'center',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 4,
    paddingTop: 2,
    gap: 2
  },
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
    marginTop: 0,
  },
  reactionsGroupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 4,
    gap: 4
  },
})

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
})

const imageStyles = StyleSheet.create({
  securityIconContainer: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'green',
    top: 8,
    right: 8,
  },
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
})

export default Cast;