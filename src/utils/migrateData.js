import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const migrateProjects = async () => {
  try {
    const projectsCollection = collection(db, 'projects');
    let migratedCount = 0;
    
    // Sample project data for migration
    const projects = [
      {
        type: "Residential Plot",
        name: "Sample Plot 1",
        area: "1000 sq ft",
        location: "Sample Location 1",
        price: 5000000,
        discount: "10%",
        image: "/images/sample1.jpg",
        description: "Sample description for Plot 1",
        plotNumber: "P001",
        direction: "North"
      },
      {
        type: "Commercial Plot",
        name: "Sample Plot 2",
        area: "2000 sq ft",
        location: "Sample Location 2",
        price: 10000000,
        discount: "5%",
        image: "/images/sample2.jpg",
        description: "Sample description for Plot 2",
        plotNumber: "P002",
        direction: "South"
      },
      {
        type: "Farm Land",
        name: "Sample Farm 1",
        area: "5 acres",
        location: "Sample Location 3",
        price: 20000000,
        discount: "15%",
        image: "/images/sample3.jpg",
        description: "Sample description for Farm 1",
        surveyNumber: "S001"
      },
      {
        type: "Commercial Shop",
        name: "Sample Shop 1",
        area: "500 sq ft",
        location: "Sample Location 4",
        price: 3000000,
        discount: "8%",
        image: "/images/sample4.jpg",
        description: "Sample description for Shop 1",
        shopNumber: "S001",
        floorNumber: "1"
      },
      {
        type: "Apartment",
        name: "Sample Apartment 1",
        area: "1200 sq ft",
        location: "Sample Location 5",
        price: 4000000,
        discount: "12%",
        image: "/images/sample5.jpg",
        description: "Sample description for Apartment 1",
        unitNumber: "A001",
        floorNumber: "2"
      }
    ];
    
    for (const project of projects) {
      // Prepare project data without modifying image paths
      const projectData = {
        ...project,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to Firestore
      await addDoc(projectsCollection, projectData);
      migratedCount++;
      console.log(`Migrated project ${migratedCount}/${projects.length}`);
    }
    
    console.log(`Successfully migrated ${migratedCount} projects`);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

export { migrateProjects };