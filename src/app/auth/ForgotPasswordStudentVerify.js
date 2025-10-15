import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../state/theme';
import { SessionContext } from '../../state/session';

const ForgotPasswordStudentVerify = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  const { userType, phone, studentNo } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 dakika

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert(
            'Süre Doldu',
            'Doğrulama süresi doldu. Lütfen tekrar deneyin.',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.navigate('ForgotPasswordStudentPhone', { userType }),
              },
            ]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigation, userType]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Lütfen doğrulama kodunu giriniz.');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Hata', 'Doğrulama kodu 6 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      // Token gerektirmeyen API için doğrudan fetch kullan
      const response = await fetch(`https://${schoolCode}.okulpanel.com.tr/api/user/password/student/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      if (data === false) {
        Alert.alert('Hata', 'Geçersiz doğrulama kodu');
        navigation.navigate('ForgotPasswordStudentPhone', { userType });
      } else if (data === true) {
        navigation.navigate('ForgotPasswordStudentNew', { 
          userType, 
          phone,
          studentNo,
          code 
        });
      } else {
        Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
        navigation.navigate('ForgotPasswordStudentPhone', { userType });
      }
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
      navigation.navigate('ForgotPasswordStudentPhone', { userType });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: '#000000' }]}>← Geri</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            Doğrulama Kodunu Girin
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {phone} numarasına gönderilen 6 haneli doğrulama kodunu giriniz
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: theme.accent }]}>
            Kalan Süre: {formatTime(timeLeft)}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>
            Doğrulama Kodu
          </Text>
          <TextInput
            style={[styles.codeInput, { 
              backgroundColor: theme.card, 
              color: theme.text,
              borderColor: theme.border 
            }]}
            placeholder="123456"
            placeholderTextColor={theme.textSecondary}
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton, 
            { backgroundColor: theme.accent },
            loading && styles.disabledButton
          ]}
          onPress={handleVerifyCode}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={[styles.continueButtonText, { color: '#000' }]}>
              Devam Et
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeInput: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButton: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForgotPasswordStudentVerify;
