import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

export default function LoginScreen() {
  // 🔹 Estado para login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 🔹 Estado para registro
  const [isRegistering, setIsRegistering] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 🔹 Estado para reset password
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // 🔹 Login con Firebase
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      // AppNavigator maneja la navegación automáticamente
    } catch (error) {
      console.log("Error al iniciar sesión:", error.code);
      switch (error.code) {
        case 'auth/invalid-email':
          Alert.alert('Correo inválido', 'El formato del correo no es correcto.');
          break;
        case 'auth/wrong-password':
          Alert.alert('Contraseña incorrecta', 'Verifica tu contraseña e inténtalo de nuevo.');
          break;
        case 'auth/user-not-found':
          Alert.alert('Cuenta no encontrada', 'No existe ninguna cuenta con este correo. Regístrate primero.');
          break;
        case 'auth/too-many-requests':
          Alert.alert(
            'Demasiados intentos',
            'Tu cuenta ha sido temporalmente bloqueada por varios intentos fallidos. Intenta más tarde o restablece tu contraseña.'
          );
          break;
        default:
          Alert.alert('Error', error.message);
      }
    }
  };

  // 🔹 Registro con Firebase (solo correo y contraseña)
  const handleRegister = async () => {
    if (!newEmail || !newPassword) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      const user = userCredential.user;

      // Guardar perfil en Firestore (solo correo al inicio)
      await setDoc(doc(db, "profiles", user.uid), {
        email: newEmail,
        username: "" // vacío, lo podrá actualizar en editar perfil
      });

      setTimeout(() => {
        Alert.alert(
          "Cuenta creada",
          `Tu cuenta fue creada exitosamente.`
        );

        // Limpiar formulario
        setNewEmail('');
        setNewPassword('');
        setIsRegistering(false); // volver al login
      }, 500);

    } catch (error) {
      console.log("Error al registrar:", error);
      Alert.alert("Error", error.message);
    }
  };

  // 🔹 Reset password con Firebase
  const handleResetSubmit = async () => {
    if (!resetEmail) {
      Alert.alert('Campo vacío', 'Ingresa tu correo electrónico');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert('Éxito', 'Se envió un correo para restablecer la contraseña');
      setIsResettingPassword(false);
      setResetEmail('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titulo}>
        <Text style={styles.title}>¡Bienvenido!</Text>
      </View>

      {isResettingPassword ? (
        // 🔹 Formulario para resetear contraseña
        <View style={styles.tarjetas}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={resetEmail}
            onChangeText={setResetEmail}
          />
          <View style={styles.boton}>
            <Button title="Restablecer Contraseña" onPress={handleResetSubmit} />
            <Button title="Cancelar" onPress={() => setIsResettingPassword(false)} />
          </View>
        </View>
      ) : isRegistering ? (
        // 🔹 Formulario de registro (solo correo y contraseña)
        <View style={styles.tarjetas}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={newEmail}
            onChangeText={setNewEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={newPassword}
            secureTextEntry
            onChangeText={setNewPassword}
          />
          <View style={styles.boton}>
            <Button title="Crear Cuenta" onPress={handleRegister} />
            <Button title="Cancelar" onPress={() => setIsRegistering(false)} />
          </View>
        </View>
      ) : (
        // 🔹 Formulario de login
        <View style={styles.tarjetas}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={loginEmail}
            onChangeText={setLoginEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={loginPassword}
            secureTextEntry
            onChangeText={setLoginPassword}
          />
          <View style={styles.boton}>
            <Button title="Ingresar" onPress={handleLogin} />
          </View>
        </View>
      )}

      {!isResettingPassword && (
        <View style={styles.footer}>
          <Text style={styles.questio1}>¿Olvidó sus datos de acceso?</Text>
          <Button title="Ayuda" onPress={() => setIsResettingPassword(true)} />
          {!isRegistering && (
            <>
              <Text style={styles.question2}>¿No tienes cuenta?</Text>
              <Button title="Crea Una" onPress={() => setIsRegistering(true)} />
            </>
          )}
          <Text style={styles.smallText}>By</Text>
          <Text style={styles.subtitle}>NeoShield Inc.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  titulo: { marginTop: 0, marginBottom: 50 },
  title: { fontFamily: 'times new roman', fontSize: 50, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  tarjetas: { marginInline: 12, gap: 2 },
  boton: { marginInline: 12, marginTop: 30, gap: 7, borderRadius: 25 },
  input: { height: 40, borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 10 },
  smallText: { fontSize: 15, color: 'grey', textAlign: 'center', fontWeight: 'bold', marginBottom: 0 },
  subtitle: { fontSize: 23, color: 'grey', textAlign: 'center', fontWeight: 'bold', marginBottom: 0 },
  footer: { top: '140', alignItems: 'center', gap: 5 }
});
