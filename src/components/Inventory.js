import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Inventory.css"; // Import your CSS styles

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const q = collection(db, "inventory");
        const qs = await getDocs(q);
        const projectsList = qs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInventoryData(projectsList);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch inventory data. Please try again.");
        setLoading(false);
      }
    };
    fetchInventoryData();
  }, []);

  return (
    <div className="inventory-container">
      <h2 className="title"> Inventory Layout</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        inventoryData.map((item) => {
          const { id, unitName, total, remaining } = item;
          const booked = total - remaining;
          const boxArray = Array(total)
            .fill("available")
            .fill("booked", 0, booked);
          const shuffledBoxes = shuffleArray(boxArray);

          // Divide boxes into 4 corners
          const quarter = Math.ceil(shuffledBoxes.length / 4);
          const quadrants = [
            shuffledBoxes.slice(0, quarter),
            shuffledBoxes.slice(quarter, 2 * quarter),
            shuffledBoxes.slice(2 * quarter, 3 * quarter),
            shuffledBoxes.slice(3 * quarter),
          ];

          return (
            <div key={id} className="project-block">
              <div className="project-header">
                <h3>{unitName}</h3>
                <p>
                  Total: {total}
                  <div className={`unit-box booked`} />
                  Booked: {booked}
                  <div className={`unit-box available`} />
                  Available: {remaining}
                </p>
              </div>

              <div className="creative-layout">
                <div className="quadrant top-left">
                  {quadrants[0].map((type, i) => (
                    <div key={`tl-${i}`} className={`unit-box ${type}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="quadrant top-right">
                  {quadrants[1].map((type, i) => (
                    <div key={`tr-${i}`} className={`unit-box ${type}`}>
                      {i + 1 + quarter}
                    </div>
                  ))}
                </div>
                <div className="garden-center">Garden Area</div>
                <div className="quadrant bottom-left">
                  {quadrants[2].map((type, i) => (
                    <div key={`bl-${i}`} className={`unit-box ${type}`}>
                      {i + 1 + 2 * quarter}
                    </div>
                  ))}
                </div>
                <div className="quadrant bottom-right">
                  {quadrants[3].map((type, i) => (
                    <div key={`br-${i}`} className={`unit-box ${type}`}>
                      {i + 1 + 3 * quarter}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Inventory;
