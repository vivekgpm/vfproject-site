import { collection, getDocs, addDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Get all projects
export const getAllProjects = async () => {
  try {
    const snapshot = await getDocs(collection(db, "projects"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Get project by ID
export const getProjectById = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }
    return { id: projectDoc.id, ...projectDoc.data() };
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

// Create new project
export const createProject = async (projectData) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Get projects by type
export const getProjectsByType = async (type) => {
  try {
    const q = query(collection(db, "projects"), where("type", "==", type));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching projects by type:", error);
    throw error;
  }
};