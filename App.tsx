import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import AWS from 'aws-sdk'; // AWS SDK import
import { Colors } from 'react-native/Libraries/NewAppScreen';
import messaging from '@react-native-firebase/messaging'; // FCM for React Native
import firebase from '@react-native-firebase/app'; // Firebase initialization

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [fcmToken, setFcmToken] = useState(null);

  // Initialize Firebase (only if not already initialized)
  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(); // Firebase initialization
      console.log('Firebase Initialized');
    } else {
      firebase.app(); // If already initialized, use that one
    }
  }, []);

  // Request permission for notifications and get FCM token
  useEffect(() => {
    const getFcmToken = async () => {
      try {
        // Request permission for iOS devices
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted');
          const token = await messaging().getToken(); // Get the FCM token
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

  // Initialize the SNS client with AWS SDK
  const sns = new AWS.SNS({
    region: 'us-east-1', // Your AWS region
    accessKeyId: 'AKIAYRH5M2XR7XAGCW72', // AWS Access Key
    secretAccessKey: 'cPkt46Io5Wmguivq5oR8WrUyB0ax6qswjjkdKgl+', // AWS Secret Access Key
  });

  // Function to send push notification via AWS SNS
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
          },
        }),
        TargetArn: 'arn:aws:sns:us-east-1:586794456547:endpoint/GCM/NotificationApp/1d637c40-9dd7-374a-9a4b-8d1722af7a33', // Use your ARN here
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

  useEffect(() => {
    if (fcmToken) {
      sendPushNotification(); // Send notification when token is available
    }
  }, [fcmToken]);

  // Foreground notifications handling
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      // Handle the incoming message here
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={backgroundStyle}>
        <View style={{ backgroundColor: isDarkMode ? Colors.black : Colors.white }}>
          <Text style={styles.title}>Push Notification Example</Text>
          <Text style={styles.description}>
            This app sends a push notification using AWS SNS and Firebase Cloud Messaging.
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
