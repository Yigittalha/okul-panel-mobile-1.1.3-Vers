import React, { useContext, useEffect, useRef, useState } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SessionContext } from "../state/session";
import SchoolSelect from "../app/auth/SchoolSelect";
import Login from "../app/auth/Login";
import AppDrawer from "./AppDrawer";
import SlideMenu from "./SlideMenu";
import WhatsNewScreen from "../app/common/WhatsNewScreen";
import { useTheme } from "../state/theme";
import { darkClassic } from "../constants/colors";
import ExamAdd from "../app/teacher/ExamAdd";
import { getNewsCardDismissed } from "../lib/storage";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SchoolSelect" component={SchoolSelect} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading, role } = useContext(SessionContext);
  const { isDark, theme } = useTheme();
  const navigationRef = useRef();
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Uygulama versiyonu - her güncellemede değiştirilecek
  const CURRENT_APP_VERSION = "1.0.0";

  // Create custom dark theme with darkClassic colors
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: darkClassic.background,
      card: darkClassic.card,
      text: darkClassic.textPrimary,
      border: darkClassic.border,
      notification: darkClassic.accent,
      primary: darkClassic.accent,
    },
  };

  // Notification navigation handler
  useEffect(() => {
    const handleNotificationNavigation = (remoteMessage) => {
      console.log('🔔 Notification navigation triggered:', remoteMessage);
      
      if (!navigationRef.current || !isAuthenticated) {
        console.log('❌ Navigation not ready or user not authenticated');
        return;
      }

      if (!role) {
        console.log('❌ Role not loaded yet, waiting...');
        // Role yüklenene kadar bekle
        const checkRole = () => {
          if (role) {
            handleNotificationNavigation(remoteMessage);
          } else {
            setTimeout(checkRole, 500);
          }
        };
        setTimeout(checkRole, 500);
        return;
      }

      try {
        // Notification data'sını detaylı logla
        console.log('🔍 Full notification data:', JSON.stringify(remoteMessage, null, 2));
        
        // Mesaj bildirimlerini kontrol et - farklı formatları kontrol et
        const notificationType = remoteMessage.data?.type || 
                                remoteMessage.notification?.data?.type ||
                                remoteMessage.data?.notification_type;
        
        const messageType = remoteMessage.data?.message_type || 
                           remoteMessage.notification?.data?.message_type;
        
        const title = remoteMessage.notification?.title || '';
        const body = remoteMessage.notification?.body || '';
        
        console.log('📱 Notification type:', notificationType);
        console.log('💬 Message type:', messageType);
        console.log('📝 Title:', title);
        console.log('📄 Body:', body);

        // Mesaj bildirimi kontrolü - daha geniş kapsamlı
        const isMessageNotification = 
          notificationType === 'message' || 
          messageType === 'message' ||
          notificationType === 'mesaj' ||
          messageType === 'mesaj' ||
          title.toLowerCase().includes('mesaj') ||
          body.toLowerCase().includes('mesaj') ||
          title.toLowerCase().includes('message') ||
          body.toLowerCase().includes('message') ||
          remoteMessage.data?.action === 'message' ||
          remoteMessage.data?.action === 'mesaj';

        if (isMessageNotification) {
          console.log('📬 Message notification detected, navigating to inbox...');
          
          // Kısa bir delay ile navigation yap (navigation hazır olması için)
          setTimeout(() => {
            if (navigationRef.current) {
              // Role'e göre doğru screen'leri kullan
              const homeScreen = role === 'parent' ? 'StudentHomePage' : 'HomePage';
              const inboxScreen = role === 'parent' ? 'StudentMessageInbox' : 'MessageInbox';
              
              console.log(`🔍 Role: ${role}, navigating to ${homeScreen} then ${inboxScreen}`);
              
              // Önce ana sayfaya git, sonra Gelen Kutusu'na
              navigationRef.current.navigate(homeScreen);
              
              // 500ms sonra Gelen Kutusu'na git
              setTimeout(() => {
                if (navigationRef.current) {
                  navigationRef.current.navigate(inboxScreen);
                  console.log(`✅ Successfully navigated to ${inboxScreen}`);
                }
              }, 500);
            }
          }, 100);
        } else {
          console.log('ℹ️ Not a message notification, no navigation needed');
        }
      } catch (error) {
        console.log('❌ Notification navigation error:', error);
      }
    };

    // Global handler'ı kaydet
    global.handleNotificationNavigation = handleNotificationNavigation;

    return () => {
      global.handleNotificationNavigation = null;
    };
  }, [isAuthenticated]);

  // What's New kontrolü - sadece authenticated ve role yüklendikten sonra
  useEffect(() => {
    checkWhatsNewVisibility();
  }, [isAuthenticated, role]);

  const checkWhatsNewVisibility = async () => {
    try {
      console.log('🔍 checkWhatsNewVisibility çalışıyor...');
      console.log('🔍 isAuthenticated:', isAuthenticated);
      console.log('🔍 role:', role);
      
      // Henüz authenticate olmamışsa veya role yüklenmemişse bekle
      if (!isAuthenticated || !role) {
        console.log('⏳ Henüz hazır değil, bekleniyor...');
        return;
      }

      // Sadece öğretmen ve öğrenci için kontrol et
      if (role !== 'teacher' && role !== 'parent') {
        console.log('❌ Role uygun değil:', role);
        return;
      }

      const seenVersion = await getNewsCardDismissed();
      console.log('🔍 seenVersion:', seenVersion);
      console.log('🔍 CURRENT_APP_VERSION:', CURRENT_APP_VERSION);
      
      // Eğer hiç görülmemişse veya mevcut versiyon farklıysa göster
      const shouldShow = !seenVersion || seenVersion !== CURRENT_APP_VERSION;
      console.log('🔍 shouldShow:', shouldShow);
      
      if (shouldShow) {
        console.log('✅ What\'s New gösteriliyor');
        setShowWhatsNew(true);
      } else {
        console.log('❌ What\'s New gösterilmiyor');
        setShowWhatsNew(false);
      }
    } catch (error) {
      console.log('❌ WhatsNew görünürlük kontrolü hatası:', error);
    }
  };

  if (loading) return null; // Or a splash screen

  return (
    <NavigationContainer 
      ref={navigationRef}
      theme={isDark ? customDarkTheme : DefaultTheme}
    >
      {isAuthenticated ? (
        <>
          <AppDrawer />
          <SlideMenu />
          <WhatsNewScreen 
            visible={showWhatsNew} 
            onDismiss={() => setShowWhatsNew(false)} 
          />
        </>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
