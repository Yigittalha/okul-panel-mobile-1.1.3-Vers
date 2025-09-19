import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Animated,
  ScrollView,
  SafeAreaView,
  Modal,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../state/theme';
import { SessionContext } from '../../state/session';
import { getNewsCardDismissed, setNewsCardDismissed } from '../../lib/storage';

const { width, height } = Dimensions.get('window');

const WhatsNewScreen = ({ visible, onDismiss }) => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { role } = useContext(SessionContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const scrollViewRef = useRef(null);

  // Renkli animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef([]).current;

  // Uygulama versiyonu - her güncellemede değiştirilecek
  const CURRENT_APP_VERSION = "1.0.0";

  // Rol bazlı özellikler
  const getFeaturesByRole = () => {
    if (role === 'teacher') {
      return [
        {
          id: 1,
          icon: 'people',
          title: 'Gelişmiş Yoklama ve Kazanım Sistemi',
          description: 'Yoklama alırken kazanımları da takip edin! Öğrenci fotoğrafları, anlık durum güncellemeleri ve detaylı kazanım raporları ile eğitim sürecini daha etkili yönetin.',
          color: '#10B981',
          gradient: ['#10B981', '#059669'],
          highlight: true
        },
        {
          id: 2,
          icon: 'list',
          title: 'Tüm Öğrenciler Listesi',
          description: 'Sistemdeki tüm öğrencileri görün! Detaylı öğrenci bilgileri, fotoğraflar ve hızlı erişim seçenekleri ile öğrenci yönetimini kolaylaştırın.',
          color: '#EF4444',
          gradient: ['#EF4444', '#DC2626']
        },
        {
          id: 3,
          icon: 'calendar',
          title: 'Ders Programı Yönetimi',
          description: 'Sadece size atanan dersleri görün! Ders saatleri, sınıf bilgileri ve programınızı kolayca takip edin.',
          color: '#06B6D4',
          gradient: ['#06B6D4', '#0891B2']
        },
        {
          id: 4,
          icon: 'chatbubbles',
          title: 'Yeni Mesajlaşma ve Gelen Kutusu',
          description: 'Öğrenciler ve velilerle daha etkili iletişim! Yenilenen gelen kutusu ile tüm mesajlarınızı düzenli takip edin.',
          color: '#3B82F6',
          gradient: ['#3B82F6', '#2563EB']
        },
        {
          id: 5,
          icon: 'document-text',
          title: 'Akıllı Ödev Takibi',
          description: 'Ödev ekleme, detayları görme ve puan verme! Yaptı, yarım yaptı, yapmadı şeklinde değerlendirme ile öğrenci performansını takip edin.',
          color: '#F59E0B',
          gradient: ['#F59E0B', '#D97706']
        },
        {
          id: 6,
          icon: 'school',
          title: 'Sınav Yönetimi',
          description: 'Sınav ekleme ve not verme sistemi! Hangi sınıfa sınav yapıldıysa hepsine tek tek not verin. Öğrenci panelinde veliler bu bilgilere erişip takip yapabilecek.',
          color: '#EC4899',
          gradient: ['#EC4899', '#DB2777']
        },
        {
          id: 7,
          icon: 'trending-up',
          title: 'Performans İyileştirmeleri',
          description: 'Uygulama %40 daha hızlı çalışıyor! Daha az veri kullanımı, pürüzsüz deneyim ve gelişmiş güvenlik özellikleri ile daha iyi bir kullanıcı deneyimi.',
          color: '#8B5CF6',
          gradient: ['#8B5CF6', '#7C3AED']
        }
      ];
    } else if (role === 'parent') {
      return [
        {
          id: 1,
          icon: 'school',
          title: 'Yeni Ders Programı',
          description: 'Ders programınızı güncel olarak görebilirsiniz! Her hafta devamlı olarak güncellenir bilgilendirmesi ile çocuğunuzun eğitim sürecini yakından takip edin.',
          color: '#10B981',
          gradient: ['#10B981', '#059669'],
          highlight: true
        },
        {
          id: 2,
          icon: 'trophy',
          title: 'Gelişmiş Not ve Sınav Takibi',
          description: 'Notlarınızı ve sınav sonuçlarını daha detaylı inceleyin! Grafikler, analizler ve performans raporları ile çocuğunuzun akademik gelişimini takip edin.',
          color: '#F59E0B',
          gradient: ['#F59E0B', '#D97706']
        },
        {
          id: 3,
          icon: 'chatbubbles',
          title: 'Okul ile Sürekli İletişim Halinde Kal',
          description: 'Öğretmenlerinizle ve direkt okul yönetimi ile iletişim kurabilirsiniz! Yenilenen gelen kutusu ile tüm mesajlarınızı düzenli takip edin ve sorularınızı anında sorun.',
          color: '#3B82F6',
          gradient: ['#3B82F6', '#2563EB']
        },
        {
          id: 4,
          icon: 'document-text',
          title: 'Ödevlerim',
          description: 'Tüm ödevlerinizi tek ekranda görün! Ödev detayları, teslim tarihleri ve durum takibi ile ödevlerinizi kolayca yönetin.',
          color: '#F59E0B',
          gradient: ['#F59E0B', '#D97706']
        },
        {
          id: 5,
          icon: 'time',
          title: 'Devamsızlık Takibi',
          description: 'Devamsızlık durumunuzu anlık olarak takip edin! Günlük, haftalık ve aylık devamsızlık raporları ile eğitim sürecinizi kontrol altında tutun.',
          color: '#EF4444',
          gradient: ['#EF4444', '#DC2626']
        },
        {
          id: 6,
          icon: 'notifications',
          title: 'Akıllı Bildirimler ve Hatırlatmalar',
          description: 'Önemli duyurular, ödev hatırlatmaları ve sınav bildirimleri için kişiselleştirilmiş bildirimler. Hiçbir önemli gelişmeyi kaçırmayın!',
          color: '#8B5CF6',
          gradient: ['#8B5CF6', '#7C3AED']
        }
      ];
    }
    return [];
  };

  const features = getFeaturesByRole();

  // Card animasyonlarını başlat
  useEffect(() => {
    if (features.length > 0 && cardAnimations.length === 0) {
      for (let i = 0; i < features.length; i++) {
        cardAnimations.push(new Animated.Value(0));
      }
    }
  }, [features]);

  // Renkli animasyonları başlat
  useEffect(() => {
    if (visible && features.length > 0 && !hasAnimated) {
      // Animasyonları sıfırla
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
      cardAnimations.forEach(anim => anim.setValue(0));
      
      // Renkli giriş animasyonu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();

      // Logo döndürme animasyonu kaldırıldı

      // Pulse animasyonu
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Kart animasyonları (staggered)
      features.forEach((_, index) => {
        Animated.timing(cardAnimations[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }).start();
      });
      
      setHasAnimated(true);
    }
  }, [visible, features, hasAnimated]);

  // Component unmount olduğunda animasyonları temizle
  useEffect(() => {
    return () => {
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
      pulseAnim.stopAnimation();
      cardAnimations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  const handleContinue = async () => {
    try {
      // Animasyonları durdur
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
      pulseAnim.stopAnimation();
      cardAnimations.forEach(anim => anim.stopAnimation());
      
      // Bu versiyon için kapatıldı olarak işaretle
      await setNewsCardDismissed(CURRENT_APP_VERSION);
      
      // Animasyon durumunu sıfırla
      setHasAnimated(false);
      
      // Modal'ı kapat
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.log('Devam etme hatası:', error);
      // Animasyon durumunu sıfırla
      setHasAnimated(false);
      // Hata durumunda da modal'ı kapat
      if (onDismiss) {
        onDismiss();
      }
    }
  };

  const handleSkip = async () => {
    await handleContinue();
  };

  const onScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentSlide(roundIndex);
  };

  const renderFeatureCard = (feature, index) => {
    const cardAnimation = cardAnimations[index] || new Animated.Value(1);
    
    return (
      <View key={feature.id} style={styles.slide}>
        <Animated.View 
          style={[
            styles.featureCard,
            {
              opacity: cardAnimation,
              transform: [
                {
                  translateY: cardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
                {
                  scale: cardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }
          ]}
        >
          {/* Highlight Badge */}
          {feature.highlight && (
            <Animated.View 
              style={[
                styles.highlightBadge, 
                { backgroundColor: feature.color },
                {
                  transform: [
                    {
                      scale: pulseAnim,
                    },
                  ],
                }
              ]}
            >
              <Text style={styles.highlightText}>YENİ</Text>
            </Animated.View>
          )}
          
          {/* Icon - Döndürme yok */}
          <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
            <LinearGradient
              colors={feature.gradient}
              style={styles.iconGradient}
            >
              <Ionicons name={feature.icon} size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          
          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#0D1B2A' }]}>
              {feature.title}
            </Text>
            
            <Text style={[styles.cardDescription, { color: isDark ? '#CCCCCC' : '#666666' }]}>
              {feature.description}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      {features.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: currentSlide === index 
                ? (isDark ? '#FFD60A' : '#0D1B2A')
                : (isDark ? '#475569' : '#CBD5E1'),
              transform: [
                {
                  scale: currentSlide === index ? pulseAnim : new Animated.Value(1),
                },
              ],
            }
          ]}
        />
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {}} // Gesture dismiss kapalı
    >
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim,
              },
              {
                scale: scaleAnim,
              },
            ],
          }
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0A0A0A' : '#FFFFFF'} />
        
        {/* Renkli Background Pattern */}
        <Animated.View 
          style={[
            styles.backgroundPattern,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.patternCircle, 
              { 
                top: 50, 
                left: -50, 
                backgroundColor: isDark ? '#FFD60A30' : '#0D1B2A20' 
              },
              {
                transform: [
                  {
                    scale: pulseAnim,
                  },
                ],
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.patternCircle, 
              { 
                top: 200, 
                right: -80, 
                backgroundColor: isDark ? '#FFD60A25' : '#0D1B2A15' 
              },
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.05],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.patternCircle, 
              { 
                bottom: 100, 
                left: 20, 
                backgroundColor: isDark ? '#FFD60A20' : '#0D1B2A10' 
              },
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.05],
                      outputRange: [1, 0.9],
                    }),
                  },
                ],
              }
            ]} 
          />
        </Animated.View>

        {/* Animasyonlu Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -20],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.brandContainer}>
              <Animated.View 
                style={[
                  styles.logoContainer, 
                  { backgroundColor: isDark ? '#FFD60A' : '#0D1B2A' },
                  {
                    transform: [
                      {
                        scale: pulseAnim,
                      },
                    ],
                  }
                ]}
              >
                <Image 
                  source={require('../../../assets/okul-panel.png')} 
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#0D1B2A' }]}>
                Okul Panel
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
              onPress={handleSkip}
            >
              <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0D1B2A'} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Modern Main Content */}
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Animasyonlu Title Section */}
            <Animated.View 
              style={[
                styles.titleContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim,
                    },
                  ],
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.titleIcon, 
                  { backgroundColor: isDark ? '#FFD60A' : '#0D1B2A' },
                  {
                    transform: [
                      {
                        scale: pulseAnim,
                      },
                    ],
                  }
                ]}
              >
                <Ionicons name="rocket" size={32} color={isDark ? '#0D1B2A' : '#FFD60A'} />
              </Animated.View>
              <Text style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#0D1B2A' }]}>
                Yeni Özellikler
              </Text>
              <Text style={[styles.subTitle, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                v{CURRENT_APP_VERSION} ile gelen yenilikler
              </Text>
              <Animated.View 
                style={[
                  styles.versionBadge, 
                  { backgroundColor: isDark ? '#FFD60A' : '#0D1B2A' },
                  {
                    transform: [
                      {
                        scale: pulseAnim,
                      },
                    ],
                  }
                ]}
              >
                <Text style={[styles.versionText, { color: isDark ? '#0D1B2A' : '#FFD60A' }]}>
                  {role === 'teacher' ? 'Öğretmen' : 'Öğrenci'} Versiyonu
                </Text>
              </Animated.View>
            </Animated.View>

            {/* Features Carousel */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              style={styles.carousel}
            >
              {features.map((feature, index) => renderFeatureCard(feature, index))}
            </ScrollView>

            {/* Pagination */}
            {renderPagination()}
          </View>
        </ScrollView>

        {/* Modern Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: isDark ? '#FFD60A' : '#0D1B2A' }]}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={[styles.continueText, { color: isDark ? '#0D1B2A' : '#FFD60A' }]}>
              Uygulamaya Devam Et
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={isDark ? '#0D1B2A' : '#FFD60A'} 
              style={styles.continueIcon}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  versionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  carousel: {
    flex: 1,
    marginBottom: 20,
  },
  slide: {
    width: width - 40,
    paddingHorizontal: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    padding: 24,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  highlightText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40, // Safe area için daha fazla padding
    backgroundColor: 'transparent',
    zIndex: 1000, // Diğer elementlerin üstünde görünmesi için
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, // Daha büyük buton
    paddingHorizontal: 40, // Daha geniş buton
    borderRadius: 20, // Daha yuvarlak köşeler
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8, // Daha belirgin gölge
    minHeight: 60, // Minimum yükseklik
  },
  continueText: {
    fontSize: 18, // Daha büyük yazı
    fontWeight: '800', // Daha kalın yazı
    marginRight: 12, // Daha fazla boşluk
  },
  continueIcon: {
    marginLeft: 2,
  },
});

export default WhatsNewScreen;
