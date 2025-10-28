import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { Feather, FontAwesome, Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { auth, db } from "../services/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, onSnapshot, deleteDoc } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen({ navigation }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeScreen, setActiveScreen] = useState("home");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) setCurrentUserId(user.uid);
  }, []);

  // 🔹 Cargar publicaciones con imágenes Base64
  const loadPosts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "posts"), orderBy("creadoEn", "desc"));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const fetchedPosts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const postData = { id: docSnap.id, ...docSnap.data() };
            let authorData = {};

            if (postData.usuarioId) {
              const profileRef = doc(db, "profiles", postData.usuarioId);
              const profileSnap = await getDoc(profileRef);
              if (profileSnap.exists()) authorData = profileSnap.data();
            }

            // 🔸 Convertir Base64 en URI legible por React Native
            let mediaUri = null;
            if (postData.mediaBase64 && postData.mediaType === "image") {
              mediaUri = `data:image/jpeg;base64,${postData.mediaBase64}`;
            } else if (postData.mediaBase64 && postData.mediaType === "video") {
              mediaUri = `data:video/mp4;base64,${postData.mediaBase64}`;
            }

            return {
              ...postData,
              autorNombre: authorData.name || postData.autorNombre || "Usuario",
              autorFoto: authorData.photo || postData.autorFoto || null,
              media: mediaUri || postData.media || null,
            };
          })
        );

        setTweets(fetchedPosts);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.log("Error cargando posts:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = loadPosts();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
  };

  const toggleLike = (id) => {
    setTweets((prevTweets) =>
      prevTweets.map((tweet) =>
        tweet.id === id
          ? { ...tweet, liked: !tweet.liked, likes: tweet.liked ? tweet.likes - 1 : tweet.likes + 1 }
          : tweet
      )
    );
  };

  const handleDeletePost = (postId) => {
    Alert.alert("Eliminar publicación", "¿Seguro que quieres eliminar esta publicación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId));
          } catch (error) {
            console.log("Error eliminando post:", error);
          }
        },
      },
    ]);
  };

  const handleNav = (screen) => {
    setActiveScreen(screen);
    if (screen === "create") navigation.navigate("Create");
    else if (screen === "profilepreview") navigation.navigate("ProfilePreview", { userId: currentUserId });
    else if (screen === "logout") handleLogout();
    else {
      const screenName = screen.charAt(0).toUpperCase() + screen.slice(1);
      navigation.navigate(screenName);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
    }
  };

  const RenderImage = ({ uri }) => {
    const [aspectRatio, setAspectRatio] = useState(1);
    useEffect(() => {
      if (uri) {
        Image.getSize(uri, (w, h) => setAspectRatio(w / h), () => setAspectRatio(1));
      }
    }, [uri]);

    return (
      <Image
        source={{ uri }}
        style={{ width: "100%", aspectRatio, borderRadius: 10, marginVertical: 5 }}
        resizeMode="contain"
      />
    );
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D9BF0" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>SafeTweet</Text>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate("Search")}>
        <Feather name="search" size={20} color="#aaa" />
        <Text style={styles.fakeInput}>Buscar en SafeTweet</Text>
      </TouchableOpacity>

      <View style={styles.centerContent}>
        {tweets.length === 0 ? (
          <Text style={styles.noTweets}>Aún no hay publicaciones. ¡Crea la primera!</Text>
        ) : (
          <FlatList
            data={tweets}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D9BF0"]} />}
            renderItem={({ item }) => (
              <View style={styles.tweet}>
                <View style={styles.userInfo}>
                  {item.autorFoto ? (
                    <Image
                      source={{ uri: item.autorFoto }}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc" }}
                    />
                  ) : (
                    <Feather name="user" size={40} color="#bbb" />
                  )}
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <TouchableOpacity onPress={() => navigation.navigate("ProfilePreview", { userId: item.usuarioId })}>
                      <Text style={styles.username}>{item.autorNombre}</Text>
                      <Text style={styles.handle}>@{item.autorNombre}</Text>
                    </TouchableOpacity>
                  </View>
                  {item.usuarioId === currentUserId && (
                    <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
                      <Feather name="trash-2" size={22} color="red" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.contenido ? <Text style={styles.content}>{item.contenido}</Text> : null}
                {item.mediaType === "image" && item.media && <RenderImage uri={item.media} />}
                {item.mediaType === "video" && item.media && (
                  <Video
                    source={{ uri: item.media }}
                    style={{ width: "100%", height: 250, borderRadius: 10, marginVertical: 5, backgroundColor: "black" }}
                    useNativeControls
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.likes}>{item.likes || 0} Likes</Text>
                <View style={styles.actions}>
                  <Feather name="message-circle" size={20} color="gray" />
                  <Feather name="repeat" size={20} color="gray" />
                  <FontAwesome
                    name={item.liked ? "heart" : "heart-o"}
                    size={20}
                    color={item.liked ? "#e0245e" : "gray"}
                    onPress={() => toggleLike(item.id)}
                  />
                  <Feather name="share" size={20} color="gray" />
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* 🔹 Navbar */}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 10, color: "gray", fontSize: 16 },
  header: { paddingTop: 50, paddingBottom: 10, alignItems: "center", borderBottomWidth: 1, borderColor: "#eee" },
  appName: { fontSize: 24, fontWeight: "bold", color: "#1D9BF0" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 25,
    paddingHorizontal: 10,
    height: 40,
  },
  fakeInput: { color: "#aaa", marginLeft: 10, fontSize: 14 },
  centerContent: { flex: 1 },
  noTweets: { textAlign: "center", marginTop: 10, color: "gray" },
  tweet: { borderTopWidth: 0.5, borderColor: "#ddd", paddingHorizontal: 15, paddingVertical: 10 },
  userInfo: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  username: { fontWeight: "bold" },
  handle: { color: "gray", fontSize: 12 },
  content: { fontSize: 16, marginBottom: 5 },
  likes: { fontWeight: "bold", marginBottom: 5 },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 5 },
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
