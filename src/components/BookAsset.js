import "../components/AppStyles.css";
import { useState, useEffect } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { createTransaction } from "../api/transactionApi";
import { getUsersByRole } from "../api/userApi";
import { getAllPlans } from "../api/planApi";
import UserSearchSelect from "./UserSearchSelect";

const BookAsset = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Format number in Indian numbering system
  const formatIndianPrice = (num) => {
    if (!num) return "0";
    const val = Math.round(num);
    const result = val.toString().split(".");
    const lastThree = result[0].substring(result[0].length - 3);
    const otherNumbers = result[0].substring(0, result[0].length - 3);
    const finalResult =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
      (otherNumbers ? "," : "") +
      lastThree;
    return finalResult;
  };

  const location = useLocation();
  const { projectId, assetType } = useParams();
  const projectData = location.state;
  const [selectedUser, setSelectedUser] = useState(null);
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
    area: projectData?.area?.replace(/[^0-9.]/g, "") || "",
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
        const usersData = await getUsersByRole("user");
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
    if (projectData) {
      const isPerSqFtPricing = [
        "Residential Plot",
        "Commercial Plot",
        "Villa",
      ].includes(assetType);
      const areaSqFt = parseFloat(
        projectData.area?.replace(/[^0-9.]/g, "") || 0
      );
      let totalPrice;

      if (isPerSqFtPricing && projectData.price) {
        totalPrice = projectData.price * areaSqFt;
      } else {
        totalPrice = parseFloat(projectData.totalPrice || 0);
      }

      const discountPercent = parseFloat(projectData.discount || 0);
      const discountAmount = (totalPrice * discountPercent) / 100;
      const finalPrice = totalPrice - discountAmount;
      const bookingAmount = finalPrice * 0.2; // 20% booking amount

      setPricing({
        totalPrice,
        discount: discountAmount,
        finalPrice,
        bookingAmount,
        pricePerSqFt: projectData.price || null,
        discountPercent: discountPercent,
      });
    }
  }, [projectData, assetType]);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await getAllPlans();
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };

    fetchPlans();
  }, []);

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
              <label>Area (sq.ft)</label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={(e) => {
                  handleInputChange(e);
                  const newArea = parseFloat(e.target.value) || 0;
                  const pricePerSqFt =
                    projectData.pricePerSqFt || projectData.price || 0;
                  const totalPrice = newArea * pricePerSqFt;
                  const discountPercent = parseFloat(projectData.discount || 0);
                  const discountAmount = (totalPrice * discountPercent) / 100;
                  const finalPrice = totalPrice - discountAmount;
                  const bookingAmount = finalPrice * 0.2;

                  setPricing({
                    totalPrice,
                    discount: discountAmount,
                    finalPrice,
                    bookingAmount,
                    pricePerSqFt,
                  });
                }}
                required
                min="0"
                step="0.01"
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
          totalPrice: pricing.totalPrice,
          discount: pricing.discount,
          finalPrice: pricing.finalPrice,
          bookingAmount: pricing.bookingAmount,
          pricePerSqFt: pricing.pricePerSqFt,
          incentive: selectedUser?.earning || 0,
        },
        status: "pending",
      };

      if (bookingType === "non-member") {
        transactionData.nonMemberDetails = nonMemberData;
      }

      const transactionId = await createTransaction(transactionData);
      navigate(`/booking-details/${transactionId}`);
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
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      referralId: user.displayName || "",
    }));
  };

  const handlePlanChange = (e) => {
    const planId = e.target.value;
    const plan = plans.find(p => p.id === planId);
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      investmentPlan: plan?.name || "",
      investmentAmount: plan?.amount || 0
    }));
  };

  return (
    <div className="book-asset-container">
      <div className="booking-header">
        <Link 
          to={`/projects/${projectId}`} 
          className="back-button"
          state={{ project: projectData }}
          onClick={(e) => {
            if (!projectId) {
              e.preventDefault();
              navigate('/projects');
            }
          }}
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
          </label>{" "}
        </div>

        {bookingType === "member" ? (
          <UserSearchSelect onUserSelect={handleUserSelect} />
        ) : (
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

        <div className="form-group">
          <label>Investment Plan</label>
          <select
            name="investmentPlan"
            value={selectedPlan?.id || ""}
            onChange={handlePlanChange}
            required
          >
            <option value="">Select Investment Plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ₹{formatIndianPrice(plan.amount)}
              </option>
            ))}
          </select>
        </div>

        <div className="pricing-details">
          <h3>Pricing Details</h3>
          <div className="price-grid">
            {" "}
            {["Residential Plot", "Commercial Plot", "Villa"].includes(
              assetType
            ) && (
              <>
                {" "}
                <div className="price-item">
                  <span className="label">Price per sq.ft</span>
                  <span className="value">
                    ₹{formatIndianPrice(projectData.price || 0)}/sq.ft
                  </span>
                </div>
                <div className="price-item">
                  <span className="label">Total Area</span>
                  <span className="value">{formData.area || "0"} sq.ft</span>
                </div>
              </>
            )}
            <div className="price-item">
              <span className="label">Total Price</span>
              <span className="value">
                ₹{formatIndianPrice(pricing.totalPrice)}
              </span>
            </div>
            <div className="price-item highlight">
              <span className="label">Discount ({pricing.discountPercent || 0}%)</span>
              <span className="value">
                ₹{formatIndianPrice(pricing.discount)}
              </span>
            </div>
            <div className="price-item final">
              <span className="label">Final Price</span>
              <span className="value">
                ₹{formatIndianPrice(pricing.finalPrice)}
              </span>
            </div>
            <div className="price-item booking">
              <span className="label">Booking Amount (20%)</span>
              <span className="value">
                ₹{formatIndianPrice(pricing.bookingAmount)}
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
