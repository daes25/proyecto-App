import React, { useState } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableWithoutFeedback, Keyboard, Image, TouchableOpacity, ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // 🔍 Buscar usuarios en Firestore
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "profiles"));
      const allProfiles = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes(query.toLowerCase())) {
          allProfiles.push({
            id: doc.id,
            name: data.name,
            photo: data.photo || null,
          });
        }
      });
      setResults(allProfiles);
    } catch (error) {
      console.log("Error buscando perfiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOutsideClick = () => Keyboard.dismiss();

  const goToProfile = (userId) => {
    navigation.navigate("ProfilePreview", { userId });
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsideClick}>
      <View style={styles.container}>
        {/* 🔹 Header */}
        <View style={styles.header}>
          <Ionicons
            name="arrow-back"
            size={26}
            color="#000"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Buscar</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* 🔹 Buscador con lupa a la derecha */}
        <View style={styles.searchArea}>
          <TextInput
            placeholder="Buscar usuarios por nombre"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            autoFocus
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 🔹 Resultados */}
        {loading ? (
          <ActivityIndicator size="large" color="#1D9BF0" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => goToProfile(item.id)}
              >
                {item.photo ? (
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={45} color="#999" />
                )}
                <Text style={styles.resultName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noResults}>No se encontraron resultados.</Text>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        {/* 🔹 Navbar inferior */}
        <View style={styles.navBar}>
          <Ionicons
            name="home-outline"
            size={26}
            color="#000000"
            onPress={() => navigation.navigate("Home")}
          />
          <Ionicons
            name="search-outline"
            size={26}
            color="#1D9BF0"
            onPress={() => navigation.navigate("Search")}
          />
          <Ionicons
            name="add-circle-outline"
            size={26}
            color="#000000"
            onPress={() => navigation.navigate("Create")}
          />
          <Ionicons
            name="notifications-outline"
            size={26}
            color="#000000"
            onPress={() => navigation.navigate("Notifications")}
          />
          <Ionicons
            name="person-outline"
            size={26}
            color="#000000"
            onPress={() => navigation.navigate("ProfilePreview")}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  searchArea: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    borderColor: "#ccc",
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: "#1D9BF0",
    padding: 10,
    borderRadius: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  profileImage: { width: 45, height: 45, borderRadius: 22.5, marginRight: 10 },
  resultName: { fontSize: 16, fontWeight: "500" },
  noResults: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
    fontStyle: "italic",
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
});
