import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { auth, db } from "../services/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!name || !age || !gender || !description) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "No hay usuario autenticado.");
        return;
      }

      // 🔹 Guardamos perfil en Firestore con nombres consistentes
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          name: name,
          age: parseInt(age),
          gender: gender,
          bio: description,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      Alert.alert("Éxito", "¡Perfil guardado correctamente!");

      // Limpiar formulario
      setName("");
      setAge("");
      setGender("");
      setDescription("");

      // Redirigir al perfil
      navigation.navigate("ProfilePreview");
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No se pudo guardar el perfil.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>

      <Text style={styles.label}>Nombre:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ingresa tu nombre"
      />

      <Text style={styles.label}>Edad:</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="Ingresa tu edad"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Género:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)}>
          <Picker.Item label="Selecciona tu género" value="" />
          <Picker.Item label="Masculino" value="masculino" />
          <Picker.Item label="Femenino" value="femenino" />
          <Picker.Item label="Otro" value="otro" />
        </Picker>
      </View>

      <Text style={styles.label}>Descripción:</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Escribe una breve descripción"
        multiline
      />

      <View style={styles.buttonContainer}>
        <Button title="Guardar" onPress={handleSave} color="blue" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 70, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginTop: 5,
    overflow: "hidden",
  },
  buttonContainer: { marginTop: 350 },
});
