import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { addExam, fetchAllClasses, fetchUserInfo, fetchSubjects } from "../../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const ExamAdd = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const { clearSession } = useContext(SessionContext);
  const insets = useSafeAreaInsets();

  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [examData, setExamData] = useState({
    Tarih: new Date(),
    SinavSuresi: "",
    Ders: "",
    Puan: "",
    Sinif: "",
    SinavAdi: "",
    Aciklama: "",
    OgretmenID: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [sinif, setSinif] = useState(""); // Controlled value for class selection
  
  // Ders seçimi için state'ler
  const [subjects, setSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(""); // Controlled value for subject selection

  // Screen dimensions for responsive dropdown
  const { height } = Dimensions.get("window");
  const MAX_DROPDOWN_HEIGHT = Math.floor(height * 0.5);

  // Sayfa yükleme ve veri çekme
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);

        // Kullanıcı bilgilerini çek
        const userInfo = await fetchUserInfo(true);

        if (!userInfo || !userInfo.OgretmenID) {
          Alert.alert(
            "Hata",
            "Öğretmen bilgileri alınamadı. Lütfen tekrar giriş yapın.",
            [{ text: "Tamam", onPress: () => clearSession() }],
          );
          return;
        }

        setUserData(userInfo);

        // Sınıf listesini çek
        const classes = await fetchAllClasses(true);
        setClassList(classes);

        // Ders listesini çek
        const subjectsData = await fetchSubjects(true);
        setSubjects(subjectsData);

        // İlk sınıfı varsayılan olarak seç (opsiyonel)
        if (classes.length > 0) {
          setExamData((prev) => ({
            ...prev,
            Sinif: classes[0].SinifAdi,
            OgretmenID: userInfo.OgretmenID,
          }));
          setSinif(classes[0].SinifAdi); // Update controlled state
        }
      } catch (error) {
        console.error("Sayfa verileri yüklenirken hata:", error);
        Alert.alert(
          "Hata",
          "Sayfa verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.",
          [{ text: "Tamam", onPress: () => navigation.goBack() }],
        );
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, []);

  const handleInputChange = (key, value) => {
    setExamData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || examData.Tarih;
    setShowDatePicker(Platform.OS === "ios");
    setExamData((prev) => ({
      ...prev,
      Tarih: currentDate,
    }));
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handleSelectClass = (selectedClass) => {
    setExamData((prev) => ({ ...prev, Sinif: selectedClass }));
    setSinif(selectedClass); // Update controlled state
    setShowClassModal(false);
  };

  const handleSelectSubject = (selectedSubjectName) => {
    setExamData((prev) => ({ ...prev, Ders: selectedSubjectName }));
    setSelectedSubject(selectedSubjectName); // Update controlled state
    setShowSubjectModal(false);
  };

  const handleSubmit = async () => {
    // Zorunlu alan kontrolü
    const requiredFields = [
      "Tarih",
      "SinavSuresi",
      "Ders",
      "Sinif",
      "SinavAdi",
    ];
    const missingFields = requiredFields.filter((field) => !examData[field]);

    // Öğretmen ID kontrolü
    if (!userData || !userData.OgretmenID) {
      Alert.alert(
        "Hata",
        "Öğretmen bilgileri alınamadı. Lütfen tekrar giriş yapın.",
        [{ text: "Tamam", onPress: () => clearSession() }],
      );
      return;
    }

    if (missingFields.length > 0) {
      Alert.alert(
        "Eksik Bilgi",
        `Lütfen şu alanları doldurun: ${missingFields.join(", ")}`,
      );
      return;
    }

    try {
      const submitData = {
        ...examData,
        Tarih: formatDate(examData.Tarih),
        Puan: "",
        OgretmenID: userData.OgretmenID,
      };

      const response = await addExam(submitData);

      Alert.alert("Başarılı", "Sınav başarıyla eklendi!", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Sınav ekleme hatası:", error);
      Alert.alert(
        "Hata",
        "Sınav eklenirken bir sorun oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  // Yükleme durumunda gösterilecek ekran
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
        <Text
          style={[styles.loadingText, { color: theme.text, marginTop: 16 }]}
        >
          Veriler yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Sınav Ekle" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Sınav Adı *</Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            value={examData.SinavAdi}
            onChangeText={(text) => handleInputChange("SinavAdi", text)}
            placeholder="Vize, Final, Ara Sınav"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.label, { color: theme.text }]}>Ders *</Text>
          <TouchableOpacity
            style={[
              styles.classSelectButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowSubjectModal(true)}
          >
            <Text
              style={[
                styles.classSelectText,
                {
                  color: selectedSubject ? (isDark ? "#E6EDF3" : "#0D1B2A") : "#7C8DA6",
                },
              ]}
            >
              {selectedSubject || "Ders seçin..."}
            </Text>
            <Text style={[styles.dropdownIcon, { color: "#7C8DA6" }]}>▼</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.text }]}>Sınıf *</Text>
          <TouchableOpacity
            style={[
              styles.classSelectButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowClassModal(true)}
          >
            <Text
              style={[
                styles.classSelectText,
                {
                  color: sinif ? (isDark ? "#E6EDF3" : "#0D1B2A") : "#7C8DA6",
                },
              ]}
            >
              {sinif || "Sınıf seçin..."}
            </Text>
            <Text style={[styles.dropdownIcon, { color: "#7C8DA6" }]}>▼</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.text }]}>
            Sınav Süresi (dakika) *
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            value={examData.SinavSuresi}
            onChangeText={(text) => handleInputChange("SinavSuresi", text)}
            placeholder="60"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.label, { color: theme.text }]}>
            Sınav Tarihi *
          </Text>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.text }}>
              {formatDate(examData.Tarih)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                testID="dateTimePicker"
                value={examData.Tarih}
                mode="date"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
                onChange={handleDateChange}
                locale="tr-TR"
                textColor="#0D1B2A"
                minimumDate={new Date()}
                style={[
                  styles.datePicker,
                  {
                    backgroundColor: 'rgba(255, 214, 10, 0.1)',
                    borderRadius: 12,
                    ...(Platform.OS === 'android' && {
                      width: '100%',
                      height: 300,
                    }),
                    ...(Platform.OS === 'ios' && {
                      height: 200,
                    }),
                  }
                ]}
                {...(Platform.OS === 'android' && {
                  accentColor: '#FFD60A',
                  themeVariant: 'light',
                })}
                {...(Platform.OS === 'ios' && {
                  accentColor: '#FFD60A',
                  themeVariant: 'light',
                })}
              />
            </View>
          )}

          <Text style={[styles.label, { color: theme.text }]}>Açıklama</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={examData.Aciklama}
            onChangeText={(text) => handleInputChange("Aciklama", text)}
            placeholder="Sınav hakkında detaylı açıklama"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isDark ? theme.accent : "#007AFF",
                opacity: 0.9,
              },
            ]}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { color: "#fff" }]}>
              Sınavı Kaydet
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sınıf Seçim Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showClassModal}
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                zIndex: 999,
                elevation: 8,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>
              Sınıf Seç
            </Text>
            {classList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: "#7C8DA6" }]}>
                  Sınıf bulunamadı
                </Text>
              </View>
            ) : (
              <FlatList
                data={classList}
                keyExtractor={(item) => item.SinifAdi}
                style={{ maxHeight: MAX_DROPDOWN_HEIGHT }}
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.classItem,
                      {
                        backgroundColor: "#11263A",
                        borderColor: "rgba(230,237,243,0.08)",
                        minHeight: 44,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      },
                    ]}
                    onPress={() => handleSelectClass(item.SinifAdi)}
                  >
                    <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                      {item.SinifAdi}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowClassModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>
                Kapat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ders Seçim Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSubjectModal}
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                zIndex: 999,
                elevation: 8,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>
              Ders Seç
            </Text>
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: "#7C8DA6" }]}>
                  Ders bulunamadı
                </Text>
              </View>
            ) : (
              <FlatList
                data={subjects}
                keyExtractor={(item, index) => index.toString()}
                style={{ maxHeight: MAX_DROPDOWN_HEIGHT }}
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.classItem,
                      {
                        backgroundColor: "#11263A",
                        borderColor: "rgba(230,237,243,0.08)",
                        minHeight: 44,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      },
                    ]}
                    onPress={() => handleSelectSubject(item.isim)}
                  >
                    <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                      {item.isim}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowSubjectModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>
                Kapat
              </Text>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80, // Alt boşluk - "Sınavı Kaydet" butonu için
  },
  inputContainer: {
    borderRadius: 15,
    padding: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // Yeni eklenen stiller
  classSelectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  classSelectText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 16,
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
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontStyle: "italic",
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
    color: "#fff", // Metin rengini beyaz yap
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
  // Takvim tasarım styles
  datePickerContainer: {
    backgroundColor: 'rgba(255, 214, 10, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 10, 0.2)',
    shadowColor: '#FFD60A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePicker: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default ExamAdd;
