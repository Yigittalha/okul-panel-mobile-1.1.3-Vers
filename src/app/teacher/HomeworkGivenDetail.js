import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { getUploadUrl } from "../../lib/api";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import api from "../../lib/api";

const HomeworkGivenDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { homework, onDelete } = route.params;
  const { clearSession, schoolCode } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Bekliyor";
      case 1:
        return "Tamamlandı";
      case 2:
        return "Gecikti";
      default:
        return "Bilinmiyor";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return "#9CA3AF"; // Bekliyor - koyu gri
      case 1:
        return theme.success;
      case 2:
        return theme.danger;
      default:
        return theme.muted;
    }
  };

  const getScopeText = (homework) => {
    if (homework.OgrenciID === null) {
      return "Tüm sınıf";
    } else {
      return "Öğrenciye özel";
    }
  };

  const getScopeIcon = (homework) => {
    if (homework.OgrenciID === null) {
      return "👥";
    } else {
      return "👤";
    }
  };

  const openPhoto = () => {
    if (homework.Fotograf) {
      const photoUrl = getUploadUrl(homework.Fotograf, schoolCode);
      if (photoUrl) {
        Linking.openURL(photoUrl).catch(() => {
          Alert.alert("Hata", "Fotoğraf açılamadı.");
        });
      }
    }
  };

  const handleDeleteHomework = () => {
    Alert.alert(
      "Ödevi Sil",
      "Bu ödevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: deleteHomework,
        },
      ],
    );
  };

  const deleteHomework = async () => {
    try {
      setDeleting(true);

      const response = await api.post("/teacher/homeworkdelete", {
        id: homework.id,
      });

      if (response.status === 200) {
        Alert.alert("Başarılı", "Ödev başarıyla silindi!", [
          {
            text: "Tamam",
            onPress: () => {
              // Callback ile listeyi yenile
              if (onDelete) {
                onDelete();
              }
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error("Silme işlemi başarısız");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        navigation.navigate("Login");
      } else {
        Alert.alert(
          "Hata",
          "Ödev silinirken bir hata oluştu. Lütfen tekrar deneyin.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Ödev Detayı"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Info Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.card }]}>
          <View style={styles.subjectRow}>
            <Text style={[styles.subjectText, { color: theme.text }]}>
              📖 {homework.DersAdi}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(homework.durum) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(homework.durum) },
                ]}
              >
                {getStatusText(homework.durum)}
              </Text>
            </View>
          </View>

          <Text style={[styles.topicText, { color: "#9CA3AF" }]}>
            📝 {homework.Konu}
          </Text>

          <View style={styles.scopeRow}>
            <Text style={[styles.scopeText, { color: "#9CA3AF" }]}>
              {getScopeIcon(homework)} {getScopeText(homework)}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📋 Açıklama
          </Text>
          <Text
            style={[styles.descriptionText, { color: "#9CA3AF" }]}
          >
            {homework.Aciklama || "Açıklama belirtilmemiş"}
          </Text>
        </View>

        {/* Dates Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📅 Tarihler
          </Text>

          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: "#9CA3AF" }]}>
              Verilme Tarihi:
            </Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {formatDate(homework.tarih)}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: "#9CA3AF" }]}>
              Teslim Tarihi:
            </Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {formatDate(homework.TeslimTarihi)}
            </Text>
          </View>
        </View>

        {/* Additional Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ℹ️ Ek Bilgiler
          </Text>


          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: "#9CA3AF" }]}>
              {homework.KayitTuru === 1 ? "Öğrenci No:" : "Sınıf:"}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {homework.KayitTuru === 1 
                ? (homework.OgrenciNumara || "Belirtilmemiş")
                : (homework.Sinif || "Belirtilmemiş")
              }
            </Text>
          </View>


          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: "#9CA3AF" }]}>
              Kayıt Türü:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {homework.KayitTuru === 1 ? "Öğrenciye Özel" : "Sınıfa Genel"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: "#9CA3AF" }]}>
              Ödev ID:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {homework.id || "Belirtilmemiş"}
            </Text>
          </View>
        </View>

        {/* Photo Card */}
        {homework.Fotograf && (
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📷 Ödev Fotoğrafı
            </Text>

            <TouchableOpacity style={styles.photoContainer} onPress={openPhoto}>
              <Image
                source={{ uri: getUploadUrl(homework.Fotograf, schoolCode) }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.photoOverlay,
                  { backgroundColor: theme.background + "80" },
                ]}
              >
                <Text style={[styles.photoOverlayText, { color: theme.text }]}>
                  👆 Fotoğrafı büyütmek için dokunun
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Give Points Button */}
        <TouchableOpacity
          style={[
            styles.givePointsButton,
            {
              backgroundColor: theme.accent,
            },
          ]}
          onPress={() => navigation.navigate("HomeworkPoints", { homework })}
        >
          <Text style={[styles.givePointsButtonText, { color: "#fff" }]}>
            📊 Puan Ver
          </Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: isDark ? theme.danger : "#DC2626", // Aydınlık modda daha koyu kırmızı
              opacity: deleting ? 0.6 : 1,
            },
          ]}
          onPress={handleDeleteHomework}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.deleteButtonText, { color: "#fff" }]}>
              🗑️ Ödevi Sil
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  mainCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectText: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  topicText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  scopeRow: {
    marginTop: 8,
  },
  scopeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  photoContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: "center",
  },
  photoOverlayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  givePointsButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  givePointsButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeworkGivenDetail;
