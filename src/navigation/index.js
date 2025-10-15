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
import ForgotPasswordType from "../app/auth/ForgotPasswordType";
import ForgotPasswordEmail from "../app/auth/ForgotPasswordEmail";
import ForgotPasswordVerify from "../app/auth/ForgotPasswordVerify";
import ForgotPasswordNew from "../app/auth/ForgotPasswordNew";
import ForgotPasswordStudentPhone from "../app/auth/ForgotPasswordStudentPhone";
import ForgotPasswordStudentVerify from "../app/auth/ForgotPasswordStudentVerify";
import ForgotPasswordStudentNew from "../app/auth/ForgotPasswordStudentNew";
import AppDrawer from "./AppDrawer";
import SlideMenu from "./SlideMenu";
import { useTheme } from "../state/theme";
import { darkClassic } from "../constants/colors";
import ExamAdd from "../app/teacher/ExamAdd";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SchoolSelect" component={SchoolSelect} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="ForgotPasswordType" component={ForgotPasswordType} />
      <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmail} />
      <Stack.Screen name="ForgotPasswordVerify" component={ForgotPasswordVerify} />
      <Stack.Screen name="ForgotPasswordNew" component={ForgotPasswordNew} />
      <Stack.Screen name="ForgotPasswordStudentPhone" component={ForgotPasswordStudentPhone} />
      <Stack.Screen name="ForgotPasswordStudentVerify" component={ForgotPasswordStudentVerify} />
      <Stack.Screen name="ForgotPasswordStudentNew" component={ForgotPasswordStudentNew} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading, role } = useContext(SessionContext);
  const { isDark, theme } = useTheme();
  const navigationRef = useRef();

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
        </>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
