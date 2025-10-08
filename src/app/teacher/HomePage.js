import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  Animated,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import api, { fetchUserInfo, getUploadUrl } from "../../lib/api";
// TeacherBottomMenu artık AppDrawer'da wrapper ile ekleniyor

const { width, height } = Dimensions.get("window");

const HomePage = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schoolCode, schoolPhoto } = useContext(SessionContext);
  const { openMenu } = useSlideMenu();
  const [userInfo, setUserInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // todayStats state'i kaldırıldı - artık DailySummary sayfasında kullanılıyor

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await fetchUserInfo(true);
      if (data) {
        setUserInfo(data);
      }
    } catch (error) {
      console.log('Kullanıcı bilgisi alınamadı:', error);
    }
  };

  const getUserPhotoUrl = () => {
    try {
      if (!userInfo) {
        return null;
      }

      if (!userInfo?.Fotograf) {
        return null;
      }

      // Fotoğraf string'i geldi mi kontrol et
      if (
        typeof userInfo.Fotograf !== "string" ||
        userInfo.Fotograf.trim() === ""
      ) {
        return null;
      }

      const photoUrl = getUploadUrl(userInfo.Fotograf, schoolCode);

      // URL oluşturulduysa kullan, yoksa null döndür
      if (!photoUrl) {
        return null;
      }

      return photoUrl;
    } catch (error) {
      return null;
    }
  };

  // fetchTodayStats fonksiyonu kaldırıldı - artık DailySummary sayfasında doğru hesaplama yapılıyor

  const quickActions = [
    {
      id: 'attendance',
      title: 'Yoklama Al',
      icon: 'people',
      color: '#10B981',
      route: 'TeacherSchedule',
      description: 'Öğrenci yoklaması'
    },
    {
      id: 'schedule',
      title: 'Ders Programı',
      icon: 'calendar',
      color: '#EF4444',
      route: 'TeacherScheduleScreen',
      description: 'Haftalık program'
    },
    {
      id: 'homework',
      title: 'Ödev Ver',
      icon: 'document-text',
      color: '#3B82F6',
      route: 'HomeworksGivenList',
      description: 'Verdiğim ödevler'
    },
    {
      id: 'exam',
      title: 'Sınav Ekle',
      icon: 'school',
      color: '#F59E0B',
      route: 'ExamsList',
      description: 'Sınav planla'
    },
    {
      id: 'message',
      title: 'Gelen Kutusu',
      icon: 'mail',
      color: '#8B5CF6',
      route: 'MessageInbox',
      description: 'Gelen mesajlar'
    },
    {
      id: 'students',
      title: 'Öğrenciler',
      icon: 'person',
      color: '#06B6D4',
      route: 'StudentsList',
      description: 'Öğrenci listesi'
    }
  ];


  const handleActionPress = (action) => {
    if (action.route) {
      navigation.navigate(action.route);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
    } catch (error) {
      console.log('Refresh hatası:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: 'transparent' }]} onPress={openMenu}>
            <Text style={[styles.menuIcon, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>☰</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={24} color={isDark ? '#FFFFFF' : '#1E293B'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FFD60A', '#FFA500']} // Android
            tintColor="#FFD60A" // iOS
            title="Yenileniyor..."
            titleColor={isDark ? '#FFFFFF' : '#1E293B'}
          />
        }
      >
        {/* Brand Header Card */}
        <View style={[styles.brandCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <LinearGradient
            colors={isDark ? ['#0D1B2A', '#1E293B'] : ['#FFD60A', '#FFA500']}
            style={styles.brandGradient}
          >
            <View style={styles.brandContent}>
              <View style={styles.brandLeft}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../../../assets/okul-panel.png')} 
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandText}>
                  <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#0D1B2A' }]}>
                    Okul Panel
                  </Text>
                  <Text style={[styles.brandSubtitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                    Eğitim Yönetim Sistemi
                  </Text>
                </View>
              </View>
              
              <View style={styles.schoolInfo}>
                {schoolPhoto ? (
                  <Image
                    source={{ uri: schoolPhoto }}
                    style={styles.schoolLogoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.schoolLogo, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]}>
                    <Ionicons name="school" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                  </View>
                )}
                <Text style={[styles.schoolName, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                  {schoolCode || 'Okul Adı'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Welcome Message */}
        <View style={[styles.welcomeCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeText}>
              <Text style={[styles.welcomeTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                Bugün neye ihtiyacın var {userInfo?.AdSoyad || 'Öğretmen'}? 🤔
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Ne yapmak istersin, hangi konularda yardıma ihtiyacın var?
              </Text>
            </View>
            <View style={[
              styles.welcomeIcon,
              { 
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
                borderWidth: 1,
                borderColor: isDark ? '#475569' : '#E2E8F0'
              }
            ]}>
              {getUserPhotoUrl() ? (
                <Image
                  source={{ uri: getUserPhotoUrl() }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={28} color={isDark ? '#94A3B8' : '#64748B'} />
              )}
            </View>
          </View>
        </View>

        {/* Bugünün Özeti kartı kaldırıldı */}


        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>🚀 Hızlı İşlemler</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                  {action.title}
                </Text>
                <Text style={[styles.actionDescription, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* TeacherBottomMenu artık AppDrawer'da wrapper ile ekleniyor */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 10,
    paddingBottom: 4,
    position: 'relative',
    minHeight: 40,
  },
  menuButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  menuIcon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  brandCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  brandGradient: {
    borderRadius: 20,
    padding: 24,
  },
  brandContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: -10,
  },
  logoContainer: {
    width: 70,
    height: 70,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  brandLogo: {
    width: 75,
    height: 75,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  schoolInfo: {
    alignItems: 'center',
  },
  schoolLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  schoolLogoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  welcomeCard: {
    borderRadius: 16,
    marginBottom: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  // Summary card stilleri kaldırıldı
  section: {
    marginBottom: 30,
  },
  sectionTitleContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default HomePage;
