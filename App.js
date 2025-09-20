import React, { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider } from "./src/state/session";
import { ThemeProvider, useTheme } from "./src/state/theme";
import { SlideMenuProvider } from "./src/navigation/SlideMenuContext";
import RootNavigator from "./src/navigation/index";
import {
  LogBox,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { darkClassic } from "./src/constants/colors";
import messaging from '@react-native-firebase/messaging';
import api from './src/lib/api';

// Redirect console logs to be visible on screen for debugging
if (__DEV__) {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);

    // Skip certain verbose logs
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
      .join(" ");

    // Photo URL loglarını vurgulayalım
    const isPhotoUrlLog =
      message.includes("Photo URL") ||
      message.includes("PHOTO URL") ||
      message.includes("FOTO");

    if (!global.onScreenLogs) global.onScreenLogs = [];
    global.onScreenLogs.unshift({
      time: new Date().toLocaleTimeString(),
      message,
      isHighlighted: isPhotoUrlLog,
    });

    // Keep only latest 30 logs
    if (global.onScreenLogs.length > 30) global.onScreenLogs.pop();
  };
}

const DebugLogsWithTheme = () => {
  const { theme, isDark } = useTheme();
  const [logs, setLogs] = React.useState([]);
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    // Daha az yenileme yapalım (500ms yerine 2000ms)
    const interval = setInterval(() => {
      if (global.onScreenLogs) setLogs([...global.onScreenLogs]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!__DEV__) return null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.debugToggle,
          {
            backgroundColor: isDark
              ? "rgba(11, 15, 20, 0.7)"
              : "rgba(0,0,0,0.5)",
          },
        ]}
        onPress={() => setVisible(!visible)}
      >
        <Text style={[styles.debugToggleText, { color: theme.text }]}>
          {visible ? "Logları Gizle" : "Logları Göster"}
        </Text>
      </TouchableOpacity>

      {visible && (
        <View
          style={[
            styles.debugContainer,
            {
              backgroundColor: isDark
                ? "rgba(11, 15, 20, 0.7)"
                : "rgba(0,0,0,0.7)",
            },
          ]}
        >
          <Text style={[styles.debugTitle, { color: theme.text }]}>
            DEBUG LOGS:
          </Text>
          <ScrollView style={styles.debugScroll}>
            {logs.length === 0 && (
              <Text style={[styles.debugText, { color: theme.text }]}>
                Henüz log yok...
              </Text>
            )}

            {logs.map((log, i) => (
              <Text
                key={i}
                style={[
                  styles.debugText,
                  { color: theme.text },
                  log.isHighlighted && [
                    styles.debugTextHighlight,
                    { color: isDark ? theme.accent : "yellow" },
                  ],
                ]}
              >
                {log.time}: {log.message}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

// Simple debug logs without theme dependency
const DebugLogs = () => {
  const [logs, setLogs] = React.useState([]);
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (global.onScreenLogs) setLogs([...global.onScreenLogs]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!__DEV__) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.debugToggle, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={() => setVisible(!visible)}
      >
        <Text style={[styles.debugToggleText, { color: "#fff" }]}>
          {visible ? "Logları Gizle" : "Logları Göster"}
        </Text>
      </TouchableOpacity>

      {visible && (
        <View
          style={[
            styles.debugContainer,
            { backgroundColor: "rgba(0,0,0,0.7)" },
          ]}
        >
          <Text style={[styles.debugTitle, { color: "#fff" }]}>
            DEBUG LOGS:
          </Text>
          <ScrollView style={styles.debugScroll}>
            {logs.length === 0 && (
              <Text style={[styles.debugText, { color: "#fff" }]}>
                Henüz log yok...
              </Text>
            )}

            {logs.map((log, i) => (
              <Text
                key={i}
                style={[
                  styles.debugText,
                  { color: "#fff" },
                  log.isHighlighted && [
                    styles.debugTextHighlight,
                    { color: "yellow" },
                  ],
                ]}
              >
                {log.time}: {log.message}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

// Firebase FCM fonksiyonları
const initializeFirebasePermissions = async () => {
  try {
    // Android 13+ için runtime permission
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Bildirim İzni',
          message: 'Önemli duyurular için bildirim izni gerekiyor',
          buttonNeutral: 'Sonra Sor',
          buttonNegative: 'İptal',
          buttonPositive: 'İzin Ver',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Android bildirim izni verildi');
      } else {
        console.log('❌ Android bildirim izni reddedildi');
      }
    }
    
    // Firebase izni (iOS için gerekli, Android için ek kontrol)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ FCM izni verildi:', authStatus);
    } else {
      console.log('❌ FCM izni verilmedi');
    }
  } catch (error) {
    console.log('❌ Firebase izin hatası:', error);
  }
};

// Login sonrası çağrılacak fonksiyon
const sendFCMTokenAfterLogin = async (userInfo) => {
  try {
    // FCM Token al
    const fcmToken = await messaging().getToken();
    console.log('🔥 FCM TOKEN ALINDI:', fcmToken);
    
    // User ID'yi user/info API'sinden al
    const userInfoResponse = await api.post('/user/info', {}, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    
    if (userInfoResponse.data) {
      let userId = null;
      let userType = null;
      
      // User ID'yi belirle
      if (userInfoResponse.data.OgretmenID) {
        userId = userInfoResponse.data.OgretmenID;
        userType = 'teacher';
      } else if (userInfoResponse.data.OgrenciId) {
        userId = userInfoResponse.data.OgrenciId;
        userType = 'student';
      } else if (userInfoResponse.data.AdminID) {
        userId = userInfoResponse.data.AdminID;
        userType = 'admin';
      }
      
      // Eğer userInfo'dan rol bilgisi geliyorsa, onu kullan
      if (userInfo && userInfo.role) {
        switch (userInfo.role) {
          case 'teacher':
            userType = 'teacher';
            break;
          case 'parent':
            userType = 'student';
            break;
          case 'admin':
            userType = 'admin';
            break;
        }
      }
      
      if (userId && userType) {
        console.log('🔥 FCM TOKEN BACKEND\'E GÖNDERİLİYOR:');
        console.log('📱 FCM Token:', fcmToken);
        console.log('👤 User ID:', userId);
        console.log('🏷️ User Type:', userType);
        
        // FCM token'ı backend'e gönder
        const response = await api.post('/user/token', {
          fcm_token: fcmToken,
          user_id: userId,
          user_type: userType
        }, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        
        console.log('✅ FCM token backend\'e başarıyla gönderildi:', response.data);
      } else {
        console.log('❌ User ID veya User Type bulunamadı:', userInfoResponse.data);
      }
    } else {
      console.log('❌ User info alınamadı');
    }
  } catch (error) {
    console.log('❌ FCM token gönderme hatası:', error);
  }
};

// Logout fonksiyonu - sadece storage temizle
const handleLogout = async (userId) => {
  try {
    console.log('🚪 Logout işlemi - FCM storage temizleniyor...');
    
    // Cihaz token storage'ını temizle (yeni login'de tekrar gönderilsin)
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const deviceTokenKey = 'fcm_device_token';
    await AsyncStorage.removeItem(deviceTokenKey);
    
    console.log('🗑️ FCM storage temizlendi, yeni login\'de token tekrar gönderilecek');
    
  } catch (error) {
    console.log('❌ Logout FCM storage temizleme hatası:', error);
  }
};

// Global olarak erişilebilir hale getir
global.sendFCMTokenAfterLogin = sendFCMTokenAfterLogin;
global.handleFCMLogout = handleLogout;

const AppContent = () => {
  useEffect(() => {
    // Firebase izinlerini başlat (token gönderme login sonrası olacak)
    initializeFirebasePermissions();

    // Uygulama açıkken gelen mesajlar
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Yeni bildirim geldi:', remoteMessage);
      Alert.alert(
        'Yeni Bildirim!',
        remoteMessage.notification?.body || 'Bildirim içeriği yok',
        [{ text: 'Tamam' }]
      );
    });

    // Uygulama kapalıyken tıklanan bildirimler
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Bildirime tıklandı (uygulama arka planda):', remoteMessage);
      // Global navigation handler'a bildir
      if (global.handleNotificationNavigation) {
        global.handleNotificationNavigation(remoteMessage);
      }
    });

    // Uygulama tamamen kapalıyken açılan bildirimler
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Uygulama bildirimle açıldı:', remoteMessage);
          console.log('📱 Platform:', Platform.OS);
          
          // Android için daha uzun delay
          const delay = Platform.OS === 'android' ? 2000 : 1000;
          console.log(`⏱️ Using ${delay}ms delay for ${Platform.OS}`);
          
          // Global navigation handler'a bildir - platform'a göre delay ile
          setTimeout(() => {
            if (global.handleNotificationNavigation) {
              global.handleNotificationNavigation(remoteMessage);
            } else {
              console.log('❌ Navigation handler henüz hazır değil, 3 saniye sonra tekrar denenecek');
              // 3 saniye sonra tekrar dene (Android için daha uzun)
              setTimeout(() => {
                if (global.handleNotificationNavigation) {
                  global.handleNotificationNavigation(remoteMessage);
                } else {
                  console.log('❌ Navigation handler hala hazır değil');
                }
              }, 3000);
            }
          }, delay);
        }
      });

    return unsubscribe;
  }, []);

  return (
    <>
      <RootNavigator />
      <DebugLogsWithTheme />
    </>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SessionProvider>
          <SlideMenuProvider>
            <AppContent />
          </SlideMenuProvider>
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 300,
    height: 300,
    padding: 5,
    zIndex: 9999,
  },
  debugText: {
    fontSize: 10,
  },
  debugTextHighlight: {
    fontWeight: "bold",
  },
  debugToggle: {
    position: "absolute",
    top: 40,
    left: 10,
    padding: 5,
    zIndex: 9999,
    borderRadius: 5,
  },
  debugToggleText: {
    fontSize: 12,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  debugScroll: {
    flex: 1,
  },
});
