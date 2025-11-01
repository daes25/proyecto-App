import React, { useState, useEffect, useCallback, memo } from "react";
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
  TextInput,
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Video } from "expo-av"; // (Revertido a expo-av por si no instalaste expo-video)
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
  addDoc,
  getDocs,
  where,
  updateDoc,
  setDoc, // --- NUEVO ---: Para crear likes
  increment, // --- NUEVO ---: Para contadores atómicos
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// --- INICIO DE COMPONENTES AUXILIARES ---
// (buildCommentTree, CommentItem, RenderImage: Sin cambios)

const buildCommentTree = (commentsList) => {
  const map = {};
  const tree = [];
  commentsList.forEach(comment => {
    map[comment.id] = { ...comment, replies: [], level: 0 };
  });
  commentsList.forEach(comment => {
    if (comment.parentId) {
      const parent = map[comment.parentId];
      if (parent) {
        map[comment.id].level = parent.level + 1;
        parent.replies.push(map[comment.id]);
      }
    } else {
      tree.push(map[comment.id]);
    }
  });
  return tree;
};

const CommentItem = memo(({
  comment,
  postId,
  currentUserId,
  onReplyPress,
  activeReplyTarget,
  replyText,
  setReplyText,
  onPostReply,
  onDeleteComment
}) => {
  const isReplying = activeReplyTarget && activeReplyTarget.commentId === comment.id;
  return (
    <View style={{ marginLeft: comment.level > 0 ? 20 : 0, marginTop: 8 }}>
      <View style={styles.comment}>
        {comment.foto ? (
          <Image source={{ uri: comment.foto }} style={styles.commentPhoto} />
        ) : (
          <Feather name="user" size={24} color="#bbb" style={{ marginRight: 5 }} />
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={styles.commentUser}>{comment.nombre}</Text>
              <Text style={styles.commentText}>{comment.contenido}</Text>
            </View>
            {comment.usuarioId === currentUserId && (
              <TouchableOpacity onPress={() => onDeleteComment(postId, comment.id)}>
                <Feather name="trash-2" size={18} color="red" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={{ alignSelf: "flex-start", marginTop: 4 }}
            onPress={() => onReplyPress(comment)}
          >
            <Text style={styles.replyButton}>Responder</Text>
          </TouchableOpacity>
        </View>
      </View>
      {isReplying && (
        <View style={[styles.commentInputContainer, { marginLeft: 38, marginTop: 8 }]}>
          <TextInput
            style={styles.commentInput}
            placeholder={`Respondiendo a ${comment.nombre}...`}
            value={replyText}
            onChangeText={setReplyText}
          />
          <TouchableOpacity onPress={onPostReply} style={styles.commentSend}>
            <Ionicons name="send" size={24} color="#1D9BF0" />
          </TouchableOpacity>
        </View>
      )}
      {(comment.replies || []).map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          currentUserId={currentUserId}
          onReplyPress={onReplyPress}
          activeReplyTarget={activeReplyTarget}
          replyText={replyText}
          setReplyText={setReplyText}
          onPostReply={onPostReply}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </View>
  );
});

const RenderImage = memo(({ uri }) => {
  const [aspectRatio, setAspectRatio] = useState(1);
  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (w, h) => setAspectRatio(w / h), () => setAspectRatio(1));
    }
  }, [uri]);
  return (
    <Image
      source={{ uri }}
      style={{ width: width - 30, height: undefined, aspectRatio, borderRadius: 12, marginTop: 10, alignSelf: "center" }}
      resizeMode="cover"
    />
  );
});

const PostItem = memo(({
  item,
  index,
  currentUserId,
  activeCommentPost,
  setActiveCommentPost,
  activeReplyTarget,
  setActiveReplyTarget,
  commentText,
  setCommentText,
  replyText,
  setReplyText,
  expandedComments,
  setExpandedComments,
  handleDeletePost,
  toggleLike,
  handleAddComment,
  handleAddReply,
  handleDeleteComment,
}) => {

  const isCommenting = activeCommentPost === item.id;
  const handleReplyPress = (comment) => {
    setActiveReplyTarget(
      (prev) => (prev && prev.commentId === comment.id)
        ? null
        : {
          postId: item.id,
          commentId: comment.id,
          commentOwnerId: comment.usuarioId,
          commentNombre: comment.nombre,
        }
    );
  };

  return (
    <View>
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
        {item.contenido && <Text style={styles.content}>{item.contenido}</Text>}
        {item.mediaType === "image" && item.media && <RenderImage uri={item.media} />}
        {item.mediaType === "video" && item.media && (
          <Video
            style={styles.video}
            source={{ uri: item.media }}
            useNativeControls // Revertido a 'expo-av'
            resizeMode="contain"
          />
        )}
        <View style={styles.actions}>
          <TouchableOpacity>
            <Feather name="repeat" size={22} color="gray" />
          </TouchableOpacity>

          {/* --- MODIFICADO ---: Pasa más info a toggleLike */}
          <TouchableOpacity onPress={() => toggleLike(item.id, item.usuarioId, item.liked)}>
            <FontAwesome name={item.liked ? "heart" : "heart-o"} size={22} color={item.liked ? "#e0245e" : "gray"} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveCommentPost(isCommenting ? null : item.id)}>
            <Ionicons name="chatbubble-outline" size={22} color="gray" />
          </TouchableOpacity>
        </View>
        {/* Usamos 'item.likes' que ahora viene de Firestore */}
        <Text style={styles.likes}>{item.likes || 0} Me gusta</Text>

        {(item.comments || [])
          .slice(0, expandedComments[item.id] ? item.comments.length : 3)
          .map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={item.id}
              currentUserId={currentUserId}
              onReplyPress={handleReplyPress}
              activeReplyTarget={activeReplyTarget}
              replyText={replyText}
              setReplyText={setReplyText}
              onPostReply={handleAddReply}
              onDeleteComment={handleDeleteComment}
            />
          ))}

        {item.comments.length > 3 && (
          <TouchableOpacity
            onPress={() =>
              setExpandedComments((prev) => ({
                ...prev,
                [item.id]: !prev[item.id],
              }))
            }
          >
            <Text style={{ color: "#1D9BF0", marginLeft: 10, marginTop: 4 }}>
              {expandedComments[item.id] ? "Ver menos comentarios..." : "Ver más comentarios..."}
            </Text>
          </TouchableOpacity>
        )}

        {isCommenting && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity onPress={() => handleAddComment(item.id, item.usuarioId)} style={styles.commentSend}>
              <Ionicons name="send" size={24} color="#1D9BF0" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.separatorContainer}>
        <View style={styles.circle} />
        <View style={styles.line} />
        <View style={styles.circle} />
      </View>
    </View>
  );
});


// --- COMPONENTE PRINCIPAL HOMESCREEN ---

export default function HomeScreen({ navigation }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeScreen, setActiveScreen] = useState("home");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [activeReplyTarget, setActiveReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) setCurrentUserId(user.uid);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(
      collection(db, "users", currentUserId, "notifications"),
      where("leido", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });
    return unsubscribe;
  }, [currentUserId]);

  // --- MODIFICADO ---: loadPosts ahora también trae los likes
  const loadPosts = async () => {
    // Agregamos un guard para esperar a que el currentUserId esté listo
    if (!currentUserId) return;

    try {
      setLoading(true);
      const q = query(collection(db, "posts"), orderBy("creadoEn", "desc"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const fetchedPosts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const postData = { id: docSnap.id, ...docSnap.data() };

            // ... (Lógica de autor y media sin cambios)
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

            // ... (Lógica de comentarios sin cambios)
            const commentsQuery = query(
              collection(db, "posts", postData.id, "comments"),
              orderBy("creadoEn", "asc")
            );
            const commentsSnap = await getDocs(commentsQuery);
            const allCommentsList = commentsSnap.docs.map(c => ({ id: c.id, ...c.data() }));
            const commentsData = buildCommentTree(allCommentsList);

            // --- NUEVO ---: Verificar si el usuario actual le ha dado like
            let userHasLiked = false;
            const likeRef = doc(db, "posts", postData.id, "likes", currentUserId);
            const likeSnap = await getDoc(likeRef);
            userHasLiked = likeSnap.exists();
            // --- FIN NUEVO ---

            return {
              ...postData,
              autorNombre: authorData.name || postData.autorNombre || "Usuario",
              autorFoto: authorData.photo || postData.autorFoto || null,
              media: mediaUri || postData.media || null,
              comments: commentsData,
              // --- NUEVO ---: Usar los datos de likes de Firestore
              likes: postData.likesCount || 0, // Usamos el contador del post
              liked: userHasLiked, // El estado específico de este usuario
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

  // --- MODIFICADO ---: Los efectos ahora dependen de 'currentUserId'
  useEffect(() => {
    if (!currentUserId) return; // No cargar posts hasta tener el ID
    const unsub = loadPosts();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [currentUserId]); // Depende de currentUserId

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return; // No cargar posts hasta tener el ID
      loadPosts();
    }, [currentUserId]) // Depende de currentUserId
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
  };

  // --- MODIFICADO ---: Lógica de 'toggleLike' completamente nueva
  const toggleLike = async (postId, postOwnerId, isCurrentlyLiked) => {
    if (!currentUserId) return; // Guard

    const postRef = doc(db, "posts", postId);
    const likeRef = doc(db, "posts", postId, "likes", currentUserId);

    // Actualización optimista de la UI (para que se sienta instantáneo)
    setTweets((prevTweets) =>
      prevTweets.map((tweet) =>
        tweet.id === postId
          ? {
            ...tweet,
            liked: !isCurrentlyLiked,
            likes: isCurrentlyLiked ? tweet.likes - 1 : tweet.likes + 1,
          }
          : tweet
      )
    );

    try {
      if (isCurrentlyLiked) {
        // --- Lógica para QUITAR LIKE ---
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likesCount: increment(-1) // Resta 1 al contador
        });
      } else {
        // --- Lógica para DAR LIKE ---
        await setDoc(likeRef, { // Usamos setDoc con el ID del usuario
          usuarioId: currentUserId,
          creadoEn: new Date()
        });
        await updateDoc(postRef, {
          likesCount: increment(1) // Suma 1 al contador
        });

        // --- Lógica de Notificación ---
        if (currentUserId !== postOwnerId) {
          const notifRef = collection(db, "users", postOwnerId, "notifications");
          await addDoc(notifRef, {
            tipo: "like", // ¡Nuevo tipo de notificación!
            postId: postId,
            remitenteId: currentUserId,
            contenido: "Le ha gustado tu publicación.",
            leido: false,
            creadoEn: new Date(),
          });
        }
      }
    } catch (error) {
      console.log("Error en toggleLike:", error);
      // Si falla, revertir la actualización optimista
      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet.id === postId
            ? {
              ...tweet,
              liked: isCurrentlyLiked, // Revertir al estado original
              likes: isCurrentlyLiked ? tweet.likes + 1 : tweet.likes - 1, // Revertir contador
            }
            : tweet
        )
      );
    }
  };

  // --- Funciones de Comentarios (Sin cambios) ---
  const handleAddComment = async (postId, postOwnerId) => {
    if (!commentText) return;
    try {
      const user = auth.currentUser;
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      let nombre = "Usuario";
      let foto = null;
      if (profileSnap.exists()) {
        nombre = profileSnap.data().name || "Usuario";
        foto = profileSnap.data().photo || null;
      }
      const commentRef = collection(db, "posts", postId, "comments");
      await addDoc(commentRef, {
        usuarioId: user.uid,
        nombre,
        foto,
        contenido: commentText,
        creadoEn: new Date(),
        parentId: null,
      });
      if (user.uid !== postOwnerId) {
        const notifRef = collection(db, "users", postOwnerId, "notifications");
        await addDoc(notifRef, {
          tipo: "comment",
          postId,
          remitenteId: user.uid,
          contenido: commentText,
          leido: false,
          creadoEn: new Date(),
        });
      }
      setCommentText("");
    } catch (error) {
      console.log("Error agregando comentario:", error);
    }
  };

  const handleAddReply = async () => {
    if (!replyText || !activeReplyTarget) return;
    const { postId, commentId, commentOwnerId } = activeReplyTarget;
    const user = auth.currentUser;
    try {
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const nombre = profileSnap.exists() ? profileSnap.data().name : "Usuario";
      const foto = profileSnap.exists() ? profileSnap.data().photo : null;
      const replyRef = collection(db, "posts", postId, "comments");
      await addDoc(replyRef, {
        usuarioId: user.uid,
        nombre,
        foto,
        contenido: replyText,
        creadoEn: new Date(),
        parentId: commentId,
        replyToUserId: commentOwnerId,
      });
      if (user.uid !== commentOwnerId) {
        const notifRef = collection(db, "users", commentOwnerId, "notifications");
        await addDoc(notifRef, {
          tipo: "reply",
          postId,
          commentId,
          remitenteId: user.uid,
          contenido: replyText,
          leido: false,
          creadoEn: new Date(),
        });
      }
      setReplyText("");
      setActiveReplyTarget(null);
    } catch (error) {
      console.log("Error agregando respuesta:", error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    Alert.alert("Eliminar comentario", "¿Deseas eliminar este comentario? (Las respuestas también se eliminarán)", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId, "comments", commentId));
          } catch (error) {
            console.log("Error eliminando comentario:", error);
          }
        },
      },
    ]);
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

  const renderItem = useCallback(({ item, index }) => {
    return (
      <PostItem
        item={item}
        index={index}
        currentUserId={currentUserId}
        activeCommentPost={activeCommentPost}
        setActiveCommentPost={setActiveCommentPost}
        activeReplyTarget={activeReplyTarget}
        setActiveReplyTarget={setActiveReplyTarget}
        commentText={commentText}
        setCommentText={setCommentText}
        replyText={replyText}
        setReplyText={setReplyText}
        expandedComments={expandedComments}
        setExpandedComments={setExpandedComments}
        handleDeletePost={handleDeletePost}
        toggleLike={toggleLike} // Se pasa la nueva función
        handleAddComment={handleAddComment}
        handleAddReply={handleAddReply}
        handleDeleteComment={handleDeleteComment}
      />
    );
  }, [
    currentUserId,
    activeCommentPost,
    activeReplyTarget,
    commentText,
    replyText,
    expandedComments
  ]);


  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D9BF0" />
        <Text style={styles.loadingText}>Cargando publicaciones...</Text>
      </View>
    );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <Text style={styles.appName}>SafeTweet</Text>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate("Search")}>
          <Feather name="search" size={20} color="#aaa" />
          <Text style={styles.fakeInput}>Buscar en SafeTweet</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tweets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D9BF0"]} />}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleNav("home")}>
          <Ionicons name="home-outline" size={26} color={activeScreen === "home" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("create")}>
          <MaterialIcons name="add-circle-outline" size={30} color={activeScreen === "create" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("notifications")}>
          <Ionicons name="notifications-outline" size={24} color={activeScreen === "notifications" ? "#1D9BF0" : "#000"} />
          {unreadNotifications > 0 && (
            <View style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#1D9BF0",
            }} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("profilepreview")}>
          <Ionicons name="person-circle-outline" size={26} color={activeScreen === "profilepreview" ? "#1D9BF0" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("logout")}>
          <MaterialIcons name="logout" size={26} color="#e0245e" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Estilos (Sin cambios)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  fixedHeader: { backgroundColor: "#fff", paddingTop: 50, paddingBottom: 10, borderBottomWidth: 1, borderColor: "#eee", alignItems: "center", position: "absolute", top: 0, width: "100%", zIndex: 1000 },
  appName: { fontSize: 26, fontWeight: "bold", color: "#1D9BF0", marginBottom: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f1f1", borderRadius: 25, paddingHorizontal: 12, height: 42, width: "90%" },
  fakeInput: { color: "#aaa", marginLeft: 10, fontSize: 14 },
  postsList: { paddingTop: 20, paddingBottom: 60 },
  tweetCard: { backgroundColor: "#fff", marginBottom: 8, marginHorizontal: 10, padding: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  userInfo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  userImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc" },
  username: { fontWeight: "bold", fontSize: 15 },
  handle: { color: "gray", fontSize: 12 },
  content: { marginTop: 8, fontSize: 15, color: "#333" },
  video: { width: width - 30, height: 280, borderRadius: 12, marginTop: 10, backgroundColor: "#000", alignSelf: "center" },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  likes: { marginTop: 4, color: "gray", textAlign: "right", fontSize: 13 },
  navBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  separatorContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 5 },
  circle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1D9BF0" },
  line: { width: width - 50, height: 1, backgroundColor: "#eee", marginHorizontal: 5 },
  comment: {
    flexDirection: "row",
    marginTop: 8,
  },
  commentPhoto: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  commentUser: { fontWeight: "bold", fontSize: 13 },
  commentText: { fontSize: 13 },
  commentInputContainer: { flexDirection: "row", alignItems: "center", marginTop: 6, marginHorizontal: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
  commentSend: { marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#333" },
  replyButton: {
    fontSize: 12,
    color: "gray",
    fontWeight: "500",
  },
});