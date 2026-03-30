import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Authentication Service (Firebase Implementation)
 * Maneja el ciclo de vida del usuario y la persistencia en Firestore.
 */

export const authService = {
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  },

  register: async (email, password, businessName) => {
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Crear documento de Empresa (businesses collection)
      const businessId = `bus_${user.uid}`; // Generar ID único para la empresa
      const businessDoc = {
        name: businessName,
        description: 'Bienvenido a nuestro centro de servicios.',
        slug: businessName.toLowerCase().replace(/\s+/g, '-'),
        phone: '',
        interval: 30,
        services: [
          { id: 'srv_1', name: 'Servicio General', duration: 30, description: 'Sesión estándar de consulta.' }
        ],
        schedule: {
          mon: { active: true, start: '09:00', end: '18:00' },
          tue: { active: true, start: '09:00', end: '18:00' },
          wed: { active: true, start: '09:00', end: '18:00' },
          thu: { active: true, start: '09:00', end: '18:00' },
          fri: { active: true, start: '09:00', end: '18:00' },
          sat: { active: false, start: '09:00', end: '13:00' },
          sun: { active: false, start: '09:00', end: '12:00' }
        },
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "businesses", businessId), businessDoc);

      // 3. Crear documento de Perfil del Usuario (users collection) vinculando la empresa
      const userDoc = {
        uid: user.uid,
        email: user.email,
        role: 'admin',
        businessId: businessId,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", user.uid), userDoc);
      
      return user;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
       console.error("Error en logout:", error);
       throw error;
    }
  },

  getUserData: async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // El usuario existe en Auth pero no en Firestore (ej: login con Google o creado manualmente)
        // Obtenemos el email del objeto auth actual para la provisión
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        
        console.log("Iniciando provisión automática para el usuario:", uid);
        return await authService._provisionNewUser(uid, currentUser.email);
      }
    } catch (error) {
      console.error("Error obteniendo datos de usuario:", error);
      return null;
    }
  },

  /**
   * Método privado para inicializar datos de un usuario existente en Auth pero no en Firestore.
   */
  _provisionNewUser: async (uid, email) => {
    try {
      const businessId = `bus_${uid}`;
      const businessName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

      const businessDoc = {
        name: businessName,
        description: 'Bienvenido a nuestro centro de servicios.',
        slug: businessName.toLowerCase().replace(/\s+/g, '-'),
        phone: '',
        interval: 30,
        services: [
          { id: 'srv_1', name: 'Servicio General', duration: 30, description: 'Sesión estándar.' }
        ],
        schedule: {
          mon: { active: true, start: '09:00', end: '18:00' },
          tue: { active: true, start: '09:00', end: '18:00' },
          wed: { active: true, start: '09:00', end: '18:00' },
          thu: { active: true, start: '09:00', end: '18:00' },
          fri: { active: true, start: '09:00', end: '18:00' },
          sat: { active: false, start: '09:00', end: '13:00' },
          sun: { active: false, start: '09:00', end: '12:00' }
        },
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "businesses", businessId), businessDoc);

      const userDoc = {
        uid: uid,
        email: email,
        role: 'admin',
        businessId: businessId,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), userDoc);
      return userDoc;
    } catch (error) {
      console.error("Error en provisión automática:", error);
      throw error;
    }
  },

  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};
