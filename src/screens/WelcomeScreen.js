import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function WelcomeScreen({ navigation }) {

    ///efecto de transicion entre pestañas
    useEffect(() => {
        const timeout = setTimeout(() => {
            navigation.replace('Login'); 
        }, 4500); 

        return () => clearTimeout(timeout); 
    }, []);
    ///fin efecto
    return (
        <View style={styles.container}>

            <View style={styles.diagonal} />

            <View style={styles.log}>
                <Image
                    source={require('../../assets/finallogo.png')}
                    style={styles.log}
                />
            </View>

            <View style={styles.titulo}>  
                <Text style={styles.title}>SafeTweet</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.smallText}>By</Text>
                <Text style={styles.subtitle}>NeoShield Inc.</Text>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#007bff' },
    diagonal: {
        position: 'absolute', width: '245%', height: '150%', backgroundColor: 'rgba(255,255,255,0.1)', transform: [{ rotate: '-77deg' }],
        top: -380, left: -980,
    },
    title: { fontSize: 60, color: 'white', fontWeight: 'bold', marginBottom: 300 },
    smallText: { fontSize: 16, color: 'white', textAlign: 'center', fontWeight: 'bold', marginBottom: 1 },
    subtitle: { fontSize: 25, color: 'white', textAlign: 'center', fontWeight: 'bold', marginBottom: 20 },
    footer: { position: 'absolute', bottom: 70, alignItems: 'center'},
    log: { width: 150, height: 150, margin: 4, resizeMode: 'contain', borderRadius: 50, marginBottom: 20 }
});

/// aqui la imagen logo <Image source={require('')} style={styles.logo} /
/// esto al principio por el useeffect : import React from 'react'