import { useState, useEffect } from "react";
import { ArrowLeft, User, Building2, CreditCard, Check } from "lucide-react";
import UserSearchSelect from "./UserSearchSelect"; // Assuming you have a UserSearchSelect component
import "./BookAsset.css"; // Import your CSS styles
import { useLocation, useNavigate } from "react-router-dom";
import { createTransaction } from "../api/transactionApi";
import { formatIndianPrice } from "../utils/indianPrice";

const BookAsset = () => {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(location.state?.initialTab || 0);
  const [bookingType, setBookingType] = useState("member");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    referralId: "",
    unitNumber: "",
    floorNumber: "",
    plotNumber: "",
    direction: "",
    surveyNumber: "",
    area: "1200",
    name: "",
    email: "",
    phone: "",
    additionalCharges: "",
    paymentMode: "UPI",
    remarks: "",
  });
  const [nonMemberData, setNonMemberData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const navigate = useNavigate();
  const backtoProjects = () => {
    navigate("/projects");
  };

  const projectData = location.state.project;
  const [pricing, setPricing] = useState({
    totalPrice: projectData?.totalPrice || 0,
    discount: 0,
    finalPrice: 0,
    bookingAmount: 0,
  });

  const assetType = "Residential Plot";
  useEffect(() => {
    if (projectData) {
      const isPerSqFtPricing = [
        "Residential Plot",
        "Commercial Plot",
        "Villa",
      ].includes(assetType);
      const areaSqFt =
        parseFloat(
          projectData.area?.replace(/[^0-9.]/g, "") || formData.area
        ) || 0;

      let totalPrice;

      if (isPerSqFtPricing && projectData.price) {
        totalPrice = projectData.price * areaSqFt;
      } else {
        totalPrice = parseFloat(projectData.totalPrice || 0);
      }

      const discountPercent = parseFloat(projectData.discount || 0);
      const discountAmount = (totalPrice * discountPercent) / 100;
      const finalPrice = totalPrice;
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
  }, [projectData, assetType, formData.area]);

  const tabs = [
    { id: 0, label: "User Details", icon: User },
    { id: 1, label: "Property Info", icon: Building2 },
    { id: 2, label: "Pricing", icon: CreditCard },
    { id: 3, label: "Confirmation", icon: Check },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      referralId: user.bdaId || "",
    }));
  };
  const handleNonMemberInputChange = (e) => {
    const { name, value } = e.target;
    setNonMemberData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAreaChange = (e) => {
    const { value } = e.target;
    const newArea = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, area: value }));

    const totalPrice = newArea * projectData.price;
    const discountAmount = (totalPrice * projectData.discount) / 100;
    const finalPrice = totalPrice - discountAmount;
    const bookingAmount = finalPrice * 0.2;

    setPricing((prev) => ({
      ...prev,
      totalPrice,
      discount: discountAmount,
      finalPrice,
      bookingAmount,
    }));
  };
  const handleAdditionalCharges = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, additionalCharges: value }));

    const totalPrice =
      value * formData.area + projectData.price * formData.area;
    const discountAmount = (totalPrice * projectData.discount) / 100;
    const finalPrice = totalPrice - discountAmount;
    const bookingAmount = finalPrice * 0.2;

    setPricing((prev) => ({
      ...prev,
      totalPrice,
      discount: discountAmount,
      finalPrice,
      bookingAmount,
    }));
  };

  const nextTab = () => {
    if (currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const validateCurrentTab = () => {
    switch (currentTab) {
      case 0:
        if (bookingType === "member") {
          return selectedUser !== null;
        } else {
          return formData.name && formData.email && formData.phone;
        }
      case 1:
        return formData.plotNumber && formData.area && formData.direction;
      case 2:
        return pricing.bookingAmount > 0;
      default:
        return true;
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return (
          <div className="tab-content">
            <div className="booking-type-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="bookingType"
                  value="member"
                  checked={bookingType === "member"}
                  onChange={(e) => setBookingType(e.target.value)}
                />
                <span>Member</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bookingType"
                  value="non-member"
                  checked={bookingType === "non-member"}
                  onChange={(e) => setBookingType(e.target.value)}
                />
                <span>Non-member</span>
              </label>
            </div>

            {bookingType === "member" ? (
              <div className="member-section">
                <div className="form-group">
                  <label>Select Member</label>
                  <UserSearchSelect onUserSelect={handleUserSelect} />
                </div>
                {selectedUser && (
                  <div className="selected-user">
                    <p>
                      <strong>Selected:</strong> {selectedUser.displayName}
                    </p>
                    <p>
                      <small>BDA ID: {selectedUser.bdaId}</small>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="non-member-form">
                <div className="form-group">
                  <label>Select Member</label>
                  <UserSearchSelect onUserSelect={handleUserSelect} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleNonMemberInputChange}
                      className="form-control"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleNonMemberInputChange}
                      className="form-control"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleNonMemberInputChange}
                      className="form-control"
                      placeholder="Enter phone number"
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="tab-content">
            <div className="project-summary">
              <h3>{projectData.name}</h3>
              <p>
                {projectData.type} • {projectData.location}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Plot Number</label>
                <input
                  type="text"
                  name="plotNumber"
                  value={formData.plotNumber}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Enter plot number"
                />
              </div>

              <div className="form-group">
                <label>Area (sq.ft)</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleAreaChange}
                  className="form-control"
                  placeholder="Enter area"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Direction</label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Direction</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                </select>
              </div>

              <div className="form-group">
                <label>Referral ID</label>
                <input
                  type="text"
                  name="referralId"
                  value={formData.referralId}
                  readOnly
                  className="form-control readonly-input"
                  placeholder="Auto-populated"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="tab-content">
            <div className="pricing-section">
              <div className="price-details">
                <div className="price-grid">
                  <div className="price-item">
                    <span className="label">Price per sq.ft</span>
                    <span className="value">
                      ₹{formatIndianPrice(pricing.pricePerSqFt)}
                    </span>
                  </div>
                  <div className="price-item">
                    <span className="label">Total Area</span>
                    <span className="value">{formData.area} sq.ft</span>
                  </div>
                  <div className="price-item">
                    <span className="label">Total Price</span>
                    <span className="value">
                      ₹{formatIndianPrice(pricing.totalPrice)}
                    </span>
                  </div>
                  <div className="price-item">
                    <span className="label">
                      Additional Charges (per sq.ft){" "}
                    </span>
                    <input
                      name="plotNumber"
                      value={formData.additionalCharges || ""}
                      onChange={handleAdditionalCharges}
                      className="form-control"
                      placeholder="Enter Additional Charges"
                    />
                  </div>
                  <div className="price-item highlight">
                    <span className="label">
                      Discount ({pricing.discountPercent}%)
                    </span>
                    <span className="value">
                      -₹
                      {formatIndianPrice(
                        (pricing.totalPrice * pricing.discountPercent) / 100
                      )}
                    </span>
                  </div>
                  <div className="price-item final">
                    <span className="label">Final Price</span>
                    <span className="value">
                      ₹{formatIndianPrice(pricing.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-amount-section">
                <div className="form-group">
                  <label>Booking Amount</label>
                  <input
                    type="number"
                    value={pricing.bookingAmount}
                    onChange={(e) => {
                      const newBookingAmount = parseFloat(e.target.value) || 0;
                      setPricing((prev) => ({
                        ...prev,
                        bookingAmount: newBookingAmount,
                      }));
                    }}
                    className="form-control"
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="form-group">
                  <label>Commission Amount</label>
                  <input
                    type="text"
                    value={`₹${formatIndianPrice(
                      (pricing.bookingAmount * pricing.discountPercent) / 100
                    )}`}
                    readOnly
                    className="form-control readonly-input"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Mode</label>
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="UPI">UPI</option>
                    <option value="NEFT/RTGS">NEFT/RTGS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter any additional remarks"
                    rows={3}
                  />
                </div>
                <div className="info-box">
                  <p>
                    Remaining Payment: ₹
                    {formatIndianPrice(
                      pricing.totalPrice - pricing.bookingAmount
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="tab-content">
            <div className="confirmation-header">
              <div className="success-icon">
                <Check size={32} />
              </div>
              <h3>Review Your Booking</h3>
              <p>Please review all details before confirming</p>
            </div>
            <div className="confirmation-details">
              <div className="detail-card">
                <h4>User Details</h4>
                {bookingType === "member" ? (
                  <div className="detail-content">
                    <p>
                      <span>Member:</span> {selectedUser?.displayName}
                    </p>
                    <p>
                      <span>BDA ID:</span> {selectedUser?.bdaId}
                    </p>
                  </div>
                ) : (
                  <div className="detail-content">
                    <p>
                      <span>Name:</span> {formData.name}
                    </p>
                    <p>
                      <span>Email:</span> {formData.email}
                    </p>
                    <p>
                      <span>Phone:</span> {formData.phone}
                    </p>
                  </div>
                )}
              </div>

              <div className="detail-card">
                <h4>Property Details</h4>
                <div className="detail-content">
                  <p>
                    <span>Project:</span> {projectData.name}
                  </p>
                  <p>
                    <span>Plot:</span> {formData.plotNumber}
                  </p>
                  <p>
                    <span>Area:</span> {formData.area} sq.ft
                  </p>
                  <p>
                    <span>Direction:</span> {formData.direction}
                  </p>
                </div>
              </div>
            </div>
            <div className="payment-summary">
              <h4>Payment Summary</h4>
              <div className="summary-content">
                <div className="summary-row">
                  <span>Total Amount:</span>
                  <span className="amount">
                    ₹{formatIndianPrice(pricing.totalPrice)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Booking Amount:</span>
                  <span className="amount">
                    ₹{formatIndianPrice(pricing.bookingAmount)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Balance Amount:</span>
                  <span className="amount">
                    ₹
                    {formatIndianPrice(
                      pricing.totalPrice - pricing.bookingAmount
                    )}
                  </span>
                </div>
                <div className="summary-row small">
                  <span>Commission:</span>
                  <span>
                    ₹
                    {formatIndianPrice(
                      (pricing.bookingAmount * pricing.discountPercent) / 100
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="summary-row">
              <span>Payment Mode:</span>
              <span>{formData.paymentMode}</span>
            </div>
            {formData.remarks && (
              <div className="summary-row">
                <span>Remarks:</span>
                <span className="remarks">{formData.remarks}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };
  const generateAssetId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bookingType === "member" && !selectedUser) {
      alert("Please select a user");
      return;
    }

    const timestamp = new Date();

    // Create booking payment with proper type identification
    const newPayment = {
      id: `payment_${Date.now()}`,
      amount: pricing.bookingAmount,
      paymentDate: timestamp,
      paymentType: "booking", // Add payment type
      remarks: `Booking payment for ${projectData.name} - ${assetType}`, // Updated remarks
      createdAt: timestamp,
      createdBy: selectedUser?.bdaId || selectedUser.id,
    };

    try {
      const assetId = generateAssetId();

      // Create main asset purchase transaction
      const assetPurchaseData = {
        type: "assetPurchase",
        userId: selectedUser?.bdaId || selectedUser.id,
        userDisplayName: selectedUser?.displayName,
        assetId,
        bookingAmount: pricing.bookingAmount,
        discountPercentage: pricing.discountPercent || 0,
        amount: (pricing.bookingAmount * (pricing.discountPercent || 0)) / 100,
        projectName: projectData.name,
        assetType,
        propertyDetails: {
          ...formData,
          area: formData.area,
          location: formData.location || "",
        },
        pricing: {
          totalPrice: pricing.totalPrice,
          discountPercentage: pricing.discountPercent || 0,
          finalPrice: pricing.totalPrice,
          pricePerSqFt: pricing.pricePerSqFt,
          totalDiscountAmount: pricing.discount,
          remainingPayment: pricing.totalPrice - pricing.bookingAmount,
          remainingDiscount:
            pricing.discount -
            (pricing.bookingAmount * (pricing.discountPercent || 0)) / 100,
        },
        description: `Booking commission for ${projectData.name} - ${assetType}`,
        status:
          pricing.bookingAmount >= pricing.totalPrice
            ? "FULLY_PAID"
            : "PARTIALLY_PAID",
      };

      // Add non-member details if applicable
      if (bookingType === "non-member") {
        assetPurchaseData.nonMemberDetails = nonMemberData;
      }

      // Create the asset purchase record
      const assetPurchaseId = await createTransaction(
        assetPurchaseData,
        newPayment
      );

      alert("Booking successful! Redirecting to booking details...");
      navigate(`/booking-details/${assetPurchaseId}`);
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating booking. Please try again.");
    }
  };
  
  return (
    <div className="tabbed-booking-container">
      {/* Header */}
      <div className="booking-header">
        <button className="back-button" onClick={backtoProjects}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="booking-title">Book Asset</h1>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`tab-button ${currentTab === tab.id ? "active" : ""}`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content-wrapper">{renderTabContent()}</div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button
          onClick={prevTab}
          disabled={currentTab === 0}
          className="btn btn-secondary"
        >
          Back
        </button>

        {currentTab === tabs.length - 1 ? (
          <button onClick={handleSubmit} className="btn btn-success">
            Confirm Booking
          </button>
        ) : (
          <button
            onClick={nextTab}
            disabled={!validateCurrentTab()}
            className="btn btn-primary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default BookAsset;
