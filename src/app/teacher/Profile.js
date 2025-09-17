import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api, { getUploadUrl, fetchUserInfo } from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RefreshableScrollView from "../../components/RefreshableScrollView";
// TeacherBottomMenu artık AppDrawer'da wrapper ile ekleniyor

// SlideMenu import'u kaldırıldı - döngüsel bağımlılık çözümü

const Profile = () => {
  const navigation = useNavigation();
  const { schoolCode, clearSession } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // menuVisible state'i kaldırıldı - döngüsel bağımlılık çözümü

  const fetchTeacherData = async () => {
    try {
      const data = await fetchUserInfo(true); // showErrors true olarak ayarlandı

      if (data) {
        setTeacherData(data);
        setError(null); // Hata durumunu temizle
        
        // FCM token'ı backend'e gönder (login sonrası)
        if (global.sendFCMTokenAfterLogin) {
          console.log('🔥 Öğretmen girişi başarılı, FCM token gönderiliyor...');
          global.sendFCMTokenAfterLogin(data);
        }
      } else {
        setError("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");

        // Oturumu sonlandır
        setTimeout(() => {
          clearSession();
        }, 2000);
      }
    } catch (error) {
      setError("Sistem hatası oluştu. Lütfen tekrar giriş yapın.");

      // Oturumu sonlandır
      setTimeout(() => {
        clearSession();
      }, 2000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // İlk veriyi çekme işlemi
  useEffect(() => {
    fetchTeacherData();
    // Otomatik döngüsel yenileme kaldırıldı - sadece manuel yenileme aktif
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeacherData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getGenderText = (gender) => {
    return gender === true || gender === "1" ? "Erkek" : "Kadın";
  };

  const getUserPhotoUrl = () => {
    try {
      if (!teacherData) {
        return null;
      }

      if (!teacherData?.Fotograf) {
        return null;
      }

      // Fotoğraf string'i geldi mi kontrol et
      if (
        typeof teacherData.Fotograf !== "string" ||
        teacherData.Fotograf.trim() === ""
      ) {
        return null;
      }

      const photoUrl = getUploadUrl(teacherData.Fotograf, schoolCode);

      // URL oluşturulduysa kullan, yoksa null döndür
      if (!photoUrl) {
        return null;
      }

      return photoUrl;
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Veriler yükleniyor...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      </View>
    );
  }

  if (!teacherData) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Öğretmen bilgileri bulunamadı
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.accent }]}
          onPress={fetchTeacherData}
        >
          <Text style={[styles.retryText, { color: theme.primary }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header kısmını eski haline getir */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: theme.border,
          paddingTop: Math.max(insets.top + 10, 35), // Dinamik top padding
        }
      ]}>
        <TouchableOpacity style={styles.menuButton} onPress={openMenu}>
          <Text style={[styles.menuIcon, { color: theme.text }]}>☰</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Öğretmen Profili
        </Text>

        <View style={styles.placeholder} />
      </View>

      <RefreshableScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 80 }} // Alt menü için minimize boşluk
      >
        <View
          style={[
            styles.profileCard,
            { backgroundColor: theme.card, borderColor: theme.accent },
          ]}
        >
          <View style={styles.avatarContainer}>
            {getUserPhotoUrl() ? (
              <Image
                source={{ uri: getUserPhotoUrl() }}
                style={styles.userPhoto}
                defaultSource={require("../../../assets/icon.png")}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>👩‍🏫</Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: theme.text }]}>
            {teacherData?.AdSoyad}
          </Text>
          <Text style={[styles.department, { color: theme.text }]}>
            {teacherData?.Bolum} Öğretmeni
          </Text>
          <Text style={[styles.teacherId, { color: theme.text }]}>
            ID: {teacherData?.OgretmenID}
          </Text>

          {schoolCode && (
            <View
              style={[styles.schoolBadge, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.schoolText, { color: theme.primary }]}>
                🏫 {schoolCode}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            👤 Kişisel Bilgiler
          </Text>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              📧 E-posta:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {teacherData?.Eposta}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              📱 Telefon:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {teacherData?.Telefon}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              🆔 TC Kimlik:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {teacherData?.TCKimlikNo}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              👤 Cinsiyet:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {getGenderText(teacherData?.Cinsiyet)}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              🎂 Doğum Tarihi:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {formatDate(teacherData?.DogumTarihi)}
            </Text>
          </View>
        </View>

        {/* Şifre Değiştir Butonu */}
        <TouchableOpacity
          style={[styles.passwordButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate("PasswordChange")}
        >
          <Text style={[styles.passwordButtonText, { color: theme.primary }]}>
            🔐 Şifreyi Değiştir
          </Text>
        </TouchableOpacity>

      </RefreshableScrollView>

      {/* SlideMenu bileşeni kaldırıldı - döngüsel bağımlılık çözümü */}
      
      {/* TeacherBottomMenu artık AppDrawer'da wrapper ile ekleniyor */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "bold",
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
  placeholder: {
    width: 44, // Menu button ile aynı genişlik
  },

  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  userPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFD60A",
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  department: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 5,
  },
  teacherId: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 10,
  },
  schoolBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  schoolText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  infoCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    padding: 20,
  },
  passwordButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passwordButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Profile;
