import { db, storage } from "../config/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  setDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Database Service (Firestore Implementation)
 * Maneja la lógica multiempresa y la reserva de turnos.
 */

export const dbService = {
  // --- Empresas y Slugs ---
  
  /**
   * Obtiene un negocio por su slug público (taketurn.com/:slug)
   * 1. Consulta la colección 'slug_registry' para obtener el businessId.
   * 2. Recupera el perfil del negocio de la colección 'businesses'.
   */
  getBusinessBySlug: async (slug) => {
    try {
      const normalizedSlug = slug.toLowerCase();
      const q = query(collection(db, "businesses"), where("slug", "==", normalizedSlug));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn('Negocio no encontrado con slug:', normalizedSlug);
        return null;
      }

      const businessDoc = querySnapshot.docs[0];
      return { id: businessDoc.id, ...businessDoc.data() };
    } catch (error) {
      console.error("Error en getBusinessBySlug:", error);
      throw error;
    }
  },

  /**
   * Obtiene un negocio por su ID directamente
   */
  getBusinessById: async (businessId) => {
    try {
      const businessRef = doc(db, "businesses", businessId);
      const businessSnap = await getDoc(businessRef);
      return businessSnap.exists() ? { id: businessSnap.id, ...businessSnap.data() } : null;
    } catch (error) {
      console.error("Error en getBusinessById:", error);
      throw error;
    }
  },

  /**
   * Registra un nuevo slug único vinculado a una empresa.
   */
  registerSlug: async (slug, businessId) => {
    try {
      await setDoc(doc(db, "slug_registry", slug), { businessId });
    } catch (error) {
      console.error("Error registrando slug:", error);
      throw new Error("El slug ya está en uso o no tienes permisos.");
    }
  },

  /**
   * Actualiza el perfil de la empresa (incluyendo horarios, servicios e intervalo)
   */
  updateBusinessProfile: async (businessId, data) => {
    try {
      const businessRef = doc(db, "businesses", businessId);
      await setDoc(businessRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Si el slug cambió en los datos, opcionalmente podrías actualizar el registry aquí
      // pero por ahora lo manejamos en el componente para mayor control.
    } catch (error) {
      console.error("Error actualizando perfil de empresa:", error);
      throw error;
    }
  },

  // --- Turnos (Appointments) ---

  /**
   * Obtiene los turnos para una empresa en una fecha específica (YYYY-MM-DD)
   */
  getAppointmentsByDate: async (businessId, date) => {
    try {
      const appointmentsRef = collection(db, "businesses", businessId, "appointments");
      const q = query(appointmentsRef, where("date", "==", date));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((appt) => appt.status !== 'cancelled');
    } catch (error) {
      console.error("Error obteniendo turnos:", error);
      throw error;
    }
  },

  /**
   * Crea un nuevo turno en estado pendiente dentro de la subcolección de la empresa
   */
  createAppointment: async (appointmentData) => {
    try {
      const { businessId } = appointmentData;
      if (!businessId) throw new Error("Falta businessId para crear el turno.");

      const appointmentsRef = collection(db, "businesses", businessId, "appointments");
      const docRef = await addDoc(appointmentsRef, {
        ...appointmentData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...appointmentData };
    } catch (error) {
       console.error("Error creando turno:", error);
       throw error;
    }
  },

  /**
   * Obtiene todos los turnos para la administración (con filtros opcionales)
   */
  getBusinessAppointments: async (businessId) => {
    try {
      if (!businessId) return [];
      const appointmentsRef = collection(db, "businesses", businessId, "appointments");
      const q = query(appointmentsRef);
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error obteniendo todos los turnos:", error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de un turno de una empresa
   */
  updateAppointmentStatus: async (businessId, appointmentId, status) => {
    try {
      if (!businessId || !appointmentId) {
        throw new Error("Faltan identificadores para actualizar el turno");
      }

      const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error actualizando estado del turno:", error);
      throw error;
    }
  },

  /**
   * Guarda un lead de contacto desde formularios publicos
   */
  createMailingLead: async (leadData) => {
    try {
      const mailingRef = collection(db, "mailing");
      const docRef = await addDoc(mailingRef, {
        ...leadData,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...leadData };
    } catch (error) {
      console.error("Error guardando lead de mailing:", error);
      throw error;
    }
  },

  /**
   * Sube el avatar de una empresa a Firebase Storage y devuelve la URL pública.
   */
  uploadBusinessAvatar: async (businessId, file) => {
    try {
      if (!businessId || !file) {
        throw new Error("Faltan datos para subir el avatar.");
      }

      const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const fileName = `business-avatar-${Date.now()}.${safeExt}`;
      const avatarRef = ref(storage, `businesses/${businessId}/avatar/${fileName}`);

      await uploadBytes(avatarRef, file, { contentType: file.type || 'image/jpeg' });
      const downloadURL = await getDownloadURL(avatarRef);
      return downloadURL;
    } catch (error) {
      console.error("Error subiendo avatar del negocio:", error);
      throw error;
    }
  },

  // --- Clientes ---
  
  getBusinessCustomers: async (businessId) => {
    try {
      if (!businessId) return [];
      const customersRef = collection(db, "businesses", businessId, "customers");
      const q = query(customersRef);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      throw error;
    }
  },

  /**
   * Crea un nuevo cliente manualmente
   */
  createCustomer: async (businessId, customerData) => {
    try {
      if (!businessId) throw new Error("Falta businessId para crear el cliente");
      const customersRef = collection(db, "businesses", businessId, "customers");
      const docRef = await addDoc(customersRef, {
        ...customerData,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...customerData };
    } catch (error) {
      console.error("Error creando cliente:", error);
      throw error;
    }
  },

  /**
   * Actualiza el perfil de un cliente (ej: notas, datos de contacto)
   */
  updateCustomer: async (businessId, customerId, data) => {
    try {
      if (!businessId || !customerId) throw new Error("Faltan identificadores para actualizar el cliente");
      const customerRef = doc(db, "businesses", businessId, "customers", customerId);
      await updateDoc(customerRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error actualizando cliente:", error);
      throw error;
    }
  }
};
