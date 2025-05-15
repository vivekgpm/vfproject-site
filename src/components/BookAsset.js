import "../components/AppStyles.css"; // Import your CSS styles
import { useState, useEffect } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";

const BookAsset = () => {
  const location = useLocation();
  const { projectId, assetType } = useParams();
  const projectData = location.state;
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState("member");
  const [nonMemberData, setNonMemberData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    referralId: "",
    unitNumber: "",
    floorNumber: "",
    plotNumber: "",
    direction: "",
    surveyNumber: "",
    shopNumber: "",
  });

  const [pricing, setPricing] = useState({
    totalPrice: projectData?.totalPrice || 0,
    discount: 0,
    finalPrice: 0,
    bookingAmount: 0,
  });
  const handleNonMemberInputChange = (e) => {
    const { name, value } = e.target;
    setNonMemberData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "user"));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);
  useEffect(() => {
    if (projectData?.totalPrice) {
      const totalPrice = parseFloat(projectData.totalPrice);
      const discountPercent = parseFloat(projectData.discount || 0);
      const discountAmount = (totalPrice * discountPercent) / 100;
      const finalPrice = totalPrice - discountAmount;
      const bookingAmount = finalPrice * 0.2; // 20% booking amount

      setPricing({
        totalPrice,
        discount: discountAmount,
        finalPrice,
        bookingAmount,
      });
    }
  }, [projectData]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderAssetFields = () => {
    switch (assetType) {
      case "Residential Plot":
      case "Commercial Plot":
      case "Villa":
        return (
          <>
            <div className="form-group">
              <label>Plot Number</label>
              <input
                type="text"
                name="plotNumber"
                value={formData.plotNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Direction</label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Direction</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>
          </>
        );

      case "Farm Land":
        return (
          <div className="form-group">
            <label>Survey Number</label>
            <input
              type="text"
              name="surveyNumber"
              value={formData.surveyNumber}
              onChange={handleInputChange}
              required
            />
          </div>
        );

      case "Commercial Shop":
      case "Apartment":
      case "Hotel Rooms":
        return (
          <>
            <div className="form-group">
              <label>
                {assetType === "Commercial Shop"
                  ? "Shop Number"
                  : assetType === "Apartment"
                  ? "Apartment Number"
                  : "Room Number"}
              </label>
              <input
                type="text"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Floor Number</label>
              <input
                type="number"
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bookingType === "member" && !selectedUser) {
      alert("Please select a user");
      return;
    }

    try {
      const transactionData = {
        bookingType,
        userId: selectedUser?.id,
        userDisplayName: selectedUser?.displayName,
        projectId,
        projectName: projectData.name,
        assetType,
        propertyDetails: {
          ...formData,
          area: projectData.area,
          location: projectData.location,
        },
        pricing: {
          ...pricing,
          incentive: selectedUser?.earning || 0,
        },
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (bookingType === "non-member") {
        transactionData.nonMemberDetails = nonMemberData;
      }

      const docRef = await addDoc(
        collection(db, "transactions"),
        transactionData
      );
      navigate(`/booking-details/${docRef.id}`);
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  

  if (!projectData) {
    return (
      <div className="not-found">
        <h2>No booking details found</h2>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }
  // Replace the existing UserSearch component
  const UserSearch = () => (
    <div className="user-search-section">
      <h3>Select Customer</h3>
      <div className="user-select">
        <select
          value={selectedUser?.id || ""}
          onChange={(e) => {
            const selected = users.find((user) => user.id === e.target.value);
            setSelectedUser(selected);
            if (selected) {
              setFormData((prev) => ({
                ...prev,
                referralId: selected.displayName || "",
              }));
            }
          }}
          required
        >
          <option value="">Select a customer</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} ({user.email})
            </option>
          ))}
        </select>
      </div>
      {selectedUser && (
        <div className="selected-user-info">
          <p>Selected: {selectedUser.displayName}</p>
          <p>Referral ID: {selectedUser.displayName || "N/A"}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="book-asset-container">
      <div className="booking-header">
        <Link 
          to={`/projects/${projectId}`} 
          className="back-button"
          state={{ project: projectData }}
        >
          ← Back to Project
        </Link>
        <h2>Book Asset</h2>
        
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="booking-type-selector">
          <label>
            <input
              type="radio"
              name="bookingType"
              value="member"
              checked={bookingType === "member"}
              onChange={(e) => setBookingType(e.target.value)}
            />
            Member
          </label>
          <label>
            <input
              type="radio"
              name="bookingType"
              value="non-member"
              checked={bookingType === "non-member"}
              onChange={(e) => setBookingType(e.target.value)}
            />
            Non-member
          </label>
        </div>

        <UserSearch />
        {bookingType === "non-member" && (
          <div className="non-member-form">
            <h3>Non-member Details</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={nonMemberData.name}
                onChange={handleNonMemberInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={nonMemberData.email}
                onChange={handleNonMemberInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={nonMemberData.phone}
                onChange={handleNonMemberInputChange}
                required
                pattern="[0-9]{10}"
              />
            </div>
          </div>
        )}
        <div className="property-summary">
          <h3>Property Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Project Name</span>
              <span className="value">{projectData.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Type</span>
              <span className="value">{projectData.type}</span>
            </div>
            <div className="info-item">
              <span className="label">Area</span>
              <span className="value">{projectData.area}</span>
            </div>
            {renderAssetFields()}
            <div className="form-group">
              <label>Referral ID</label>
              <input
                type="text"
                name="referralId"
                value={formData.referralId}
                readOnly
                placeholder="Will be auto-populated"
                className="readonly-input"
              />
            </div>
          </div>
        </div>

        <div className="pricing-details">
          <h3>Pricing Details</h3>
          <div className="price-grid">
            <div className="price-item">
              <span className="label">Total Price</span>
              <span className="value">
                ₹{pricing.totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="price-item highlight">
              <span className="label">Discount ({projectData.discount}%)</span>
              <span className="value">
                ₹{pricing.discount.toLocaleString()}
              </span>
            </div>
            <div className="price-item final">
              <span className="label">Final Price</span>
              <span className="value">
                ₹{pricing.finalPrice.toLocaleString()}
              </span>
            </div>
            <div className="price-item booking">
              <span className="label">Booking Amount (20%)</span>
              <span className="value">
                ₹{pricing.bookingAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary booking-submit">
          Book
        </button>
      </form>

      <style jsx="true">{`
        @media print {
          body * {
            visibility: hidden;
          }
          .book-asset-container,
          .book-asset-container * {
            visibility: visible;
          }
          .book-asset-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 20mm;
            margin: 0;
          }
          .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .back-button,
          .print-button,
          .booking-submit {
            display: none;
          }
          .booking-form {
            page-break-inside: avoid;
          }
          .property-summary,
          .pricing-details {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .info-grid,
          .price-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .form-group {
            margin-bottom: 10px;
          }
          .form-group label {
            font-weight: bold;
          }
          .form-group input,
          .form-group select {
            border: 1px solid #000;
            padding: 5px;
          }
          .price-item {
            border-bottom: 1px solid #000;
            padding: 5px 0;
          }
          .price-item.final {
            font-weight: bold;
            font-size: 1.2em;
          }
          .price-item.booking {
            background-color: #f0f0f0;
            padding: 10px;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default BookAsset;
