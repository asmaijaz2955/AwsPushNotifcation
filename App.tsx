import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import AWS from 'aws-sdk';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp();
      console.log('Firebase Initialized');
    } else {
      firebase.app();
    }
  }, []);

  // Create notification channels
  const createNotificationChannels = async () => {
    try {
      // Default channel
      await notifee.createChannel({
        id: 'default',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        sound: 'default', // Use default system sound
      });

      // Another example channel
      await notifee.createChannel({
        id: 'important_notifications',
        name: 'Important Notifications',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        sound: 'important_sound', // Ensure 'important_sound.mp3' exists in res/raw folder
      });

      console.log('Notification channels created successfully');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  };

  useEffect(() => {
    createNotificationChannels();
  }, []);

  useEffect(() => {
    const getFcmToken = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted');
          const token = await messaging().getToken();
          if (token) {
            setFcmToken(token);
            console.log('FCM Token:', token);
          } else {
            console.log('No FCM token found');
          }
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    };

    getFcmToken();
  }, []);

  const sns = new AWS.SNS({
    region: 'us-east-1',
    accessKeyId: 'AKIAYRH5M2XR7XAGCW72',
    secretAccessKey: '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',
  });

  const sendPushNotification = async () => {
    try {
      if (!fcmToken) {
        console.log('No FCM token found.');
        return;
      }

      const params = {
        Message: JSON.stringify({
          notification: {
            title: 'Test Notification',
            body: 'This is a test push notification from AWS SNS via FCM',
          },
          data: {
            customData: 'This is some custom data for the app',
            channelId: 'default', // Specify the channel ID here
          },
        }),
        TargetArn:
          'arn:aws:sns:us-east-1:586794456547:endpoint/GCM/NotificationApp/1d637c40-9dd7-374a-9a4b-8d1722af7a33', // Use your ARN here
      };

      sns.publish(params, (err, data) => {
        if (err) {
          console.error('Error sending push notification:', err);
        } else {
          console.log('Push notification sent:', data);
        }
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  const showNotification = async (remoteMessage) => {
    try {
      let title = '';
      let body = '';
      let channelId = 'default'; // Default channel fallback

      // Parse data.default if notification property doesn't exist
      if (remoteMessage.data?.default) {
        const messageData = JSON.parse(remoteMessage.data.default);
        title = messageData.notification?.title || 'No title';
        body = messageData.notification?.body || 'No body';
        channelId = messageData.data?.channelId || 'default'; // Get channelId from payload
      } else {
        title = 'No title';
        body = 'No message body';
      }

      // Display notification using Notifee
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
        },
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);

      // Show notification using Notifee
      await showNotification(remoteMessage);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fcmToken) {
      sendPushNotification();
    }
  }, [fcmToken]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{ backgroundColor: isDarkMode ? Colors.black : Colors.white }}>
          <Text style={styles.title}>Push Notification Example</Text>
          <Text style={styles.description}>
            This app sends a push notification using AWS SNS and Firebase Cloud
            Messaging.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
  },
  description: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
});

export default App;
