import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../lib/api";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentMessageSend = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useContext(SessionContext);
  const insets = useSafeAreaInsets();

  const [recipientType, setRecipientType] = useState("teacher"); // "teacher" or "admin"
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [teacherSearchText, setTeacherSearchText] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

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

  // Öğretmenleri çek
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      console.log("👨‍🏫 Öğretmenler yükleniyor...");
      
      const response = await api.post("/teacher/allteacher");
      const data = response.data;
      console.log("📊 Gelen öğretmen verisi:", data);
      
      if (data && Array.isArray(data)) {
        setTeachers(data);
        setFilteredTeachers(data);
        setTeacherSearchText("");
        console.log("✅ Öğretmenler başarıyla yüklendi:", data.length, "öğretmen");
      } else {
        console.error("❌ Öğretmen verisi beklenen formatta değil:", data);
        Alert.alert("Hata", "Öğretmen listesi alınamadı");
      }
    } catch (error) {
      console.error("❌ Öğretmenler alınamadı:", error);
      Alert.alert("Hata", "Öğretmen listesi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // Öğretmen arama fonksiyonu
  const filterTeachers = (searchText) => {
    setTeacherSearchText(searchText);
    if (!searchText.trim()) {
      setFilteredTeachers(teachers);
      return;
    }

    const filtered = teachers.filter(teacher => {
      const fullName = teacher.AdSoyad?.toLowerCase() || '';
      const searchTerm = searchText.toLowerCase().trim();
      
      return fullName.includes(searchTerm);
    });
    
    setFilteredTeachers(filtered);
  };

  // Recipient type değiştiğinde
  const handleRecipientTypeChange = (type) => {
    setRecipientType(type);
    setSelectedTeacher("");
  };

  // Mesaj gönderme
  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Hata", "Lütfen mesajınızı yazın");
      return;
    }

    if (recipientType === "teacher" && !selectedTeacher) {
      Alert.alert("Hata", "Lütfen bir öğretmen seçin");
      return;
    }

    try {
      setSending(true);
      
      // Öğrenci ID'sini al (integer olarak)
      const studentId = parseInt(studentData?.OgrenciId) || 0;
      console.log("🆔 Öğrenci ID (integer):", studentId);
      
      // Alıcı tipi ve ID'sini belirle
      const aliciTipi = recipientType === "teacher" ? "teacher" : "admin";
      const aliciID = recipientType === "teacher" ? String(selectedTeacher) : "0";
      
      const requestBody = {
        mesaj: message.trim(),
        gonderenTipi: "student",
        gonderenID: studentId,  // Integer
        aliciTipi: aliciTipi,
        AliciID: aliciID  // String
      };
      
      console.log("📤 POST isteği body verisi:", requestBody);
      console.log("🔗 API Endpoint: /user/mesaj");
      
      const response = await api.post("/user/mesaj", requestBody);
      console.log("✅ Mesaj gönderildi:", response.data);
      
      Alert.alert("Başarılı", "Mesajınız gönderildi", [
        {
          text: "Tamam",
          onPress: () => {
            setMessage("");
            setSelectedTeacher("");
            navigation.goBack();
          }
        }
      ]);
      
    } catch (error) {
      console.error("❌ Mesaj gönderilemedi:", error);
      console.error("❌ Error response:", error.response?.data);
      Alert.alert("Hata", "Mesaj gönderilemedi: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Mesaj Gönder"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
      >
        {/* Recipient Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Kime Gönderilecek?</Text>
          <View style={styles.recipientTypeContainer}>
            <TouchableOpacity
              style={[
                styles.recipientTypeButton,
                recipientType === "teacher" && { backgroundColor: theme.accent },
              ]}
              onPress={() => handleRecipientTypeChange("teacher")}
            >
              <Text style={[
                styles.recipientTypeButtonText,
                { color: recipientType === "teacher" ? theme.primary : theme.text },
              ]}>Öğretmen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recipientTypeButton,
                recipientType === "admin" && { backgroundColor: theme.accent },
              ]}
              onPress={() => handleRecipientTypeChange("admin")}
            >
              <Text style={[
                styles.recipientTypeButtonText,
                { color: recipientType === "admin" ? theme.primary : theme.text },
              ]}>Okul Yönetimi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Öğretmen Seçimi */}
        {recipientType === "teacher" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Öğretmen Seçin</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: theme.input, borderColor: theme.border }]}
              onPress={() => {
                fetchTeachers();
                setShowTeacherModal(true);
              }}
            >
              <Text style={[styles.selectButtonText, { color: selectedTeacher ? theme.text : "#9CA3AF" }]}>
                {selectedTeacher ? teachers.find(t => t.OgretmenID === selectedTeacher)?.AdSoyad : "Öğretmen seçin..."}
              </Text>
              <Text style={[styles.selectArrow, { color: theme.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Okul Yönetimi Bilgisi */}
        {recipientType === "admin" && (
          <View style={styles.section}>
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>ℹ️</Text>
              <Text style={[styles.infoText, { color: theme.text }]}>
                Mesajınız okul yönetimine gönderilecek
              </Text>
            </View>
          </View>
        )}

        {/* Mesaj Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mesajınız</Text>
          <TextInput
            style={[styles.messageInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            placeholder="Mesajınızı buraya yazın..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Gönder Butonu */}
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.accent, opacity: sending ? 0.7 : 1 }]}
          onPress={handleSendMessage}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.sendButtonText, { color: theme.primary }]}>Gönder</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Öğretmen Seçim Modal */}
      {showTeacherModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#11263A", borderColor: "rgba(230,237,243,0.08)" }]}>
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>Öğretmen Seçin</Text>
            
            {/* Arama Çubuğu */}
            <View style={[styles.searchContainer, { backgroundColor: "#1a2332", borderColor: "rgba(230,237,243,0.08)" }]}>
              <Text style={[styles.searchIcon, { color: "#7C8DA6" }]}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: "#E6EDF3" }]}
                placeholder="Öğretmen ara..."
                placeholderTextColor="#9CA3AF"
                value={teacherSearchText}
                onChangeText={filterTeachers}
              />
              {teacherSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => filterTeachers("")}
                >
                  <Text style={[styles.clearSearchButtonText, { color: "#7C8DA6" }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD60A" />
                <Text style={[styles.loadingText, { color: "#E6EDF3" }]}>Yükleniyor...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <TouchableOpacity
                      key={teacher.OgretmenID}
                      style={[
                        styles.classItem,
                        {
                          backgroundColor: selectedTeacher === teacher.OgretmenID ? "#FFD60A20" : "#11263A",
                          borderColor: "rgba(230,237,243,0.08)",
                        },
                      ]}
                      onPress={() => {
                        setSelectedTeacher(teacher.OgretmenID);
                        setShowTeacherModal(false);
                      }}
                    >
                      <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                        {teacher.AdSoyad}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: "#7C8DA6" }]}>
                      Öğretmen bulunamadı
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowTeacherModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentMessageSend" 
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  recipientTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  recipientTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  recipientTypeButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
  },
  selectArrow: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  messageInput: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: "top",
    fontSize: 16,
    minHeight: 100,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modalContent: {
    width: "70%",
    borderRadius: 12,
    padding: 20,
    maxHeight: "70%",
    borderWidth: 1,
    zIndex: 10000,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  classItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 1,
  },
  classItemText: {
    fontSize: 16,
    color: "#fff",
  },
  closeModalButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearSearchButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default StudentMessageSend;
