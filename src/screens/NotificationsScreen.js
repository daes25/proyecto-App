import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { auth, db } from "../services/firebaseConfig";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [activeScreen, setActiveScreen] = useState("notifications");
  const currentUserId = auth.currentUser.uid;

  useEffect(() => {
    const q = query(
      collection(db, "users", currentUserId, "notifications"),
      orderBy("creadoEn", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifs = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // Traer info del usuario que generó la notificación
          let remitenteNombre = "Usuario";
          let remitenteFoto = null;
          if (data.remitenteId) {
            const remitenteRef = doc(db, "profiles", data.remitenteId);
            const remitenteSnap = await getDoc(remitenteRef);
            if (remitenteSnap.exists()) {
              remitenteNombre = remitenteSnap.data().name || "Usuario";
              remitenteFoto = remitenteSnap.data().photo || null;
            }
          }

          return {
            id: docSnap.id,
            tipo: data.tipo,
            contenido: data.contenido,
            remitenteNombre,
            remitenteFoto,
            leido: data.leido,
            postId: data.postId,
            creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : null,
          };
        })
      );

      setNotifications(notifs);
    });

    return unsubscribe;
  }, []);

  const markAsRead = async (id) => {
    await updateDoc(doc(db, "users", currentUserId, "notifications", id), { leido: true });
  };

  const handleNav = (screen) => {
    setActiveScreen(screen);
    if (screen === "home") navigation.navigate("Home");
    else if (screen === "search") navigation.navigate("Search");
    else if (screen === "create") navigation.navigate("Create");
    else if (screen === "notifications") return;
    else if (screen === "profilepreview") navigation.navigate("ProfilePreview", { userId: currentUserId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10, paddingBottom: 70 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markAsRead(item.id)}
            style={[
              styles.notification,
              !item.leido && { backgroundColor: "#e6f0ff", padding: 10, borderRadius: 8 },
            ]}
          >
            {item.remitenteFoto ? (
              <Image source={{ uri: item.remitenteFoto }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc", marginRight: 10 }} />
            )}

            <View style={styles.textContainer}>
              <Text style={styles.text}>
                <Text style={{ fontWeight: "bold" }}>{item.remitenteNombre}</Text>{" "}
                {item.tipo === "comment"
                  ? "comentó en tu publicación:"
                  : item.tipo === "reply"
                  ? "respondió a tu comentario:"
                  : "notificación"}
              </Text>
              <Text style={styles.text}>{item.contenido}</Text>
              <Text style={styles.time}>{item.creadoEn ? item.creadoEn.toLocaleString() : ""}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
            No hay notificaciones
          </Text>
        }
      />

      {/* 🔹 Navbar inferior */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleNav("home")}>
          <Ionicons
            name="home-outline"
            size={26}
            color={activeScreen === "home" ? "#1D9BF0" : "#000000"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleNav("search")}>
          <AntDesign
            name="search1"
            size={24}
            color={activeScreen === "search" ? "#1D9BF0" : "#000000"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleNav("create")}>
          <MaterialIcons
            name="add-circle-outline"
            size={30}
            color={activeScreen === "create" ? "#1D9BF0" : "#000000"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleNav("notifications")}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={activeScreen === "notifications" ? "#1D9BF0" : "#000000"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleNav("profilepreview")}>
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={activeScreen === "profilepreview" ? "#1D9BF0" : "#000000"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  section: { marginBottom: 15, paddingHorizontal: 10 },
  sectionTitle: { fontWeight: "bold", fontSize: 15, marginBottom: 8, color: "#444" },
  notification: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  textContainer: { flex: 1 },
  text: { fontSize: 14, color: "#000" },
  time: { fontSize: 12, color: "gray", marginTop: 2 },
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
