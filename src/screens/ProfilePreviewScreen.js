import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, ActivityIndicator, Alert, Modal 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const ProfilePreviewScreen = ({ navigation, route }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState("profilepreview");

  const { userId } = route.params || {};

  const fetchProfile = async () => {
    try {
      let uidToLoad = userId || auth.currentUser?.uid;
      if (!uidToLoad) return;

      const docRef = doc(db, "profiles", uidToLoad);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setProfile({
          name: "Usuario",
          bio: "Agrega una pequeña biografía...",
          age: "",
          gender: "",
          location: "",
          following: 0,
          followers: 0,
          photo: null,
          banner: null,
        });
      }
    } catch (error) {
      console.log("Error al obtener el perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchProfile);
    return unsubscribe;
  }, [navigation, userId]);

  // 📸 Seleccionar imagen de galería y guardar como Base64
  const pickImageFromGallery = async () => {
    if (userId && userId !== auth.currentUser?.uid) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso requerido", "Necesitas permitir acceso a tus fotos para continuar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateProfilePhoto(base64Img);
      }
    } catch (error) {
      console.error("Error al abrir galería:", error);
      Alert.alert("Error", "No se pudo abrir la galería.");
    } finally {
      setModalVisible(false);
    }
  };

  // 📷 Tomar foto con cámara y guardar como Base64
  const takePhotoWithCamera = async () => {
    if (userId && userId !== auth.currentUser?.uid) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitas dar acceso a la cámara.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await updateProfilePhoto(base64Img);
    }
    setModalVisible(false);
  };

  // 🧩 Guardar Base64 en Firestore
  const updateProfilePhoto = async (base64Img) => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "profiles", user.uid), { photo: base64Img }, { merge: true });
      fetchProfile();
    }
  };

  const handleNav = (screen) => {
    setActiveScreen(screen);
    if (screen === "home") navigation.replace("Home");
    else if (screen === "search") navigation.replace("Search");
    else if (screen === "create") navigation.replace("Create");
    else if (screen === "notifications") navigation.replace("Notifications");
    else if (screen === "profilepreview") navigation.replace("ProfilePreview");
    else if (screen === "logout") handleLogout();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#007bff", "#00c6ff"]} style={styles.banner} />

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={() => !userId || userId === auth.currentUser?.uid ? setModalVisible(true) : null}>
          <LinearGradient colors={["#007bff", "#00c6ff"]} style={styles.avatarWrapper}>
            <Image
              source={{
                uri: profile.photo
                  ? profile.photo
                  : "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
          </LinearGradient>
        </TouchableOpacity>

        {!userId || userId === auth.currentUser?.uid ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.replace("EditProfile")}
          >
            <Text style={styles.editText}>Editar Perfil</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.username}>@{profile.name || "usuario"}</Text>
        {profile.age ? <Text style={styles.extra}>Edad: {profile.age}</Text> : null}
        {profile.gender ? <Text style={styles.extra}>Género: {profile.gender}</Text> : null}
        <Text style={styles.bio}>{profile.bio}</Text>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <Image
            source={{
              uri: profile.photo
                ? profile.photo
                : "https://via.placeholder.com/150",
            }}
            style={styles.modalImage}
          />
          <View style={styles.modalOptions}>
            <TouchableOpacity style={styles.optionButton} onPress={takePhotoWithCamera}>
              <Text style={styles.optionText}>📸 Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
              <Text style={styles.optionText}>🖼️ Elegir de galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.optionText}>❌ Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleNav("home")}>
          <Ionicons name="home-outline" size={26} color={activeScreen === "home" ? "#1D9BF0" : "#000000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("search")}>
          <AntDesign name="search1" size={24} color={activeScreen === "search" ? "#1D9BF0" : "#000000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("create")}>
          <MaterialIcons name="add-circle-outline" size={30} color={activeScreen === "create" ? "#1D9BF0" : "#000000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("notifications")}>
          <Ionicons name="notifications-outline" size={24} color={activeScreen === "notifications" ? "#1D9BF0" : "#000000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("profilepreview")}>
          <Ionicons name="person-circle-outline" size={26} color={activeScreen === "profilepreview" ? "#1D9BF0" : "#000000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("logout")}>
          <MaterialIcons name="logout" size={26} color="#e0245e" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  banner: { width: "100%", height: 160, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  avatarContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: -60 },
  avatarWrapper: { width: 108, height: 108, borderRadius: 54, justifyContent: "center", alignItems: "center", padding: 3 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "white", backgroundColor: "#e0e0e0" },
  editButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 25, backgroundColor: "#007bff" },
  editText: { fontSize: 14, fontWeight: "600", color: "white" },
  infoContainer: { paddingHorizontal: 20, marginTop: 15 },
  name: { fontSize: 22, fontWeight: "bold" },
  username: { fontSize: 15, color: "gray", marginTop: 4 },
  bio: { fontSize: 14, marginTop: 6 },
  extra: { fontSize: 14, color: "gray", marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalImage: { width: 280, height: 280, borderRadius: 20, marginBottom: 20, borderWidth: 3, borderColor: "#fff" },
  modalOptions: { width: "100%", marginTop: 10 },
  optionButton: { padding: 14, backgroundColor: "#007bff", borderRadius: 15, marginVertical: 5, alignItems: "center" },
  cancelButton: { padding: 14, backgroundColor: "#ff4444", borderRadius: 15, marginVertical: 5, alignItems: "center" },
  optionText: { color: "white", fontSize: 16, fontWeight: "600" },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
});

export default ProfilePreviewScreen;
