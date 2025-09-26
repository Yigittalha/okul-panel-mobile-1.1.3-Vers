import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import axios from "axios";

const Contact = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    ad: "",
    soyad: "",
    email: "",
    telefon: "",
    kurumAdi: "",
    ogrenciSayisi: "",
    mesaj: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Form validasyonu
    if (!formData.ad.trim() || !formData.soyad.trim() || !formData.email.trim() || 
        !formData.telefon.trim() || !formData.kurumAdi.trim() || !formData.ogrenciSayisi.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Hata", "Lütfen geçerli bir email adresi girin.");
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post('https://ahuiho.okulpanel.com.tr/api/demoTalep', {
        ad: formData.ad.trim(),
        soyad: formData.soyad.trim(),
        email: formData.email.trim(),
        telefon: formData.telefon.trim(),
        kurumAdi: formData.kurumAdi.trim(),
        ogrenciSayisi: formData.ogrenciSayisi.trim(),
        mesaj: formData.mesaj.trim(),
      });

      Alert.alert(
        "Başarılı", 
        "İletişim talebiniz başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
        [
          {
            text: "Tamam",
            onPress: () => navigation.navigate('SchoolSelect')
          }
        ]
      );
      
    } catch (error) {
      console.error('İletişim talebi gönderme hatası:', error);
      Alert.alert("Hata", "İletişim talebiniz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader
        title="İletişim"
        onBackPress={() => navigation.navigate('SchoolSelect')}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            📞 İletişim Formu
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Demo talep etmek veya satın alma/üyelik işlemleri için aşağıdaki formu doldurun
          </Text>

          {/* Ad */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Ad *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.ad}
              onChangeText={(value) => handleInputChange('ad', value)}
              placeholder="Adınızı girin"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Soyad */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Soyad *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.soyad}
              onChangeText={(value) => handleInputChange('soyad', value)}
              placeholder="Soyadınızı girin"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* E-posta */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>E-posta *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="E-posta adresinizi girin"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Telefon */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Telefon *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.telefon}
              onChangeText={(value) => handleInputChange('telefon', value)}
              placeholder="Telefon numaranızı girin"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Kurum Adı */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Kurum Adı *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.kurumAdi}
              onChangeText={(value) => handleInputChange('kurumAdi', value)}
              placeholder="Kurum adınızı girin"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Öğrenci Sayısı */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Öğrenci Sayısı *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.ogrenciSayisi}
              onChangeText={(value) => handleInputChange('ogrenciSayisi', value)}
              placeholder="Öğrenci sayısını girin"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Mesaj */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Özel Mesaj</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              value={formData.mesaj}
              onChangeText={(value) => handleInputChange('mesaj', value)}
              placeholder="Eklemek istediğiniz mesajı yazın (opsiyonel)"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Gönder Butonu */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: theme.accent,
                opacity: loading ? 0.6 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.primary }]}>
                📤 Gönder
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Contact;
