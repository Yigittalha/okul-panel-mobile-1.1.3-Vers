import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionContext } from '../../state/session';
import { useTheme } from '../../state/theme';
import api, { fetchUserInfo } from '../../lib/api';
import FeaturePageHeader from '../../components/FeaturePageHeader';

const ATTENDANCE_URL = '/teacher/attendance';
const ATTENDANCE_ADD_URL = '/teacher/attendanceadd';

export default function AttendanceLesson() {
  const navigation = useNavigation();
  const route = useRoute();
  const { Sinif, Tarih, DersSaati, ProgramID, Gun, Ders } = route.params || {};
  const { schoolCode } = useContext(SessionContext);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [sending, setSending] = useState({});
  
  const [attendanceData, setAttendanceData] = useState({});
  const [batchSending, setBatchSending] = useState(false);

  const [kazanimExpanded, setKazanimExpanded] = useState(false);
  const [kazanimData, setKazanimData] = useState([]);
  const [kazanimLoading, setKazanimLoading] = useState(false);
  const [kazanimError, setKazanimError] = useState(null);
  const [selectedKazanimlar, setSelectedKazanimlar] = useState([]);
  const [expandedBasliks, setExpandedBasliks] = useState(new Set());
  const [kazanimSearchText, setKazanimSearchText] = useState('');
  const [expandedTexts, setExpandedTexts] = useState(new Set());
  const [customKazanimText, setCustomKazanimText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Öğretmen kontrolü
        const userInfo = await fetchUserInfo(false);
        if (!userInfo?.OgretmenID) {
          setError('Bu sayfa yalnız öğretmenler içindir.');
          setLoading(false);
          return;
        }

        // Listeleme: POST body { Sinif, Tarih, DersSaati, ProgramID }
        const res = await api.post(ATTENDANCE_URL, {
          Sinif: String(Sinif),
          Tarih: String(Tarih),            // "2025-09-02"
          DersSaati: String(DersSaati),
          ProgramID: Number(ProgramID)
        });
        
        const arr = Array.isArray(res?.data) ? res.data : [];
        setStudents(arr);
        
        // Mevcut kayıtları attendanceData'ya aktar ve null olanları "Burada" (1) yap
        const initialAttendance = {};
        arr.forEach(student => {
          if (student.durum === null || student.durum === undefined) {
            initialAttendance[student.OgrenciId] = 1; // Null olanları "Burada" yap
          } else {
            // Mevcut kayıtlı durumları koru (0=Yok, 1=Burada, 2=Geç)
            initialAttendance[student.OgrenciId] = student.durum;
          }
        });
        setAttendanceData(initialAttendance);
      } catch (e) {
        setError(e?.message || 'Öğrenci listesi alınamadı.');
      } finally {
        setLoading(false);
      }
    })();
  }, [Sinif, Tarih, DersSaati, ProgramID]);

  // Yeni sistem: Sadece local state'i güncelle, API'ye gönderme
  const updateAttendance = useCallback((ogrenciId, durum) => {
    setAttendanceData(prev => ({
      ...prev,
      [ogrenciId]: durum
    }));
    
    // setStudents çağrısını kaldır - gereksiz re-render'a neden oluyor
    // UI güncellemesi currentDurum logic'i ile zaten yapılıyor
  }, []);

  // Toplu yoklama gönderme fonksiyonu
  const sendAllAttendance = useCallback(async () => {
    try {
      setBatchSending(true);
      
      // Yoklama alınmayan öğrencileri kontrol et
      const studentsWithoutAttendance = students.filter(student => 
        attendanceData[student.OgrenciId] === undefined
      );
      
      if (studentsWithoutAttendance.length > 0) {
        Alert.alert(
          'Eksik Yoklama',
          `${studentsWithoutAttendance.length} öğrencinin yoklaması alınmamış. Devam etmek istiyor musunuz?`,
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Devam Et', onPress: () => processBatchSend() }
          ]
        );
        return;
      }
      
      await processBatchSend();
    } catch (e) {
      Alert.alert('Hata', e?.message || 'Yoklama gönderilemedi');
    } finally {
      setBatchSending(false);
    }
  }, [students, attendanceData, ProgramID, Tarih]);

  const processBatchSend = useCallback(async () => {
    const attendanceEntries = Object.entries(attendanceData);
    // Durum 1 olanları filtrele (gönderme)
    const filteredEntries = attendanceEntries.filter(([ogrenciId, durum]) => durum !== 1);
    let successCount = 0;
    let errorCount = 0;
    
    for (const [ogrenciId, durum] of filteredEntries) {
      try {
        const body = {
          tarih: String(Tarih),
          OgrenciID: Number(ogrenciId),
          ProgramID: Number(ProgramID),
          durum: Number(durum)
        };
        
        await api.post(ATTENDANCE_ADD_URL, body);
        successCount++;
      } catch (e) {
        console.error(`Öğrenci ${ogrenciId} yoklama hatası:`, e);
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      Alert.alert('Başarılı', `${successCount} öğrencinin yoklaması kaydedildi.`);
      navigation.goBack();
    } else {
      Alert.alert(
        'Kısmi Başarı', 
        `${successCount} başarılı, ${errorCount} hatalı kayıt.`
      );
    }
  }, [attendanceData, ProgramID, Tarih, navigation]);

  const fetchKazanimlar = useCallback(async () => {
    try {
      setKazanimLoading(true);
      setKazanimError(null);
      const body = {
        Ders: String(Ders),
        Sinif: String(Sinif)
      };
      console.log('📚 Kazanım API isteği:', body);
      const res = await api.post('/schedule/gain/new/get', body);
      console.log('📚 Kazanım API yanıtı:', res);
      const arr = Array.isArray(res?.data) ? res.data : [];
      console.log('📚 Kazanım sayısı:', arr.length);
      setKazanimData(arr.map((item, idx) => ({ ...item, id: item.id || idx })));
    } catch (e) {
      console.error('❌ Kazanım yükleme hatası:', e);
      setKazanimError(e?.message || 'Kazanımlar yüklenemedi');
    } finally {
      setKazanimLoading(false);
    }
  }, [Ders, Sinif]);

  useEffect(() => {
    if (kazanimExpanded && kazanimData.length === 0) {
      fetchKazanimlar();
    }
  }, [kazanimExpanded, kazanimData.length, fetchKazanimlar]);

  const handleKazanimSecClick = useCallback(() => {
    setKazanimExpanded(prev => !prev);
  }, []);

  const toggleBaslik = useCallback((id) => {
    setExpandedBasliks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleTextExpansion = useCallback((key) => {
    setExpandedTexts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const renderTruncatedText = useCallback((text, textKey, style) => {
    const MAX_LENGTH = 80;
    const isExpanded = expandedTexts.has(textKey);
    const shouldTruncate = text.length > MAX_LENGTH;

    if (!shouldTruncate) {
      return <Text style={style}>{text}</Text>;
    }

    return (
      <View>
        <Text style={style}>
          {isExpanded ? text : `${text.substring(0, MAX_LENGTH)}...`}
        </Text>
        <TouchableOpacity onPress={() => toggleTextExpansion(textKey)}>
          <Text style={styles.showMoreText}>
            {isExpanded ? '▲ Daha az göster' : '▼ Devamını gör'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [expandedTexts, toggleTextExpansion]);

  const toggleKazanimSelection = useCallback((type, value, parentId, parentBaslik, itemId) => {
    setSelectedKazanimlar(prev => {
      const key = type === 'baslik' ? `baslik_${itemId}_${value}` : `altbaslik_${parentId}_${itemId}_${value}`;
      const exists = prev.some(item => item.key === key);
      
      if (exists) {
        let newSelected = prev.filter(item => item.key !== key);
        
        if (type === 'altbaslik') {
          const remainingAltbaslikForParent = newSelected.filter(
            item => item.type === 'altbaslik' && item.parentId === parentId
          );
          
          if (remainingAltbaslikForParent.length === 0) {
            const parentKey = `baslik_${itemId}_${parentBaslik}`;
            newSelected = newSelected.filter(item => item.key !== parentKey);
          }
        }
        
        return newSelected;
      }
      
      if (type === 'altbaslik') {
        const parentKey = `baslik_${itemId}_${parentBaslik}`;
        const parentExists = prev.some(item => item.key === parentKey);
        
        if (!parentExists) {
          return [...prev, 
            { key: parentKey, type: 'baslik', value: parentBaslik, parentId: null, itemId },
            { key, type, value, parentId, itemId }
          ];
        }
      }
      
      return [...prev, { key, type, value, parentId, itemId }];
    });
  }, []);

  const isKazanimSelected = useCallback((type, value, parentId, itemId) => {
    const key = type === 'baslik' ? `baslik_${itemId}_${value}` : `altbaslik_${parentId}_${itemId}_${value}`;
    return selectedKazanimlar.some(item => item.key === key);
  }, [selectedKazanimlar]);

  const filteredKazanimData = useMemo(() => {
    if (!kazanimSearchText.trim()) {
      return kazanimData;
    }
    
    const searchLower = kazanimSearchText.toLowerCase().trim();
    return kazanimData.filter(item => {
      const baslikMatch = item.baslik?.toLowerCase().includes(searchLower);
      const altbaslikMatch = item.altbaslik?.some(alt => 
        alt.toLowerCase().includes(searchLower)
      );
      return baslikMatch || altbaslikMatch;
    });
  }, [kazanimData, kazanimSearchText]);

  const formatSelectedKazanimlar = useCallback(() => {
    // Grup başlıklarına göre organize et
    const grouped = {};
    
    selectedKazanimlar.forEach(item => {
      if (item.type === 'baslik') {
        if (!grouped[item.value]) {
          grouped[item.value] = [];
        }
      } else if (item.type === 'altbaslik') {
        // Parent başlığı bul
        const parentItem = selectedKazanimlar.find(
          k => k.type === 'baslik' && k.key === `baslik_${item.parentId}`
        );
        
        // Eğer parent yoksa, kazanım verisinden başlığı al
        let parentKey = item.parentId || 'Diğer Kazanımlar';
        
        // Gerçek başlık metnini kullan (item içinde parentBaslik varsa)
        const actualParent = kazanimData.find(k => k.id === item.parentId);
        if (actualParent) {
          parentKey = actualParent.baslik;
        }
        
        if (!grouped[parentKey]) {
          grouped[parentKey] = [];
        }
        grouped[parentKey].push(item.value);
      }
    });

    // Formatla
    let formattedText = '=== SEÇİLİ KAZANIMLAR ===\n\n';
    
    Object.keys(grouped).forEach(baslik => {
      formattedText += `${baslik}\n`;
      
      if (grouped[baslik].length > 0) {
        grouped[baslik].forEach(altbaslik => {
          formattedText += `  - ${altbaslik}\n`;
        });
      }
      
      formattedText += '\n';
    });
    
    // Özel kazanım metni varsa ekle
    if (customKazanimText.trim()) {
      formattedText += '=== ÖZEL KAZANIMLAR ===\n';
      formattedText += customKazanimText.trim() + '\n\n';
    }
    
    formattedText += '========================';
    
    return formattedText;
  }, [selectedKazanimlar, kazanimData, customKazanimText]);

  const handleKazanimKaydet = useCallback(async () => {
    if (selectedKazanimlar.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir kazanım seçin.');
      return;
    }

    // Formatlanmış metni oluştur ve konsola yazdır
    const formattedKazanimlar = formatSelectedKazanimlar();
    console.log('\n' + formattedKazanimlar + '\n');

    try {
      let kazanimText = selectedKazanimlar.map(item => item.value).join(', ');
      
      // Özel kazanım metni varsa ekle
      if (customKazanimText.trim()) {
        if (kazanimText) {
          kazanimText += ', ' + customKazanimText.trim();
        } else {
          kazanimText = customKazanimText.trim();
        }
      }
      
      const body = {
        Sinif: String(Sinif),
        kazanim: kazanimText,
        ProgramID: Number(ProgramID)
      };
      
      await api.post('/schedule/gainadd', body);
      Alert.alert('Başarılı', 'Kazanımlar kaydedildi.');
      setKazanimExpanded(false);
      setSelectedKazanimlar([]);
      setExpandedBasliks(new Set());
      setKazanimSearchText('');
      setCustomKazanimText('');
    } catch (e) {
      Alert.alert('Hata', e?.message || 'Kazanımlar kaydedilemedi');
    }
  }, [selectedKazanimlar, Sinif, ProgramID, formatSelectedKazanimlar]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FeaturePageHeader 
          title="Yoklama" 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Öğrenci listesi yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FeaturePageHeader 
          title="Yoklama" 
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{String(error)}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.retryButton, { backgroundColor: theme.accent }]}>
            <Text style={[styles.retryText, { color: theme.primary }]}>Geri dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const Item = ({ item }) => {
    const busy = !!sending[item.OgrenciId];
    // Önce attendanceData'dan kontrol et, yoksa orijinal durum değerini kullan
    const currentDurum = attendanceData[item.OgrenciId] !== undefined 
                        ? attendanceData[item.OgrenciId] 
                        : item.durum;
    
    const durumText = currentDurum === 1 ? 'Burada'
                     : currentDurum === 0 ? 'Yok'
                     : currentDurum === 2 ? 'Geç'
                     : 'Burada'; // Null/undefined değerler "Burada" olarak gösterilsin
    
    return (
      <View style={[styles.studentItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.studentHeader}>
          <Text style={[styles.studentName, { color: theme.text }]}>
            {item.OgrenciNumara} • {item.AdSoyad}
          </Text>
          <Text style={[styles.statusText, { color: theme.textSecondary || theme.text }]}>
            {durumText}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={busy}
            onPress={(e) => {
              e.stopPropagation();
              updateAttendance(item.OgrenciId, 1);
            }}
            style={[styles.statusButton, styles.hereButton, { opacity: busy ? 0.6 : 1 }]}
          >
            <Text style={styles.buttonText}>Burada</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            disabled={busy}
            onPress={(e) => {
              e.stopPropagation();
              updateAttendance(item.OgrenciId, 0);
            }}
            style={[styles.statusButton, styles.absentButton, { opacity: busy ? 0.6 : 1 }]}
          >
            <Text style={styles.buttonText}>Yok</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            disabled={busy}
            onPress={(e) => {
              e.stopPropagation();
              updateAttendance(item.OgrenciId, 2);
            }}
            style={[styles.statusButton, styles.lateButton, { opacity: busy ? 0.6 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: '#000' }]}>Geç</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Yoklama" 
        onBackPress={() => navigation.goBack()}
      />
      
      
      <FlatList
        ListHeaderComponent={
          <View>
            <View style={styles.kazanimHeaderCard}>
              <View style={styles.kazanimHeaderContent}>
                <View style={styles.kazanimIconContainer}>
                  <Text style={styles.kazanimIcon}>📚</Text>
                </View>
                <View style={styles.kazanimHeaderText}>
                  <Text style={styles.kazanimTitle}>Kazanımlar</Text>
                  <Text style={styles.kazanimSubtitle}>Ders kazanımlarını seçin</Text>
                </View>
              </View>
                <TouchableOpacity 
                style={styles.kazanimSecButton}
                onPress={handleKazanimSecClick}
                  activeOpacity={0.8}
                >
                <Text style={styles.kazanimSecButtonText}>
                  {kazanimExpanded ? 'Kapat' : 'Seç'}
                  </Text>
                </TouchableOpacity>
            </View>

            {kazanimExpanded && (
              <View style={[styles.kazanimExpandedContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {kazanimLoading ? (
                  <View style={styles.kazanimLoadingContainer}>
                    <ActivityIndicator size="large" color="#0D1B2A" />
                    <Text style={styles.kazanimLoadingText}>Yükleniyor...</Text>
              </View>
                ) : kazanimError ? (
                  <View style={styles.kazanimErrorContainer}>
                    <Text style={styles.kazanimErrorText}>{kazanimError}</Text>
                  <TouchableOpacity 
                      style={styles.kazanimRetryButton}
                      onPress={fetchKazanimlar}
                  >
                      <Text style={styles.kazanimRetryText}>Tekrar Dene</Text>
                  </TouchableOpacity>
                  </View>
                  ) : kazanimData.length === 0 && !kazanimLoading && !kazanimError ? (
                    <View style={styles.kazanimNoResults}>
                      <Text style={styles.kazanimNoResultsText}>
                        Bu ders için henüz kazanım tanımlanmamış.
                      </Text>
                    </View>
                  ) : kazanimData.length > 0 ? (
                  <View>
                    <View style={styles.kazanimSearchContainer}>
                      <TextInput
                        style={[styles.kazanimSearchInput, { 
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          color: theme.text
                        }]}
                        placeholder="Kazanım ara..."
                        placeholderTextColor="#9CA3AF"
                        value={kazanimSearchText}
                        onChangeText={setKazanimSearchText}
                      />
                      {kazanimSearchText.length > 0 && (
                  <TouchableOpacity 
                          style={styles.kazanimSearchClear}
                          onPress={() => setKazanimSearchText('')}
                  >
                          <Text style={styles.kazanimSearchClearText}>✕</Text>
                  </TouchableOpacity>
                      )}
                </View>

                    {filteredKazanimData.length === 0 ? (
                      <View style={styles.kazanimNoResults}>
                        <Text style={styles.kazanimNoResultsText}>Sonuç bulunamadı</Text>
              </View>
                    ) : (
                      <ScrollView style={styles.kazanimListScroll} showsVerticalScrollIndicator={false}>
                        {filteredKazanimData.map((item) => {
                          const hasAltbaslik = item.altbaslik && Array.isArray(item.altbaslik) && item.altbaslik.length > 0;
                        
                      return (
                          <View key={item.id} style={styles.kazanimItem}>
                            {!hasAltbaslik ? (
                              <View style={styles.kazanimBaslikRow}>
                        <TouchableOpacity
                                  style={styles.checkboxContainer}
                                  onPress={() => toggleKazanimSelection('baslik', item.baslik, null, null, item.id)}
                                  activeOpacity={0.7}
                                >
                                  <View style={[
                                    styles.checkbox,
                                    isKazanimSelected('baslik', item.baslik, null, item.id) && styles.checkboxSelected
                                  ]}>
                                    {isKazanimSelected('baslik', item.baslik, null, item.id) && (
                                      <Text style={styles.checkboxCheck}>✓</Text>
                                    )}
                            </View>
                                </TouchableOpacity>
                                
                                  <View style={styles.kazanimBaslikTextContainer}>
                                    {renderTruncatedText(item.baslik, `baslik_${item.id}`, styles.kazanimBaslikText)}
                              </View>
                              </View>
                            ) : (
                              <>
                                <View style={styles.kazanimBaslikRow}>
                  <TouchableOpacity 
                                    style={styles.checkboxContainer}
                                    onPress={() => toggleBaslik(item.id)}
                    activeOpacity={0.7}
                  >
                                    <View style={[
                                      styles.checkbox,
                                      styles.checkboxDisabled,
                                      isKazanimSelected('baslik', item.baslik, null, item.id) && styles.checkboxSelected
                                    ]}>
                                      {isKazanimSelected('baslik', item.baslik, null, item.id) && (
                                        <Text style={styles.checkboxCheck}>✓</Text>
                            )}
                          </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                                    style={styles.kazanimBaslikTextContainer}
                                    onPress={() => toggleBaslik(item.id)}
                    activeOpacity={0.7}
                  >
                                    {renderTruncatedText(item.baslik, `baslik_${item.id}`, [styles.kazanimBaslikText, styles.kazanimBaslikWithAlt])}
                                  </TouchableOpacity>
                                  
                                  <TouchableOpacity onPress={() => toggleBaslik(item.id)} style={styles.expandIconContainer}>
                                    <Text style={styles.expandIcon}>
                                      {expandedBasliks.has(item.id) ? '−' : '+'}
                                    </Text>
                  </TouchableOpacity>
                </View>

                                {expandedBasliks.has(item.id) && (
                                  <View style={styles.altbaslikContainer}>
                                    {item.altbaslik.map((alt, idx) => (
                        <TouchableOpacity
                                        key={`${item.id}-${idx}`}
                                        style={styles.altbaslikRow}
                                        onPress={() => toggleKazanimSelection('altbaslik', alt, item.id, item.baslik, item.id)}
                                        activeOpacity={0.7}
                                      >
                                        <View style={[
                                          styles.checkbox,
                                          styles.checkboxAlt,
                                          isKazanimSelected('altbaslik', alt, item.id, item.id) && styles.checkboxSelected
                                        ]}>
                                          {isKazanimSelected('altbaslik', alt, item.id, item.id) && (
                                            <Text style={styles.checkboxCheck}>✓</Text>
                                          )}
                            </View>
                                        <View style={styles.altbaslikTextWrapper}>
                                          {renderTruncatedText(alt, `altbaslik_${item.id}_${idx}`, styles.altbaslikText)}
                                        </View>
                                      </TouchableOpacity>
                                    ))}
                              </View>
            )}
                              </>
                            )}
                          </View>
                      );
                    })}
                </ScrollView>
                    )}

                    {/* Özel Kazanım Input */}
                    <View style={styles.customKazanimContainer}>
                      <Text style={styles.customKazanimLabel}>📝 Kazanım Ekle:</Text>
                      <TextInput
                        style={[styles.customKazanimInput, { 
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          color: theme.text
                        }]}
                        placeholder="Özel kazanım yazın..."
                        placeholderTextColor="#9CA3AF"
                        value={customKazanimText}
                        onChangeText={setCustomKazanimText}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    {(selectedKazanimlar.length > 0 || customKazanimText.trim()) && (
                      <View style={styles.kazanimFooter}>
                <TouchableOpacity 
                          style={styles.kazanimSaveButton}
                          onPress={handleKazanimKaydet}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.kazanimSaveButtonText}>Kazanımları Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
                ) : null}
              </View>
            )}
          </View>
        }
        data={students}
        keyExtractor={(it) => String(it.OgrenciId)}
        renderItem={({ item }) => <Item item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>Kayıt bulunamadı.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {/* Yoklama Özeti */}
            <View style={[styles.summaryContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Yoklama Özeti</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: "#9CA3AF" }]}>
                  Toplam Öğrenci: {students.length}
                </Text>
                <Text style={[styles.summaryText, { color: "#9CA3AF" }]}>
                  Alınan Yoklama: {Object.keys(attendanceData).length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: '#22C55E' }]}>
                  Burada: {Object.values(attendanceData).filter(d => d === 1).length}
                </Text>
                <Text style={[styles.summaryText, { color: '#EF4444' }]}>
                  Yok: {Object.values(attendanceData).filter(d => d === 0).length}
                </Text>
                <Text style={[styles.summaryText, { color: '#F59E0B' }]}>
                  Geç: {Object.values(attendanceData).filter(d => d === 2).length}
                </Text>
              </View>
            </View>
            
            {/* Yoklamayı Bitir Butonu */}
            <TouchableOpacity
              style={[
                styles.finishButton,
                { 
                  backgroundColor: Object.keys(attendanceData).length === students.length ? theme.accent : theme.surface,
                  opacity: batchSending ? 0.6 : 1
                }
              ]}
              onPress={sendAllAttendance}
              disabled={batchSending || Object.keys(attendanceData).length === 0}
              activeOpacity={0.8}
            >
              {batchSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[
                  styles.finishButtonText,
                  { color: Object.keys(attendanceData).length === students.length ? '#fff' : theme.textSecondary }
                ]}>
                  Yoklamayı Bitir ({Object.keys(attendanceData).length}/{students.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  studentItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  lessonInfo: {
    opacity: 0.7,
    marginBottom: 12,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  hereButton: {
    backgroundColor: '#2ecc71',
  },
  absentButton: {
    backgroundColor: '#e74c3c',
  },
  lateButton: {
    backgroundColor: '#f1c40f',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  statusText: {
    opacity: 0.7,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
  
  // Footer ve Yoklama Özeti
  footerContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  finishButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  kazanimHeaderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  kazanimHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kazanimIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kazanimIcon: {
    fontSize: 24,
  },
  kazanimHeaderText: {
    flex: 1,
  },
  kazanimTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 2,
  },
  kazanimSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  kazanimSecButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  kazanimSecButtonText: {
    color: '#0D1B2A',
    fontSize: 15,
    fontWeight: '700',
  },
  kazanimExpandedContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  kazanimSearchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  kazanimSearchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    paddingRight: 44,
    color: '#1f2937',
  },
  kazanimListScroll: {
    maxHeight: 350,
  },
  kazanimSearchClear: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kazanimSearchClearText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  kazanimNoResults: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kazanimNoResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  kazanimLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kazanimLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  kazanimErrorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kazanimErrorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  kazanimRetryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
  },
  kazanimRetryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  kazanimItem: {
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  kazanimBaslikRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDisabled: {
    opacity: 0.4,
    borderColor: '#cbd5e1',
  },
  checkboxSelected: {
    backgroundColor: '#FFD60A',
    borderColor: '#FFD60A',
  },
  checkboxCheck: {
    color: '#0D1B2A',
    fontSize: 15,
    fontWeight: '900',
  },
  checkboxAlt: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  kazanimBaslikTextContainer: {
    flex: 1,
  },
  kazanimBaslikText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  kazanimBaslikWithAlt: {
    fontWeight: '600',
    color: '#0D1B2A',
  },
  expandIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 18,
    color: '#0D1B2A',
    fontWeight: '700',
  },
  altbaslikContainer: {
    backgroundColor: '#f8f9fa',
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 8,
  },
  altbaslikRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginTop: 6,
  },
  altbaslikTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  altbaslikText: {
    fontSize: 14,
    color: '#4b5563',
  },
  showMoreText: {
    fontSize: 12,
    color: '#E5C409',
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.7,
  },
  kazanimFooter: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 0,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    opacity: 0.8,
  },
  kazanimSaveButton: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 200,
  },
  kazanimSaveButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  customKazanimContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  customKazanimLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  customKazanimInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
});
