/*import db from '../../db/database';

// Función para agregar un nuevo usuario a la base de datos
export const agregarUsuario = (email, username, password, callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'INSERT INTO usuarios (email, username, password) VALUES (?, ?, ?);',
            [email, username, password],
            (_, result) => callback(true),
            (_, error) => {
                console.error(error);
                return callback(false);
            }
        );
    });
};

// Función para obtener todos los usuarios
export const obtenerUsuarios = (callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT * FROM usuarios;',
            [],
            (_, { rows }) => {
                if (rows.length > 0) {
                    callback(rows._array);
                } else {
                    callback([]);
                }
            },
            (_, error) => {
                console.error(error);
                return callback([]);
            }
        );
    });
};

// Función para obtener un usuario por email
export const obtenerUsuarioPorNombre = (username, callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT * FROM usuarios WHERE username = ?;',
            [username],
            (_, { rows }) => {
                if (rows.length > 0) {
                    callback(rows._array[0]); // Devolver solo el primer usuario encontrado
                } else {
                    callback(null);
                }
            },
            (_, error) => {
                console.error(error);
                return callback(null);
            }
        );
    });
};

// Función para actualizar la contraseña de un usuario
export const actualizarContraseña = (email, nuevaContraseña, callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'UPDATE usuarios SET password = ? WHERE email = ?;',
            [nuevaContraseña, email],
            (_, result) => callback(true), // Si la actualización es exitosa
            (_, error) => {
                console.error(error);
                return callback(false); // Si hay un error, callback con false
            }
        );
    });
};*/
