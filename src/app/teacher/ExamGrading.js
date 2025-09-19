import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import api, { saveStudentGrade } from "../../lib/api";

const ExamGrading = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const { clearSession } = useContext(SessionContext);

  // Route parametrelerinden sınav bilgilerini al
  const { examId, examTitle } = route.params;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState(null);

  // Sayfa yükleme ve öğrenci listesi çekme
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching students for exam ID:", examId);

      const response = await api.post("/teacher/point", {
        id: examId,
      });

      console.log("📡 Students API Response received:", response.status);
      if (response?.data) {
        console.log("✅ Students fetched successfully!");
        console.log("📋 Found", response.data.length, "students");
        setStudents(response.data);
      } else {
        console.log("⚠️ No student data returned");
        setStudents([]);
      }
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      Alert.alert(
        "Hata",
        "Öğrenci listesi yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.",
        [{ text: "Tamam", onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, grade) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.OgrenciId === studentId
          ? { ...student, puan: grade }
          : student
      )
    );
  };

  const handleSaveGrade = async (student) => {
    try {
      setSavingStudentId(student.OgrenciId);
      
      // Puan validasyonu
      const grade = student.puan;
      if (!grade || grade.trim() === "") {
        Alert.alert("Uyarı", "Lütfen geçerli bir puan girin.");
        return;
      }

      const numericGrade = parseFloat(grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
        Alert.alert("Uyarı", "Puan 0-100 arasında bir sayı olmalıdır.");
        return;
      }

      console.log("💾 Saving grade for student:", student.OgrenciId, "Grade:", numericGrade);

      // Puan kaydetme API'si çağrısı
      // API parametreleri: puan, OgrenciId, SinavId (student.id sınav ID'si)
      await saveStudentGrade(numericGrade, student.OgrenciId, student.id, true);
      
      Alert.alert("Başarılı", `${student.AdSoyad} için puan kaydedildi!`);
      
    } catch (error) {
      console.error("❌ Error saving grade:", error);
      Alert.alert("Hata", error.message || "Puan kaydedilirken bir sorun oluştu.");
    } finally {
      setSavingStudentId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={isDark ? "#0D1B2A" : "#f8f9fa"} 
        />
        
        {/* Header - Özel padding ile */}
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color="#1E293B" 
              />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              Not Verme
            </Text>
          </View>
        </View>
        
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#FFD60A" />
          <Text style={[styles.loadingText, { color: theme.text, marginTop: 16 }]}>
            Öğrenci listesi yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#0D1B2A" : "#f8f9fa"} 
      />
      
      {/* Header - Özel padding ile */}
      <View style={styles.customHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color="#1E293B" 
            />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            Not Verme
          </Text>
        </View>
      </View>

      {/* Exam Info Card */}
      <View style={[styles.examInfoCard, { 
        backgroundColor: isDark ? "#FFD60A" : "#0D1B2A"
      }]}>
        <Text style={[styles.examInfoTitle, { 
          color: isDark ? "#0D1B2A" : "#FFD60A" 
        }]}>
          {examTitle}
        </Text>
        <Text style={[styles.examInfoSubtitle, { 
          color: isDark ? "#0D1B2A" : "#FFD60A" 
        }]}>
          Toplam {students.length} öğrenci
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { 
              color: isDark ? "#999" : "#666" 
            }]}>
              Bu sınav için öğrenci bulunamadı.
            </Text>
          </View>
        ) : (
          students.map((student) => (
            <View key={student.OgrenciId} style={[styles.studentCard, { 
              backgroundColor: theme.card,
              borderColor: isDark ? "rgba(255, 214, 10, 0.2)" : "#e9ecef"
            }]}>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { 
                  color: isDark ? "#E6EDF3" : "#333" 
                }]}>
                  {student.AdSoyad}
                </Text>
                <Text style={[styles.studentNumber, { 
                  color: isDark ? "#7C8DA6" : "#666" 
                }]}>
                  Öğrenci No: {student.OgrenciNumara}
                </Text>
              </View>
              
              <View style={styles.gradeSection}>
                <TextInput
                  style={[
                    styles.gradeInput,
                    {
                      borderColor: isDark ? "rgba(255, 214, 10, 0.3)" : "#ddd",
                      color: isDark ? "#E6EDF3" : "#333",
                      backgroundColor: isDark ? "rgba(255, 214, 10, 0.1)" : "#f9f9f9",
                    },
                  ]}
                  value={student.puan?.toString() || ""}
                  onChangeText={(text) => handleGradeChange(student.OgrenciId, text)}
                  placeholder="Puan"
                  placeholderTextColor={isDark ? "#7C8DA6" : "#999"}
                  keyboardType="numeric"
                  maxLength={3}
                />
                
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: "#FFD60A",
                      opacity: savingStudentId === student.OgrenciId ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => handleSaveGrade(student)}
                  disabled={savingStudentId === student.OgrenciId}
                >
                  {savingStudentId === student.OgrenciId ? (
                    <ActivityIndicator size="small" color="#0D1B2A" />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: "#0D1B2A" }]}>
                      Kaydet
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    paddingTop: 8,   // ← Daha az boşluk
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    color: '#1E293B',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  navbarTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  examInfoCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  examInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  examInfoSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  studentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 14,
  },
  gradeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gradeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    textAlign: "center",
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ExamGrading;
