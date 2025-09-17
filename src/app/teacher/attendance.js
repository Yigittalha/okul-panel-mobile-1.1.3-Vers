import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView, TextInput } from 'react-native';
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
  const [sending, setSending] = useState({}); // { [OgrenciId]: boolean }
  const [gainOptions, setGainOptions] = useState([]); // select options from /schedule/gain
  const [gainLoading, setGainLoading] = useState(false);
  const [gainError, setGainError] = useState(null);
  const [selectedGains, setSelectedGains] = useState([]); // multi-select
  const [gainExpanded, setGainExpanded] = useState(false);
  const [gainSending, setGainSending] = useState(false);
  const [extraKazanim, setExtraKazanim] = useState(''); // ekstra kazanım input'u
  
  // Toplu yoklama için yeni state'ler
  const [attendanceData, setAttendanceData] = useState({}); // { [OgrenciId]: durum }
  const [batchSending, setBatchSending] = useState(false);

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

  // Fetch select options from /api/schedule/gain using Ders & Sinif
  useEffect(() => {
    const fetchGain = async () => {
      try {
        setGainLoading(true);
        setGainError(null);
        const dersVal = Ders || (students[0]?.Ders);
        const sinifVal = Sinif || (students[0]?.Sinif);
        if (!dersVal || !sinifVal) {
          setGainOptions([]);
          return;
        }
        const res = await api.post('/schedule/gain', { Ders: String(dersVal), Sinif: String(sinifVal) });
        const arrRaw = Array.isArray(res?.data) ? res.data : [];
        const arr = arrRaw.slice().sort((a, b) => (Number(a?.Hafta) || 0) - (Number(b?.Hafta) || 0));
        setGainOptions(arr);
        setSelectedGains([]);
      } catch (e) {
        setGainError(e?.message || 'Seçenekler alınamadı');
      } finally {
        setGainLoading(false);
      }
    };
    
    // Sadece students ilk kez yüklendiğinde çağır
    if (students.length > 0 && gainOptions.length === 0) {
      fetchGain();
    }
    // Sadece Ders ve Sinif değiştiğinde tetikle, students değişikliğini ignore et
  }, [Ders, Sinif, students.length]);

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
    let successCount = 0;
    let errorCount = 0;
    
    for (const [ogrenciId, durum] of attendanceEntries) {
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

  const sendGainData = useCallback(async () => {
    if (selectedGains.length === 0 && !extraKazanim.trim()) {
      Alert.alert('Uyarı', 'Lütfen en az bir kazanım seçin veya ekstra kazanım girin.');
      return;
    }

    try {
      setGainSending(true);
      
      // Seçilen kazanımları tek metinde birleştir
      let combinedKazanim = selectedGains
        .map(g => String(g?.kazanim || ''))
        .filter(k => k.trim())
        .join(', ');

      // Eğer ekstra kazanım girilmişse, sonuna ekle
      if (extraKazanim.trim()) {
        if (combinedKazanim) {
          combinedKazanim += ', ' + extraKazanim.trim();
        } else {
          combinedKazanim = extraKazanim.trim();
        }
      }

      const body = {
        Sinif: String(Sinif),
        kazanim: combinedKazanim,
        ProgramID: Number(ProgramID)
      };
      
      await api.post('/schedule/gainadd', body);
      
      Alert.alert('Başarılı', 'Kazanımlar başarıyla kaydedildi.');
      
      // Seçimi ve input'u temizle
      setSelectedGains([]);
      setExtraKazanim('');
      setGainExpanded(false);
      
    } catch (e) {
      Alert.alert('Hata', e?.message || 'Kazanımlar kaydedilemedi');
    } finally {
      setGainSending(false);
    }
  }, [selectedGains, extraKazanim, Sinif, ProgramID]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Yoklama</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Öğrenci listesi yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Yoklama</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{String(error)}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.retryButton, { backgroundColor: theme.accent }]}>
            <Text style={[styles.retryText, { color: theme.primary }]}>Geri dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
          <View style={styles.gainSectionContainer}>
            {/* Modern Header */}
            <View style={[styles.gainHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.gainHeaderContent}>
                <Text style={[styles.gainTitle, { color: theme.text }]}>Kazanım Seçimi</Text>
                <TouchableOpacity 
                  style={[styles.expandButton, { backgroundColor: theme.accent }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setGainExpanded(v => !v);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.expandButtonText}>
                    {gainExpanded ? 'Kapat' : selectedGains.length > 0 ? `${selectedGains.length} Seçili` : 'Seç'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loading/Error States */}
            {gainLoading && (
              <View style={[styles.stateContainer, { backgroundColor: theme.card }]}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.stateText, { color: theme.text }]}>Yükleniyor...</Text>
              </View>
            )}

            {gainError && (
              <View style={[styles.stateContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>Hata: {String(gainError)}</Text>
              </View>
            )}

            {/* Dropdown List with Smart Layout */}
            {gainExpanded && !gainLoading && !gainError && (
              <View style={[styles.gainDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {/* Quick Actions Bar */}
                <View style={[styles.quickActionsBar, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity 
                    style={[styles.quickActionButton, { backgroundColor: theme.accent + '15' }]}
                    onPress={() => setSelectedGains([...gainOptions])}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickActionText, { color: theme.accent }]}>Tümünü Seç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionButton, { backgroundColor: theme.surface }]}
                    onPress={() => setSelectedGains([])}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickActionText, { color: theme.text }]}>Temizle</Text>
                  </TouchableOpacity>
                </View>

                {/* Compact Grid View */}
                <ScrollView 
                  style={styles.gainScrollView} 
                  showsVerticalScrollIndicator={true}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.gainGrid}>
                    {gainOptions.map((opt, idx) => {
                      const key = `${String(opt?.Hafta)}-${String(opt?.kazanim)}`;
                      const isSelected = selectedGains.some(g => String(g?.Hafta) === String(opt?.Hafta) && String(g?.kazanim) === String(opt?.kazanim));
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.gainGridItem, 
                            { 
                              borderColor: isSelected ? theme.accent : theme.border,
                              backgroundColor: isSelected ? theme.accent + '10' : theme.card
                            }
                          ]}
                          activeOpacity={0.6}
                          onPress={() => {
                            setSelectedGains(prev => {
                              const exists = prev.some(g => String(g?.Hafta) === String(opt?.Hafta) && String(g?.kazanim) === String(opt?.kazanim));
                              if (exists) {
                                return prev.filter(g => !(String(g?.Hafta) === String(opt?.Hafta) && String(g?.kazanim) === String(opt?.kazanim)));
                              }
                              return [...prev, opt];
                            });
                          }}
                        >
                          <View style={styles.gainGridHeader}>
                            <View style={[styles.compactWeekBadge, { backgroundColor: theme.accent }]}>
                              <Text style={styles.compactWeekText}>H{String(opt?.Hafta ?? '')}</Text>
                            </View>
                            {isSelected && (
                              <View style={[styles.compactCheckIcon, { backgroundColor: theme.accent }]}>
                                <Text style={styles.compactCheck}>✓</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.compactGainText, { color: theme.text }]} numberOfLines={3}>
                            {String(opt?.kazanim ?? '')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Selection Counter */}
                <View style={[styles.selectionCounter, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                  <Text style={[styles.counterText, { color: theme.text }]}>
                    {selectedGains.length} / {gainOptions.length} kazanım seçildi
                  </Text>
                </View>
              </View>
            )}

            {/* Selected Items Summary */}
            {selectedGains.length > 0 && (
              <View style={[styles.selectedSummary, { backgroundColor: theme.accent + '10', borderColor: theme.accent }]}>
                <Text style={[styles.summaryText, { color: theme.text }]}>
                  {selectedGains.length} kazanım seçildi
                </Text>
                <TouchableOpacity 
                  style={[styles.clearButton, { borderColor: theme.accent }]}
                  onPress={() => setSelectedGains([])}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.clearButtonText, { color: theme.accent }]}>Temizle</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ekstra Kazanım Input'u */}
            <View style={[styles.extraKazanimContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.extraKazanimLabel, { color: theme.text }]}>
                Ekstra Kazanım (Opsiyonel)
              </Text>
              <TextInput
                style={[
                  styles.extraKazanimInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  }
                ]}
                value={extraKazanim}
                onChangeText={setExtraKazanim}
                placeholder="Ekstra kazanım yazabilirsiniz..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Kazanım Gönder Butonu */}
            {(selectedGains.length > 0 || extraKazanim.trim()) && (
              <TouchableOpacity 
                style={[styles.sendGainButton, { backgroundColor: theme.accent }]}
                onPress={sendGainData}
                activeOpacity={0.8}
                disabled={gainSending}
              >
                {gainSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendGainButtonText}>Kazanımları Kaydet</Text>
                )}
              </TouchableOpacity>
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
  // New Modern Gain Section Styles
  gainSectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  gainHeader: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gainHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  gainTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  expandButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  expandButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 8,
    borderRadius: 12,
    gap: 8,
  },
  stateText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  gainDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gainScrollView: {
    maxHeight: 280,
    flex: 0,
  },
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    paddingBottom: 20,
  },
  gainGridItem: {
    width: '48%',
    minHeight: 95,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
  },
  gainGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactWeekBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  compactWeekText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  compactCheckIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactGainText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  selectionCounter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  selectedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sendGainButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  sendGainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  extraKazanimContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  extraKazanimLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  extraKazanimInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
    maxHeight: 100,
  },
  
  // Yeni stiller - Footer ve Yoklama Özeti
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
  
});
