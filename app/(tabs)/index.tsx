import { FlashList } from '@shopify/flash-list'
import _ from 'lodash'
import React, { useCallback, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native'
import ComposeCast from '../../components/ComposeCast'
import { useLatestCasts } from 'farcasterkit-react-native'
import Cast from '../../components/Cast'

const TabOneScreen = () => {
  // TODO: edit useLatestCasts logic so it adds dyanmic fid and not mine as static
  const { casts, isLoading, loadMore, isReachingEnd } = useLatestCasts()

  const onEndReached = useCallback(() => {
    if (!isReachingEnd) {
      loadMore()
    }
  }, [isReachingEnd, loadMore])

  const [isInputVisible, setInputVisible] = useState(false);

  const handleOutsidePress = () => {
    setInputVisible(false);
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <FlashList
          contentContainerStyle={styles.flashList}
          data={casts}
          renderItem={({ item }) => <Cast key={item.hash} cast={item} />}
          keyExtractor={(item) => item.hash}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            isLoading && !isReachingEnd ? (
              <ActivityIndicator style={{ margin: 20 }} size="large" color="#000000" />
            ) : null
          }
          estimatedItemSize={125}
        />
        <ComposeCast
          isInputVisible={isInputVisible}
          setInputVisible={setInputVisible}
          handleOutsidePress={handleOutsidePress}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'space-between',
  },
  flashList: {
    backgroundColor: '#fff',
  },
})

export default TabOneScreen