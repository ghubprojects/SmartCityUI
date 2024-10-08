import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

type LocationType = {
  latitude: number;
  longitude: number;
};

type PlaceType = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

const Map: React.FC = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [places, setPlaces] = useState<PlaceType[]>([]);
  const mapRef = useRef<MapView>(null);

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      setErrorMsg('Error fetching location');
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const moveToCurrentLocation = () => {
    if (location && mapRef.current) {
      const region: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const searchPlaces = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    if (!searchText) {
      Alert.alert('Error', 'Please enter a location type');
      return;
    }

    try {
      const apiUrl = `https://localhost:7266/Poi?type=${searchText}&lat=${location.latitude}&lon=${location.longitude}&distance=20000`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      const foundPlaces = data.places.map((place: any) => ({
        id: place.id,
        name: place.name,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      }));

      setPlaces(foundPlaces);
    } catch (error: any) {
      console.log('Error', 'Failed to fetch places', error);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Fetching location...</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for places (e.g. restaurant)"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchPlaces}>
          <MaterialIcons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        <Marker coordinate={location} title="You are here" />

        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            title={place.name}
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.button} onPress={moveToCurrentLocation}>
        <MaterialIcons name="my-location" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
});

export default Map;
