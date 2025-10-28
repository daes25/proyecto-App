import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Recuperar({ navigation }) {
  const [correo, setCorreo] = useState('');

  const manejarRecuperacion = async () => {
    if (!correo) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    try {
      // ✅ Buscar si el email existe en Firestore
      const q = query(collection(db, "usuarios"), where("email", "==", correo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Usuario no encontrado', 'No existe una cuenta registrada con ese correo.');
        return;
      }

      // ✅ Si existe, enviar el correo de recuperación desde Firebase Auth
      await sendPasswordResetEmail(auth, correo);

      Alert.alert(
        '✅ Correo enviado',
        'Hemos enviado un enlace para restablecer tu contraseña a tu correo electrónico.'
      );

      navigation.navigate('Login');
    } catch (error) {
      console.error("Error al enviar correo:", error);

      if (error.code === 'auth/user-not-found') {
        Alert.alert('Usuario no encontrado', 'No existe una cuenta con ese correo.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido.');
      } else {
        Alert.alert('Error', 'Ocurrió un problema al enviar el correo. Intenta nuevamente.');
      }
    }
  };

  return (
    <View style={styles.contenedor}>
          <View style={styles.separatorContainer}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>O</Text>
        <View style={styles.line} />
      </View>

      <Text style={styles.titulo}>Recuperar Contraseña</Text>

      <Text style={styles.instruccion}>
        Ingresa el correo electrónico asociado a tu cuenta para enviar un enlace de recuperación.
      </Text>

      <TextInput
        style={styles.entrada}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
      />

      <View style={styles.botonContenedor}>
        <Button title="Enviar enlace" onPress={manejarRecuperacion} color="#FF9045" />
      </View>

      <Text style={styles.volver} onPress={() => navigation.navigate('Login')}>
        Volver al inicio de sesión
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#23252E',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
    marginTop: 20,
  },
  instruccion: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  entrada: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  botonContenedor: {
    marginBottom: 20,
  },
  volver: {
    textAlign: 'center',
    color: '#FF9045',
    textDecorationLine: 'underline',
    fontSize: 16,
    marginTop: 10,
  },
  img: {
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#fff",
  },
});