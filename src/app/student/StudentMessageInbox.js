import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../lib/api";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentMessageInbox = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, isAuthenticated, loading: sessionLoading } = useContext(SessionContext);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all", "teacher", "admin"
  const [showMessageDetails, setShowMessageDetails] = useState(new Set());

  // Öğrenci verilerini al
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        console.log("🔍 Öğrenci verisi alınıyor...");
        const response = await api.post("/user/info");
        const data = response.data;
        console.log("👤 Öğrenci verisi:", data);
        setStudentData(data);
      } catch (error) {
        console.error("❌ Öğrenci verisi alınamadı:", error);
        Alert.alert("Hata", "Öğrenci bilgileri alınamadı");
      }
    };
    fetchStudentData();
  }, []);

  // Mesajları çek
  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log("📨 Mesajlar yükleniyor...");
      
      // Öğrenci ID'sini ve sınıf bilgisini al
      const studentId = studentData?.OgrenciId?.toString() || "0";
      const sinif = studentData?.Sinif || "5-A";
      
      console.log("🆔 Öğrenci ID:", studentId);
      console.log("🏫 Sınıf:", sinif);
      
      const requestBody = {
        id: studentId,
        Sinif: sinif
      };
      
      console.log("📤 POST isteği body verisi:", requestBody);
      console.log("🔗 API Endpoint: /student/mesajget");
      
      const response = await api.post("/student/mesajget", requestBody);
      
      const data = response.data;
      console.log("📊 Gelen mesaj verisi:", data);
      
      if (data && Array.isArray(data)) {
        // Tarihe göre sırala (en yeni en üstte)
        const sortedMessages = data.sort((a, b) => {
          return new Date(b.tarih) - new Date(a.tarih);
        });
        
        setMessages(sortedMessages);
        setFilteredMessages(sortedMessages);
        console.log("✅ Mesajlar başarıyla yüklendi:", sortedMessages.length, "mesaj");
      } else {
        console.error("❌ Mesaj verisi beklenen formatta değil:", data);
        Alert.alert("Hata", "Mesaj listesi alınamadı");
      }
    } catch (error) {
      console.error("❌ Mesajlar alınamadı:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      Alert.alert("Hata", "Mesaj listesi alınamadı: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return "Dün";
      } else if (diffDays < 7) {
        return `${diffDays} gün önce`;
      } else {
        return date.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch (error) {
      return "Tarih bilinmiyor";
    }
  };

  // Saat formatla
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  };

  // Mesajları filtrele
  const filterMessages = (type) => {
    setFilterType(type);
    if (type === "all") {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message => message.gonderenTipi === type);
      setFilteredMessages(filtered);
    }
  };

  // Mesaj detaylarını göster/gizle
  const toggleMessageDetails = (index) => {
    const newShowDetails = new Set(showMessageDetails);
    if (newShowDetails.has(index)) {
      newShowDetails.delete(index);
    } else {
      newShowDetails.add(index);
    }
    setShowMessageDetails(newShowDetails);
  };

  // Mesaj uzun mu kontrol et (2 satırdan fazla)
  const isMessageLong = (message) => {
    // Yaklaşık 2 satır = 80 karakter (40 karakter/satır)
    return message.mesaj.length > 80;
  };

  useEffect(() => {
    // Session yüklenene kadar bekle, ama çok katı olma
    if (!sessionLoading && studentData) {
      fetchMessages();
    }
  }, [sessionLoading, studentData]);

  if (sessionLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top + 10, 35),
          }
        ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Gelen Kutusu</Text>
          <View style={{ width: 24, height: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Oturum yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top + 10, 35),
          }
        ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Gelen Kutusu</Text>
          <View style={{ width: 24, height: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Mesajlar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Gelen Kutusu"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
      >
        {/* Filtreleme Butonları */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "all" && { backgroundColor: theme.accent },
            ]}
            onPress={() => filterMessages("all")}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filterType === "all" ? theme.primary : theme.text },
            ]}>Tümü</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "teacher" && { backgroundColor: theme.accent },
            ]}
            onPress={() => filterMessages("teacher")}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filterType === "teacher" ? theme.primary : theme.text },
            ]}>Öğretmenler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "admin" && { backgroundColor: theme.accent },
            ]}
            onPress={() => filterMessages("admin")}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filterType === "admin" ? theme.primary : theme.text },
            ]}>Yönetim</Text>
          </TouchableOpacity>
        </View>

        {filteredMessages.length > 0 ? (
          filteredMessages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {isMessageLong(message) && !showMessageDetails.has(index) ? (
                /* Uzun Mesaj - Kapalı Kart */
                <TouchableOpacity
                  style={styles.messageSummary}
                  onPress={() => toggleMessageDetails(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.summaryContent}>
                    <View style={styles.senderInfo}>
                      <View style={[styles.senderAvatar, { backgroundColor: theme.accent + '20' }]}>
                        <Text style={[styles.senderAvatarText, { color: theme.accent }]}>
                          {message.AdSoyad?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.senderDetails}>
                        <Text style={[styles.senderName, { color: theme.text }]}>
                          {message.AdSoyad}
                        </Text>
                        <Text style={[styles.senderType, { color: "#9CA3AF" }]}>
                          {message.gonderenTipi === "teacher" ? "Öğretmen" : "Okul Yönetimi"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.messageTime}>
                      <Text style={[styles.timeText, { color: "#9CA3AF" }]}>
                        {formatTime(message.tarih)}
                      </Text>
                      <Text style={[styles.dateText, { color: "#9CA3AF" }]}>
                        {formatDate(message.tarih)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.messagePreviewContainer}>
                    <Text style={[styles.messagePreviewText, { color: "#9CA3AF" }]}>
                      {message.mesaj.substring(0, 80) + "..."}
                    </Text>
                    <View style={styles.readMoreContainer}>
                      <Text style={[styles.readMoreText, { color: "#9CA3AF" }]}>
                        Devamını Oku
                      </Text>
                      <Text style={[styles.readMoreArrow, { color: "#9CA3AF" }]}>▼</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                /* Kısa Mesaj veya Açık Uzun Mesaj - Tam Görünüm */
                <View>
                  {/* Gönderen Bilgisi */}
                  <View style={styles.messageHeader}>
                    <View style={styles.senderInfo}>
                      <View style={[styles.senderAvatar, { backgroundColor: theme.accent + '20' }]}>
                        <Text style={[styles.senderAvatarText, { color: theme.accent }]}>
                          {message.AdSoyad?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.senderDetails}>
                        <Text style={[styles.senderName, { color: theme.text }]}>
                          {message.AdSoyad}
                        </Text>
                        <Text style={[styles.senderType, { color: "#9CA3AF" }]}>
                          {message.gonderenTipi === "teacher" ? "Öğretmen" : "Okul Yönetimi"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.messageTime}>
                      <Text style={[styles.timeText, { color: "#9CA3AF" }]}>
                        {formatTime(message.tarih)}
                      </Text>
                      <Text style={[styles.dateText, { color: "#9CA3AF" }]}>
                        {formatDate(message.tarih)}
                      </Text>
                    </View>
                  </View>

                  {/* Mesaj İçeriği */}
                  <View style={styles.messageContent}>
                    <Text style={[styles.messageText, { color: theme.text }]}>
                      {message.mesaj}
                    </Text>
                  </View>

                  {/* Mesaj Tipi Badge */}
                  <View style={styles.messageTypeContainer}>
                    <View style={[
                      styles.messageTypeBadge,
                      {
                        backgroundColor: message.gonderenTipi === "teacher" 
                          ? theme.accent + '20' 
                          : theme.textSecondary + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.messageTypeText,
                        {
                          color: "#9CA3AF"
                        }
                      ]}>
                        {message.gonderenTipi === "teacher" ? "Öğretmen" : "Yönetim"}
                      </Text>
                    </View>
                  </View>

                  {/* Uzun mesajlarda kapat butonu */}
                  {isMessageLong(message) && (
                    <TouchableOpacity
                      style={styles.closeMessageButton}
                      onPress={() => toggleMessageDetails(index)}
                    >
                      <Text style={[styles.closeMessageText, { color: "#9CA3AF" }]}>
                        Kapat ▲
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateIcon, { color: "#9CA3AF" }]}>📭</Text>
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              Henüz mesaj yok
            </Text>
            <Text style={[styles.emptyStateText, { color: "#9CA3AF" }]}>
              Size gelen mesajlar burada görünecek
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentMessageInbox" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  messageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  senderAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  senderType: {
    fontSize: 14,
  },
  messageTime: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  messageContent: {
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTypeContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  messageTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageTypeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  messageSummary: {
    padding: 16,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  messagePreviewContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  messagePreviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: "italic",
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  readMoreArrow: {
    fontSize: 12,
  },
  closeMessageButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  closeMessageText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default StudentMessageInbox;
