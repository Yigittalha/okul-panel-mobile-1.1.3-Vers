import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import api from "../../lib/api";

const HomeworkPoints = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { homework } = route.params;
  const { theme } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const insets = useSafeAreaInsets();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Sayfa yüklendiğinde öğrenci listesini çek
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      const response = await api.post("/teacher/homework/point", {
        id: homework.id,
        KayitTuru: homework.KayitTuru || 0
      });

      if (response.data && Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        Alert.alert("Hata", "Öğrenci listesi alınamadı.");
      }
    } catch (error) {
      console.log("❌ Students fetch error:", error);
      Alert.alert("Hata", "Öğrenci listesi yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePointChange = (studentId, value) => {
    setStudents(prev => 
      prev.map(student => 
        student.OgrenciId === studentId 
          ? { ...student, puan: value }
          : student
      )
    );
  };

  const handleSelectOption = (option) => {
    if (selectedStudentId) {
      let pointValue;
      switch (option) {
        case "Yaptı":
          pointValue = "100";
          break;
        case "Yarım Yaptı":
          pointValue = "50";
          break;
        case "Yapmadı":
          pointValue = "0";
          break;
        default:
          pointValue = "";
      }
      
      handlePointChange(selectedStudentId, pointValue);
      setShowSelectModal(false);
      setSelectedStudentId(null);
    }
  };

  const openSelectModal = (studentId) => {
    setSelectedStudentId(studentId);
    setShowSelectModal(true);
  };

  const handleSave = async (student) => {
    try {
      setSaving(prev => ({ ...prev, [student.OgrenciId]: true }));

      // Puan kontrolü
      if (!student.puan || student.puan.trim() === "") {
        Alert.alert("Hata", "Lütfen puan girin.");
        return;
      }

      // Console'a bilgileri yazdır
      console.log("📊 Saving points for student:", {
        odevID: student.id,
        puan: student.puan,
        OgrenciID: student.OgrenciId
      });

      // API çağrısı
      const response = await api.post("/teacher/homework/pointadd", {
        odevID: student.id,
        puan: student.puan,
        OgrenciID: student.OgrenciId
      });

      if (response.status === 200) {
        console.log("✅ Points saved successfully");
        Alert.alert("Başarılı", `${student.AdSoyad} için puan kaydedildi.`);
      } else {
        Alert.alert("Hata", "Puan kaydedilemedi.");
      }
    } catch (error) {
      console.log("❌ Save points error:", error);
      Alert.alert("Hata", "Puan kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(prev => ({ ...prev, [student.OgrenciId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FeaturePageHeader 
          title="Puan Verme" 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Öğrenci listesi yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Puan Verme" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Homework Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.homeworkTitle, { color: theme.text }]}>
            📖 {homework.DersAdi}
          </Text>
          <Text style={[styles.homeworkTopic, { color: "#9CA3AF" }]}>
            📝 {homework.Konu}
          </Text>
          <Text style={[styles.homeworkDate, { color: "#9CA3AF" }]}>
            📅 Teslim: {formatDate(homework.TeslimTarihi)}
          </Text>
        </View>

        {/* Students List */}
        <View style={[styles.studentsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            👥 Öğrenci Listesi
          </Text>

          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Bu ödev için öğrenci bulunamadı.
              </Text>
            </View>
          ) : (
            students.map((student, index) => (
              <View
                key={student.OgrenciId}
                style={[
                  styles.studentItem,
                  { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }
                ]}
              >
                {/* Öğrenci Numarası - Üst */}
                <View style={styles.studentNumberContainer}>
                  <Text style={[styles.studentNumber, { color: "#9CA3AF" }]}>
                    No: {student.OgrenciNumara}
                  </Text>
                </View>

                {/* Öğrenci Adı - Ortada */}
                <View style={styles.studentNameContainer}>
                  <Text style={[styles.studentName, { color: theme.text }]}>
                    {student.AdSoyad}
                  </Text>
                </View>

                {/* Puan Verme Butonları - Alt */}
                <View style={styles.pointsSection}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => openSelectModal(student.OgrenciId)}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      { color: student.puan ? theme.text : "#9CA3AF" }
                    ]}>
                      {student.puan === "100" ? "Yaptı" : 
                       student.puan === "50" ? "Yarım Yaptı" : 
                       student.puan === "0" ? "Yapmadı" : "Seçiniz"}
                    </Text>
                    <Text style={[styles.dropdownIcon, { color: theme.muted }]}>▼</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor: theme.accent,
                        opacity: saving[student.OgrenciId] ? 0.6 : 1,
                      }
                    ]}
                    onPress={() => handleSave(student)}
                    disabled={saving[student.OgrenciId]}
                  >
                    {saving[student.OgrenciId] ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.saveButtonText, { color: "#fff" }]}>
                        Kaydet
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Select Modal */}
      <Modal
        visible={showSelectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSelectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#11263A", borderColor: "rgba(230,237,243,0.08)" }]}>
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>
              Ödev Durumu Seçin
            </Text>
            
            <TouchableOpacity
              style={[styles.optionButton, { 
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }]}
              onPress={() => handleSelectOption("Yaptı")}
            >
              <Text style={[styles.optionText, { color: "#E6EDF3" }]}>Yaptı</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, { 
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }]}
              onPress={() => handleSelectOption("Yarım Yaptı")}
            >
              <Text style={[styles.optionText, { color: "#E6EDF3" }]}>Yarım Yaptı</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, { 
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }]}
              onPress={() => handleSelectOption("Yapmadı")}
            >
              <Text style={[styles.optionText, { color: "#E6EDF3" }]}>Yapmadı</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowSelectModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  homeworkTopic: {
    fontSize: 16,
    marginBottom: 4,
  },
  homeworkDate: {
    fontSize: 14,
  },
  studentsCard: {
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  studentItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  studentNumberContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  studentNameContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  studentName: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flexWrap: "wrap",
    numberOfLines: 2,
  },
  studentNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  pointsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 120,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 999,
  },
  modalContent: {
    width: "70%",
    borderRadius: 12,
    padding: 20,
    maxHeight: "70%",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  optionButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 1,
  },
  optionText: {
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
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HomeworkPoints;
