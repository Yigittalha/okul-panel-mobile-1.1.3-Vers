import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import api, { fetchUserInfo } from "../../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";
// ThemeToggle sadece ParentDashboard'da gösterilecek

export default function StudentScheduleScreen() {
  const { theme } = useTheme();
  const { session } = useContext(SessionContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null); // Açılan gün
  const mountedRef = useRef(true);

  useEffect(() => {
    fetchSchedule();
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSchedule = async () => {
    try {
      // Kullanıcı bilgilerini /user/info API'sinden al
      const userInfo = await fetchUserInfo(true);
      console.log("🔍 Kullanıcı bilgileri:", userInfo);
      
      if (!userInfo || !userInfo.Sinif) {
        console.log("⚠️ Sınıf bilgisi bulunamadı!");
        setError("Sınıf bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const sinif = userInfo.Sinif;
      console.log("🔍 Bulunan sınıf:", sinif);

      console.log("📡 Ders programı API çağrısı yapılıyor:", `/schedule/get`, { Sinif: sinif });
      const response = await api.post("/schedule/get", { Sinif: sinif });
      console.log("✅ Schedule API yanıtı:", response);
      
      if (mountedRef.current && response?.data) {
        const grouped = groupByDay(response.data);
        setSchedule(grouped);
        setError(null);
        console.log("📋 Gruplandırılmış veri:", grouped);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("❌ Schedule fetch error:", err);
        setError("Ders programı yüklenemedi");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  const groupByDay = (data) => {
    const dayOrder = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
    const grouped = {};
    
    data.forEach(item => {
      if (!grouped[item.Gun]) grouped[item.Gun] = [];
      grouped[item.Gun].push(item);
    });

    const startMinutes = (s) => { 
      const [h,m] = s.split("-")[0].split(":").map(Number); 
      return h*60+m; 
    };

    return dayOrder
      .filter(gun => grouped[gun])
      .map(gun => ({
        title: gun,
        data: grouped[gun].sort((a, b) => startMinutes(a.DersSaati) - startMinutes(b.DersSaati))
      }));
  };

  // Günler listesi - filtreleme için
  const daysList = schedule.map(day => ({
    day: day.title,
    count: day.data.length,
    data: day.data
  }));

  const renderDayItem = ({ item }) => {
    const isExpanded = expandedDay === item.day;
    
    return (
      <View>
        <TouchableOpacity
          style={[styles.dayCard, { backgroundColor: theme.card }]}
          onPress={() => {
            setExpandedDay(isExpanded ? null : item.day);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.dayIconContainer, { backgroundColor: theme.accent }]}>
            <Text style={styles.dayIcon}>{getDayIcon(item.day)}</Text>
          </View>
          <View style={styles.dayContent}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{item.day}</Text>
            <Text style={[styles.dayCount, { color: "#9CA3AF" }]}>
              {item.count} ders
            </Text>
          </View>
          <Text style={[styles.chevronIcon, { color: "#9CA3AF" }]}>
            {isExpanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>
        
        {/* Açılan günün dersleri */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.data.map((lesson, index) => (
              <View key={index} style={[styles.lessonCard, { backgroundColor: theme.card }]}>
                <View style={styles.cardContent}>
                  <View style={styles.timeContainer}>
                    <View style={[styles.timeBadge, { backgroundColor: theme.accent + '15' }]}>
                      <Text style={[styles.timeText, { color: theme.accent }]}>🕐</Text>
                      <Text style={[styles.timeValue, { color: theme.accent }]}>{lesson.DersSaati}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <Text style={[styles.lessonTitle, { color: theme.text }]}>{lesson.Ders}</Text>
                    
                    <View style={styles.detailsRow}>
                      <View style={styles.teacherContainer}>
                        <Text style={[styles.teacherIcon, { color: "#9CA3AF" }]}>👨‍🏫</Text>
                        <Text style={[styles.teacherName, { color: "#9CA3AF" }]}>{lesson.AdSoyad}</Text>
                      </View>
                      
                      <View style={[styles.roomBadge, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.roomIcon, { color: "#1F2937" }]}>📍</Text>
                        <Text style={[styles.roomText, { color: "#1F2937" }]}>{lesson.Derslik}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.cardAccent, { backgroundColor: theme.accent }]} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.lessonCard, { backgroundColor: theme.card }]}>
      <View style={styles.cardContent}>
        <View style={styles.timeContainer}>
          <View style={[styles.timeBadge, { backgroundColor: theme.accent + '15' }]}>
            <Text style={[styles.timeText, { color: theme.accent }]}>🕐</Text>
            <Text style={[styles.timeValue, { color: theme.accent }]}>{item.DersSaati}</Text>
          </View>
        </View>
        
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonTitle, { color: theme.text }]}>{item.Ders}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.teacherContainer}>
              <Text style={[styles.teacherIcon, { color: "#9CA3AF" }]}>👨‍🏫</Text>
              <Text style={[styles.teacherName, { color: "#9CA3AF" }]}>{item.AdSoyad}</Text>
            </View>
            
            <View style={[styles.roomBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.roomIcon, { color: "#1F2937" }]}>📍</Text>
              <Text style={[styles.roomText, { color: "#1F2937" }]}>{item.Derslik}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={[styles.cardAccent, { backgroundColor: theme.accent }]} />
    </View>
  );

  const getDayIcon = (day) => {
    const icons = {
      "Pazartesi": "📅",
      "Salı": "📋",
      "Çarşamba": "📊",
      "Perşembe": "📚",
      "Cuma": "🎯",
      "Cumartesi": "🌟",
      "Pazar": "☀️"
    };
    return icons[day] || "📅";
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.dayHeader, { backgroundColor: theme.card }]}>
      <View style={styles.dayHeaderContent}>
        <View style={[styles.dayIconContainer, { backgroundColor: theme.accent }]}>
          <Text style={styles.dayIcon}>{getDayIcon(title)}</Text>
        </View>
        <Text style={[styles.dayTitle, { color: theme.text }]}>{title}</Text>
        <View style={[styles.dayDivider, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );

  const renderNavbar = () => (
    <FeaturePageHeader
      title="Ders Programı"
      onBackPress={() => navigation.goBack()}
    />
  );

  if (loading) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderNavbar()}
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Ders programı yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderNavbar()}
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { borderColor: theme.accent }]} onPress={fetchSchedule}>
            <Text style={[styles.retryText, { color: theme.accent }]}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (schedule.length === 0) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderNavbar()}
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.emptyText, { color: theme.text }]}>Bu sınıf için program bulunamadı</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {renderNavbar()}
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FlatList
          data={daysList}
          keyExtractor={(item) => item.day}
          renderItem={renderDayItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent}
              progressBackgroundColor={theme.card}
            />
          }
        />
      </View>
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentScheduleScreen" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Container Styles
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  // Navbar Styles
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  navbarRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  
  // Lesson Card Styles (Shadow Removed)
  lessonCard: {
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  
  // Time Container Styles
  timeContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  timeText: {
    fontSize: 16,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Lesson Info Styles
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  
  // Teacher Styles
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  teacherIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  
  // Room Badge Styles
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },
  roomIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  roomText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Day Header Styles (Shadow Removed)
  dayHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  dayHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayIcon: {
    fontSize: 18,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayDivider: {
    flex: 1,
    height: 1,
    marginLeft: 12,
    opacity: 0.3,
  },
  
  // Loading and Error Styles
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: '500',
  },
  retryButton: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 32,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: '500',
  },
  
  // Gün kartı stilleri - mevcut tasarımı koruyarak
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  dayContent: {
    flex: 1,
    marginLeft: 12,
  },
  dayCount: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  chevronIcon: {
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Açılan içerik stilleri
  expandedContent: {
    marginTop: 8,
    marginBottom: 8,
  },
});
