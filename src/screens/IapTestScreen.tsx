import Constants from 'expo-constants';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePremiumStore } from '../store/premiumStore';

// ⚠️ REPLACE THIS with your actual ID from Google Play Console later
const PRODUCT_ID = 'dharma_premium_lifetime';

// 📖 YOUR BOOK DATA
const BOOK_ID = 'HnSlEQAAQBAJ';
const BOOK_URL = `https://play.google.com/store/books/details?id=${BOOK_ID}`;

// 🎵 SPOTIFY DATA (Updated with your link)
const SPOTIFY_URL = 'https://open.spotify.com/artist/4Kg2Tc3I1sC1zMPiwYeX2x'; 

// ✅ FIX: Kept the name "IapTestScreen" so your navigation keeps working
export const IapTestScreen: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const iapRef = useRef<any>(null);
  
  const isExpoGo = Constants.appOwnership === 'expo' || Platform.OS === 'web';
  const { isPremium, setPremium, loadPremiumCache } = usePremiumStore();

  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const setupIAP = async () => {
      if (isExpoGo) {
        await loadPremiumCache();
        return;
      }
      try {
        const iap = await import('react-native-iap');
        iapRef.current = iap;
        await iap.initConnection();
        await loadPremiumCache();

        purchaseUpdateSubscription = iap.purchaseUpdatedListener(
          async (purchase: any) => {
            try {
              await iap.finishTransaction({ purchase, isConsumable: false });
              await setPremium(true);
              Alert.alert('Thank You! 🙏', 'Your support helps keep Dharma Marga alive.');
            } catch (error: any) {
              console.error('Transaction Error:', error);
            }
          }
        );

        purchaseErrorSubscription = iap.purchaseErrorListener(
          async (error: any) => {
            if (error?.code === 'E_ALREADY_OWNED') {
              await restorePurchases();
            }
          }
        );

        await fetchProductsData();
      } catch (error: any) {
        console.error('IAP Init Error:', error);
      }
    };

    setupIAP();

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      if (iapRef.current) iapRef.current.endConnection();
    };
  }, []);

  const fetchProductsData = async () => {
    if (!iapRef.current) return;
    try {
      setLoading(true);
      const productsList = await iapRef.current.fetchProducts({ skus: [PRODUCT_ID] });
      setProducts(productsList || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!iapRef.current) return;
    try {
      setRestoring(true);
      const purchases = await iapRef.current.getAvailablePurchases();
      const ownsPremium = purchases.some((p: any) => p.productId === PRODUCT_ID);
      await setPremium(ownsPremium);
      if (ownsPremium) Alert.alert('Welcome Back', 'Premium restored! ✅');
      else Alert.alert('Restore', 'No previous purchases found.');
    } catch (error: any) {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handleBuy = async () => {
    if (!iapRef.current) return;
    try {
      await iapRef.current.requestPurchase({
        type: 'in-app',
        request: { google: { skus: [PRODUCT_ID] }, apple: { sku: PRODUCT_ID } },
      });
    } catch (error) { }
  };

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('Error', 'Could not open link.');
  };

  // Render "Premium Active" State
  if (isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.premiumTitle}>Premium Unlocked</Text>
          <Text style={styles.premiumEmoji}>✨🕉️✨</Text>
          <Text style={styles.description}>
            Thank you for supporting DharmaWeave.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Products from DharmaWeave</Text>
          <Text style={styles.subtitle}>Wisdom, Art, and Devotion.</Text>
        </View>

        {/* 📚 BOOK SECTION (Top Priority) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Featured Book</Text>
          <TouchableOpacity 
            style={styles.bookCard} 
            onPress={() => openLink(BOOK_URL)} 
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: `https://books.google.com/books/content?id=${BOOK_ID}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api` }} 
              style={styles.bookCover}
              resizeMode="cover"
            />
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>Hanuman</Text>
              <Text style={styles.bookAuthor}>by Anant Swarup</Text>
              <Text style={styles.bookDesc} numberOfLines={3}>
                To him, the sun was just a sweet fruit. To the world, he is the ultimate guardian.
              </Text>
              <Text style={styles.linkText}>Get it on Google Play ➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🎵 MUSIC SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Official Music</Text>
          <TouchableOpacity 
            style={styles.musicCard} 
            onPress={() => openLink(SPOTIFY_URL)}
            activeOpacity={0.9}
          >
            <View style={styles.musicIconContainer}>
              <Text style={styles.musicIcon}>🎧</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>DharmaWeave Chants</Text>
              <Text style={styles.bookDesc}>
                Listen to our sacred mantras and devotional tracks in high quality.
              </Text>
              <Text style={[styles.linkText, { color: '#1DB954' }]}>Listen on Spotify ➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 💎 PREMIUM SECTION */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumCardTitle}>Support Our Work</Text>
            <Text style={styles.premiumCardSubtitle}>Unlock the full app potential</Text>
          </View>
          
          <View style={styles.featuresList}>
            <FeatureRow icon="📖" text="Access Full Wisdom Library" />
            <FeatureRow icon="🕉️" text="Support Future Development" />
          </View>

          <View style={styles.actionArea}>
            {loading ? (
              <ActivityIndicator color="#fbbf24" size="large" />
            ) : (
              <TouchableOpacity 
                style={styles.buyButton} 
                onPress={handleBuy}
                activeOpacity={0.8}
              >
                <Text style={styles.buyButtonText}>
                  {products.length > 0 
                    ? `Unlock Premium - ${products[0].price}` 
                    : "Unlock Premium"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.restoreButton} 
              onPress={restorePurchases} 
              disabled={restoring}
            >
              <Text style={styles.restoreText}>
                {restoring ? "Checking..." : "Restore Previous Purchase"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isExpoGo && (
          <Text style={styles.devNote}>
            Note: Payment testing is disabled in Expo Go.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const FeatureRow = ({ icon, text }: { icon: string, text: string }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
    marginLeft: 4,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  bookCover: {
    width: 70,
    height: 105,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  bookTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  bookDesc: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  linkText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
  },
  musicCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  musicIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  musicIcon: {
    fontSize: 28,
  },
  premiumCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  premiumHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  premiumCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  premiumCardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  actionArea: {
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    padding: 12,
  },
  restoreText: {
    color: '#94a3b8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 16,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
  },
  devNote: {
    marginTop: 20,
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
  },
});