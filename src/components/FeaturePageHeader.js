import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';

const FeaturePageHeader = ({ title, onBackPress, showBackButton = true, rightIcon, onRightIconPress, isInsideSafeArea = false }) => {
  // Sabit değerler kullan - flicker sorununu tamamen önler
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color="#1E293B" 
            />
          </TouchableOpacity>
        )}
        
        <Text style={[styles.title, { 
          color: "#1E293B",
          marginLeft: showBackButton ? 12 : 0
        }]}>
          {title}
        </Text>

        {rightIcon && (
          <TouchableOpacity 
            style={[styles.rightIconButton, { 
              backgroundColor: '#FFD60A',
              borderRadius: 20,
              shadowColor: '#FFD60A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }]} 
            onPress={onRightIconPress}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
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
    marginLeft: -8, // Touch area'yı genişletmek için
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  rightIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4, // Touch area'yı genişletmek için
  },
});

export default FeaturePageHeader;
