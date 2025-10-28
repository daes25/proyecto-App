import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Image
} from "react-native";
import { Ionicons, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { auth, db } from "../services/firebaseConfig";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { signOut } from "firebase/auth";

export default function CreateScreen({ navigation }) {
  const [post, setPost] = useState("");
  const [visibility, setVisibility] = useState("Público");
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaDescription, setMediaDescription] = useState("");
  const [profile, setProfile] = useState({ name: "Usuario", photo: null });
  const [activeScreen, setActiveScreen] = useState("create");

  // 📌 Cargar perfil
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, "profiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({
            name: docSnap.data().name || "Usuario",
            photo: docSnap.data().photo || null,
          });
        }
      } catch (error) {
        console.log("Error al obtener perfil:", error);
      }
    };
    fetchProfile();
  }, []);

  // 📸 Seleccionar media y convertir a Base64
  const pickMedia = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permiso requerido", "Permite acceso a tus archivos");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "image"
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const base64URI = type === "image"
        ? `data:image/jpeg;base64,${base64Data}`
        : `data:video/mp4;base64,${base64Data}`;

      setMedia(base64URI);
      setMediaType(type);
    }
  };

  // 📤 Publicar post
  const handlePublish = async () => {
    if (!post && !media) {
      Alert.alert("Error", "Debes agregar texto o media antes de publicar.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      let autorNombre = "Usuario";
      let autorFoto = null;

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        autorNombre = data.name || "Usuario";
        autorFoto = data.photo || null;
      }

      await addDoc(collection(db, "posts"), {
        usuarioId: user.uid,
        autorNombre,
        autorFoto,
        contenido: post,
        media: media || null, 
        mediaType: mediaType || null,
        mediaDescription: mediaDescription || "",
        visibility,
        likes: 0,
        creadoEn: serverTimestamp(),
      });

      Alert.alert("¡Listo!", "Tu publicación se ha realizado correctamente.");
      setPost("");
      setMedia(null);
      setMediaType(null);
      setMediaDescription("");
      setVisibility("Público");
      navigation.replace("Home");
    } catch (error) {
      console.log("Error publicando:", error);
      Alert.alert("Error", "No se pudo publicar la publicación.");
    }
  };

  const toggleVisibility = () => {
    setVisibility((prev) => (prev === "Público" ? "Privado" : "Público"));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.replace("Home")}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Crear publicación</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Usuario */}
        <View style={styles.userInfo}>
          {profile.photo ? (
            <Image
              source={{ uri: profile.photo }}
              style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#ccc" }}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={50} color="#444" />
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.username}>{profile.name}</Text>
            <TouchableOpacity style={styles.privacyBtn} onPress={toggleVisibility}>
              <Ionicons
                name={visibility === "Público" ? "earth-outline" : "lock-closed-outline"}
                size={14}
                color="black"
              />
              <Text style={{ marginLeft: 4 }}>{visibility}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido */}
        <TextInput
          style={styles.input}
          placeholder="Publica una actualización de estado..."
          placeholderTextColor="#777"
          multiline
          value={post}
          onChangeText={setPost}
        />

        {/* Botones de media */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity style={styles.option} onPress={() => pickMedia("image")}>
            <MaterialIcons name="photo-library" size={22} color="#1D9BF0" />
            <Text style={styles.optionText}>Agregar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => pickMedia("video")}>
            <MaterialIcons name="videocam" size={22} color="#1D9BF0" />
            <Text style={styles.optionText}>Agregar Video</Text>
          </TouchableOpacity>
        </View>

        {/* Vista previa */}
        {media && (
          <View style={{ marginTop: 20 }}>
            {mediaType === "image" ? (
              <Image source={{ uri: media }} style={{ width: "100%", height: 200, borderRadius: 10 }} />
            ) : (
              <Text style={{ color: "gray" }}>🎥 Video seleccionado</Text>
            )}
            <TextInput
              style={styles.mediaInput}
              placeholder="Agrega una descripción..."
              placeholderTextColor="#777"
              value={mediaDescription}
              onChangeText={setMediaDescription}
            />
          </View>
        )}
      </ScrollView>

      {/* Botón publicar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
          <Text style={styles.publishBtnText}>PUBLICAR</Text>
        </TouchableOpacity>
      </View>

      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleNav("home")}>
          <Ionicons name="home-outline" size={26} color={activeScreen === "home" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("search")}>
          <AntDesign name="search1" size={24} color={activeScreen === "search" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("create")}>
          <MaterialIcons name="add-circle-outline" size={30} color={activeScreen === "create" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("notifications")}>
          <Ionicons name="notifications-outline" size={24} color={activeScreen === "notifications" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("profilepreview")}>
          <Ionicons name="person-circle-outline" size={26} color={activeScreen === "profilepreview" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("logout")}>
          <MaterialIcons name="logout" size={26} color="#e0245e" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 15, paddingBottom: 160 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 40,
  },
  headerText: { fontSize: 18, fontWeight: "bold" },
  userInfo: { flexDirection: "row", alignItems: "center", marginVertical: 15 },
  username: { fontWeight: "bold", fontSize: 16 },
  privacyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    padding: 5,
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  optionText: { marginLeft: 10, fontSize: 15 },
  footer: { borderTopWidth: 1, borderColor: "#eee", padding: 10, backgroundColor: "#fff", marginBottom: 60 },
  publishBtn: { backgroundColor: "#1D9BF0", padding: 12, borderRadius: 15, alignItems: "center", marginBottom: 10 },
  publishBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  mediaInput: { fontSize: 14, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 8, marginTop: 10 },
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
