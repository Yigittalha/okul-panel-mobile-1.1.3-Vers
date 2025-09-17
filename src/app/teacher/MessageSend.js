import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchUserInfo, fetchAllStudents } from "../../lib/api";
import api from "../../lib/api";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const MessageSend = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const insets = useSafeAreaInsets();
  const { schoolCode } = useContext(SessionContext);

  // State'ler
  const [recipientType, setRecipientType] = useState(""); // "student" veya "class"
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentSearchText, setStudentSearchText] = useState("");
  const [classes, setClasses] = useState([]);
  const [teacherData, setTeacherData] = useState(null);

  // Modal state'leri
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  // Öğretmen bilgilerini çek
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const data = await fetchUserInfo(true);
        if (data) {
          setTeacherData(data);
        }
      } catch (error) {
        console.error("Öğretmen bilgileri alınamadı:", error);
      }
    };
    fetchTeacherData();
  }, []);

  // Öğrencileri çek
  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log("🔄 Öğrenciler yükleniyor...");
      const data = await fetchAllStudents();
      console.log("📊 Gelen öğrenci verisi:", data);
      if (data && Array.isArray(data)) {
        setStudents(data);
        setFilteredStudents(data);
        setStudentSearchText("");
        console.log("✅ Öğrenciler başarıyla yüklendi:", data.length, "öğrenci");
      } else {
        console.error("❌ Öğrenci verisi beklenen formatta değil:", data);
        Alert.alert("Hata", "Öğrenci listesi alınamadı");
      }
    } catch (error) {
      console.error("❌ Öğrenciler alınamadı:", error);
      Alert.alert("Hata", "Öğrenci listesi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // Öğrenci arama fonksiyonu
  const filterStudents = (searchText) => {
    setStudentSearchText(searchText);
    if (!searchText.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const fullName = student.AdSoyad?.toLowerCase() || '';
      const studentNumber = student.OgrenciNumara?.toString() || '';
      const searchTerm = searchText.toLowerCase().trim();
      
      return fullName.includes(searchTerm) || studentNumber.includes(searchTerm);
    });
    
    setFilteredStudents(filtered);
  };

  // Sınıfları çek
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.post("/student/classall");
      const data = response.data;
      
      if (data && Array.isArray(data)) {
        // Sadece SinifAdi'ları al
        const classNames = data.map(item => item.SinifAdi);
        setClasses(classNames);
        console.log("📚 Sınıflar alındı:", classNames);
      } else {
        console.error("❌ Sınıf verisi beklenen formatta değil:", data);
        Alert.alert("Hata", "Sınıf listesi alınamadı");
      }
    } catch (error) {
      console.error("❌ Sınıflar alınamadı:", error);
      console.error("❌ Error response:", error.response?.data);
      Alert.alert("Hata", "Sınıf listesi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // Recipient type değiştiğinde
  const handleRecipientTypeChange = (type) => {
    setRecipientType(type);
    setSelectedStudent("");
    setSelectedClass("");
  };

  // Mesaj gönderme
  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Hata", "Lütfen mesaj yazın");
      return;
    }

    if (!recipientType) {
      Alert.alert("Hata", "Lütfen alıcı tipini seçin");
      return;
    }

    if (recipientType === "student" && !selectedStudent) {
      Alert.alert("Hata", "Lütfen bir öğrenci seçin");
      return;
    }

    if (recipientType === "class" && !selectedClass) {
      Alert.alert("Hata", "Lütfen bir sınıf seçin");
      return;
    }

    if (!teacherData) {
      Alert.alert("Hata", "Öğretmen bilgileri alınamadı");
      return;
    }

    try {
      setSending(true);

      const body = {
        mesaj: message.trim(),
        gonderenTipi: "teacher",
        gonderenID: teacherData.OgretmenID,
        aliciTipi: recipientType === "student" ? "student" : "Sinif",
        AliciID: String(recipientType === "student" ? selectedStudent : selectedClass),
      };

      console.log("📤 Mesaj gönderiliyor:");
      console.log("📤 Body verisi:", JSON.stringify(body, null, 2));
      console.log("📤 Teacher Data:", teacherData);
      console.log("📤 Recipient Type:", recipientType);
      console.log("📤 Selected Student:", selectedStudent);
      console.log("📤 Selected Class:", selectedClass);

      const response = await api.post("/user/mesaj", body);

      if (response.data) {
        Alert.alert("Başarılı", "Mesaj başarıyla gönderildi");
        setMessage("");
        setRecipientType("");
        setSelectedStudent("");
        setSelectedClass("");
      } else {
        Alert.alert("Hata", "Mesaj gönderilemedi");
      }
    } catch (error) {
      console.error("❌ Mesaj gönderme hatası:");
      console.error("❌ Error:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Body gönderilen:", body);
      
      Alert.alert("Hata", `Mesaj gönderilirken hata oluştu: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Mesaj Gönder" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Alıcı Tipi Seçimi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Alıcı Tipi</Text>
          <View style={styles.recipientTypeContainer}>
            <TouchableOpacity
              style={[
                styles.recipientTypeButton,
                {
                  backgroundColor: recipientType === "student" ? theme.accent : theme.input,
                  borderColor: recipientType === "student" ? theme.accent : theme.border,
                },
              ]}
              onPress={() => handleRecipientTypeChange("student")}
            >
              <Text style={[
                styles.recipientTypeText,
                { color: recipientType === "student" ? theme.primary : theme.text }
              ]}>
                Öğrenciye
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.recipientTypeButton,
                {
                  backgroundColor: recipientType === "class" ? theme.accent : theme.input,
                  borderColor: recipientType === "class" ? theme.accent : theme.border,
                },
              ]}
              onPress={() => handleRecipientTypeChange("class")}
            >
              <Text style={[
                styles.recipientTypeText,
                { color: recipientType === "class" ? theme.primary : theme.text }
              ]}>
                Sınıfa
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Öğrenci Seçimi */}
        {recipientType === "student" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Öğrenci Seçin</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: theme.input, borderColor: theme.border }]}
              onPress={() => {
                console.log("🎯 Öğrenci seçim modalı açılıyor...");
                fetchStudents();
                setShowStudentModal(true);
              }}
            >
              <Text style={[styles.selectButtonText, { color: selectedStudent ? theme.text : theme.textSecondary }]}>
                {selectedStudent ? students.find(s => s.OgrenciId === selectedStudent)?.AdSoyad : "Öğrenci seçin..."}
              </Text>
              <Text style={[styles.selectArrow, { color: theme.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sınıf Seçimi */}
        {recipientType === "class" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sınıf Seçin</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: theme.input, borderColor: theme.border }]}
              onPress={() => {
                fetchClasses();
                setShowClassModal(true);
              }}
            >
              <Text style={[styles.selectButtonText, { color: selectedClass ? theme.text : theme.textSecondary }]}>
                {selectedClass || "Sınıf seçin..."}
              </Text>
              <Text style={[styles.selectArrow, { color: theme.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mesaj Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mesaj</Text>
          <TextInput
            style={[
              styles.messageInput,
              { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }
            ]}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Gönder Butonu */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.accent,
              opacity: sending ? 0.6 : 1,
            },
          ]}
          onPress={handleSendMessage}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.sendButtonText, { color: theme.primary }]}>
              Gönder
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Öğrenci Seçim Modal */}
      {showStudentModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#11263A", borderColor: "rgba(230,237,243,0.08)" }]}>
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>Öğrenci Seçin</Text>
            {console.log("🔍 Modal render ediliyor - Öğrenci sayısı:", filteredStudents.length)}
            
            {/* Arama Çubuğu */}
            <View style={[styles.searchContainer, { backgroundColor: "#1a2332", borderColor: "rgba(230,237,243,0.08)" }]}>
              <Text style={[styles.searchIcon, { color: "#7C8DA6" }]}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: "#E6EDF3" }]}
                placeholder="Öğrenci ara..."
                placeholderTextColor="#9CA3AF"
                value={studentSearchText}
                onChangeText={filterStudents}
              />
              {studentSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => filterStudents("")}
                >
                  <Text style={[styles.clearSearchButtonText, { color: "#7C8DA6" }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Öğrenci Listesi */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD60A" />
                <Text style={[styles.loadingText, { color: "#E6EDF3" }]}>Yükleniyor...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TouchableOpacity
                      key={student.OgrenciId}
                      style={[
                        styles.classItem,
                        {
                          backgroundColor: selectedStudent === student.OgrenciId ? "#FFD60A20" : "#11263A",
                          borderColor: "rgba(230,237,243,0.08)",
                        },
                      ]}
                      onPress={() => {
                        setSelectedStudent(student.OgrenciId);
                        setShowStudentModal(false);
                      }}
                    >
                      <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                        {student.OgrenciNumara} • {student.AdSoyad}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: "#7C8DA6" }]}>
                      {studentSearchText ? 'Arama sonucu bulunamadı' : 'Öğrenci bulunamadı'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowStudentModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sınıf Seçim Modal */}
      {showClassModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#11263A", borderColor: "rgba(230,237,243,0.08)" }]}>
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>Sınıf Seçin</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD60A" />
                <Text style={[styles.loadingText, { color: "#E6EDF3" }]}>Yükleniyor...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {classes.map((classItem, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.classItem,
                      {
                        backgroundColor: selectedClass === classItem ? "#FFD60A20" : "#11263A",
                        borderColor: "rgba(230,237,243,0.08)",
                      },
                    ]}
                    onPress={() => {
                      setSelectedClass(classItem);
                      setShowClassModal(false);
                    }}
                  >
                    <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                      {classItem}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowClassModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    zIndex: 15,
    elevation: 3,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
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
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  recipientTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 14,
    flex: 1,
  },
  selectArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  messageInput: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
  },
  sendButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
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
  modalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseIconText: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  clearSearchButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  studentItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  studentItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  studentAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 14,
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIconText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
  },
  modalFooterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default MessageSend;
