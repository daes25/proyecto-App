import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from "react-native";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Video } from "expo-av";
import { auth, db } from "../services/firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

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
          ? {
              ...tweet,
              liked: !tweet.liked,
              likes: tweet.liked ? tweet.likes - 1 : (tweet.likes || 0) + 1,
            }
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
    else if (screen === "profilepreview")
      navigation.navigate("ProfilePreview", { userId: currentUserId });
    else if (screen === "logout") handleLogout();
    else navigation.navigate(screen.charAt(0).toUpperCase() + screen.slice(1));
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
        style={{
          width: width - 30,
          height: undefined,
          aspectRatio,
          borderRadius: 12,
          marginTop: 10,
          alignSelf: "center",
        }}
        resizeMode="cover"
      />
    );
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D9BF0" />
        <Text style={styles.loadingText}>Cargando publicaciones...</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fijo */}
      <View style={styles.fixedHeader}>
        <Text style={styles.appName}>SafeTweet</Text>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate("Search")}
        >
          <Feather name="search" size={20} color="#aaa" />
          <Text style={styles.fakeInput}>Buscar en SafeTweet</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de publicaciones */}
      <FlatList
        data={tweets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1D9BF0"]}
          />
        }
        renderItem={({ item, index }) => (
          <>
            <View style={[styles.tweetCard, index === 0 && { marginTop: 130 }]}>
              <View style={styles.userInfo}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.autorFoto ? (
                    <Image source={{ uri: item.autorFoto }} style={styles.userImage} />
                  ) : (
                    <Feather name="user" size={40} color="#bbb" />
                  )}
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.username}>{item.autorNombre}</Text>
                    <Text style={styles.handle}>@{item.autorNombre}</Text>
                  </View>
                </View>

                {item.usuarioId === currentUserId && (
                  <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
                    <Feather name="trash-2" size={22} color="red" />
                  </TouchableOpacity>
                )}
              </View>

              {item.contenido ? (
                <Text style={styles.content}>{item.contenido}</Text>
              ) : null}

              {item.mediaType === "image" && item.media && <RenderImage uri={item.media} />}
              {item.mediaType === "video" && item.media && (
                <Video
                  source={{ uri: item.media }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="contain"
                />
              )}

              <View style={styles.actions}>
                <TouchableOpacity>
                  <Feather name="repeat" size={22} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleLike(item.id)}>
                  <FontAwesome
                    name={item.liked ? "heart" : "heart-o"}
                    size={22}
                    color={item.liked ? "#e0245e" : "gray"}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Feather name="download" size={22} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="bookmark-outline" size={22} color="gray" />
                </TouchableOpacity>
              </View>

              <Text style={styles.likes}>{item.likes || 0} Me gusta</Text>
            </View>

            {/* Línea divisoria con círculos */}
            <View style={styles.separatorContainer}>
              <View style={styles.circle} />
              <View style={styles.line} />
              <View style={styles.circle} />
            </View>
          </>
        )}
      />

      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleNav("home")}>
          <Ionicons
            name="home-outline"
            size={26}
            color={activeScreen === "home" ? "#1D9BF0" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("create")}>
          <MaterialIcons
            name="add-circle-outline"
            size={30}
            color={activeScreen === "create" ? "#1D9BF0" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("notifications")}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={activeScreen === "notifications" ? "#1D9BF0" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("profilepreview")}>
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={activeScreen === "profilepreview" ? "#1D9BF0" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("logout")}>
          <MaterialIcons name="logout" size={26} color="#e0245e" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  fixedHeader: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 1000,
  },
  appName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1D9BF0",
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 25,
    paddingHorizontal: 12,
    height: 42,
    width: "90%",
  },
  fakeInput: { color: "#aaa", marginLeft: 10, fontSize: 14 },
  postsList: {
    paddingTop: 20,
    paddingBottom: 60,
  },
  tweetCard: {
    backgroundColor: "#fff",
    marginBottom: 8,
    marginHorizontal: 10,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  username: { fontWeight: "bold", fontSize: 15 },
  handle: { color: "gray", fontSize: 12 },
  content: { marginTop: 8, fontSize: 15, color: "#333" },
  video: {
    width: width - 30,
    height: 280,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#000",
    alignSelf: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  likes: { marginTop: 4, color: "gray", textAlign: "right", fontSize: 13 },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1D9BF0",
  },
  line: {
    width: "80%",
    height: 1,
    backgroundColor: "#1D9BF0",
    marginHorizontal: 5,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "gray", fontSize: 16, marginTop: 10 },
});
