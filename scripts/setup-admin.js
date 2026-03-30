const admin = require('firebase-admin');
const path = require('path');

/**
 * Taketurn - Admin Setup Utility
 * 
 * Este script configura los Custom Claims de Firebase para el usuario administrador.
 * Requiere el archivo serviceAccountKey.json en la misma carpeta que este script.
 */

// Intentar cargar las credenciales del Service Account
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error('❌ ERROR: No se encontró el archivo serviceAccountKey.json en la carpeta /scripts.');
  console.log('💡 Instrucciones:');
  console.log('1. Ve a la Consola de Firebase > Project Settings > Service Accounts.');
  console.log('2. Haz clic en "Generate new private key".');
  console.log('3. Renombra el archivo descargado como "serviceAccountKey.json" y colócalo en la carpeta /scripts de este proyecto.');
  process.exit(1);
}

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const TARGET_UID = 'epT0sxNaFoOvwO5eASyBS60XRSu1';
const TARGET_EMAIL = 'administrator@goldmund.com.ar';

const setAdminClaims = async () => {
  console.log(`🚀 Iniciando configuración de administrador para: ${TARGET_EMAIL}...`);
  
  try {
    // 1. Verificar si el usuario existe, si no, crearlo
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(TARGET_UID);
      console.log(`✅ Usuario encontrado: ${userRecord.email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️ Usuario no encontrado. Creando nuevo usuario administrador...`);
        userRecord = await admin.auth().createUser({
          uid: TARGET_UID,
          email: TARGET_EMAIL,
          emailVerified: true,
          password: 'TemporaryPassword123!', // El usuario debería cambiarla después
          displayName: 'Taketurn Admin',
        });
        console.log(`✅ Usuario creado exitosamente con email: ${TARGET_EMAIL}`);
      } else {
        throw error;
      }
    }

    // 2. Establecer Claims de Administrador
    // Estos claims se codifican en el token ID de Firebase (JWT)
    const customClaims = { 
      admin: true, 
      role: 'superadmin',
      accessLevel: 10,
      canSeeAllUsers: true
    };
    
    await admin.auth().setCustomUserClaims(TARGET_UID, customClaims);
    console.log(`✅ Claims establecidos correctamente para ${TARGET_EMAIL}.`);
    console.log('📊 Claims configurados:', JSON.stringify(customClaims, null, 2));

    // 3. Sincronizar con el documento de Firestore
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(TARGET_UID);
    
    await userDocRef.set({
      email: TARGET_EMAIL,
      role: 'superadmin',
      isAdmin: true,
      lastAdminUpdate: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'antigravity-setup-script'
    }, { merge: true });

    console.log('✅ Documento de Firestore actualizado.');
    
    console.log('\n✨ PROCESO COMPLETADO CON ÉXITO.');
    console.log('⚠️ NOTA: Si el usuario ya estaba logueado, debe cerrar sesión y volver a entrar.');
    console.log('🔑 Contraseña temporal (si fue creado): TemporaryPassword123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR FATAL:', error);
    process.exit(1);
  }
};

setAdminClaims();
