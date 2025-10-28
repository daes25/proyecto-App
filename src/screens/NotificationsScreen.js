import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";

export default function NotificationsScreen({ navigation }) {
  const [activeScreen, setActiveScreen] = useState("notifications");

  // 🔹 Datos de ejemplo
  const notifications = [
    { id: "1", section: "Recientes", text: "Se solucionó un problema en la app.", type: "info", time: "1 h" },
    { id: "2", section: "Recientes", text: "Carlos comenzó a seguirte.", type: "follow", time: "2 h" },
    { id: "3", section: "Recientes", text: "Ana comentó tu publicación.", type: "comment", time: "3 h" },
    { id: "4", section: "Esta semana", text: "Laura le dio me gusta a tu foto.", type: "like", time: "2 d" },
  ];

  // 🔹 Agrupar por sección
  const groupedNotifications = notifications.reduce((groups, item) => {
    const section = item.section;
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
    return groups;
  }, {});

  // 🔹 Navbar navigation handler
  const handleNav = (screen) => {
    setActiveScreen(screen);
    if (screen === "home") navigation.replace("Home");
    else if (screen === "search") navigation.replace("Search");
    else if (screen === "create") navigation.replace("Create");
    else if (screen === "notifications") navigation.replace("Notifications");
    else if (screen === "profilepreview") navigation.replace("ProfilePreview");
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>

      {/* 🔹 Lista de notificaciones */}
      <FlatList
        data={Object.keys(groupedNotifications)}
        keyExtractor={(item) => item}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            {groupedNotifications[section].map((notif) => (
              <View key={notif.id} style={styles.notification}>
                <Ionicons
                  name="person-circle-outline"
                  size={40}
                  color="#ccc"
                  style={styles.avatar}
                />

                <View style={styles.textContainer}>
                  <Text style={styles.text}>{notif.text}</Text>
                  <Text style={styles.time}>{notif.time}</Text>
                </View>

                {notif.type === "follow" && (
                  <TouchableOpacity style={styles.followBtn}>
                    <Text style={styles.followText}>Seguir</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
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
  avatar: { marginRight: 10 },
  textContainer: { flex: 1 },
  text: { fontSize: 14, color: "#000" },
  time: { fontSize: 12, color: "gray", marginTop: 2 },
  followBtn: {
    backgroundColor: "#1D9BF0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  followText: { color: "#fff", fontWeight: "600" },

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
