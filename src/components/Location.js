import React, { useState } from "react";
import { db } from "../firebase";
import {
  doc,
  setDoc
} from "firebase/firestore";
import "./Location.css"; // Import your CSS styles

const Location = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateLocationsAndProjects = async () => {
    setLoading(true);
    try {
      

      // Add Anubhava Mega City project
      await setDoc(doc(db, 'projects', 'project_anubhava_mega_city'), {
        id: "project_anubhava_mega_city",
        locationId: "location_basavakalyan",
        name: "Anubhava Mega City",
        description: "Premium residential plots in Basavakalyan",
        type: "Residential",
        totalPlots: 800,
        bookedPlots: 350,
        availablePlots: 450,
        reservedPlots: 0,
        soldPlots: 0,
        priceRange: {
          min: 500000,
          max: 2000000,
          currency: "INR"
        },
        plotSizes: ["30x40", "40x50", "50x60", "40x60"],
        amenities: ["garden", "playground", "temple", "community_hall"],
        isActive: true,
        launchDate: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add Kayaka Layout project
      await setDoc(doc(db, 'projects', 'project_kayaka_layout'), {
        id: "project_kayaka_layout",
        locationId: "location_kalaburgi",
        name: "Kayaka Layout",
        description: "Residential plots in prime location of Kalaburgi",
        type: "Residential",
        totalPlots: 100,
        bookedPlots: 5,
        availablePlots: 90,
        reservedPlots: 5,
        soldPlots: 0,
        priceRange: {
          min: 800000,
          max: 1500000,
          currency: "INR"
        },
        plotSizes: ["30x40", "40x60"],
        amenities: ["garden", "temple", "parking"],
        isActive: true,
        launchDate: new Date('2024-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setMessage('All projects updated successfully');
    } catch (error) {
      console.error('Error updating data:', error);
      setMessage('Failed to update locations and projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-container">
      <h2>Manage Locations and Projects</h2>
      
      <div className="action-panel">
        <button 
          onClick={updateLocationsAndProjects}
          disabled={loading}
          className="update-button"
        >
          {loading ? "Updating..." : "Initialize Locations & Projects"}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Location;