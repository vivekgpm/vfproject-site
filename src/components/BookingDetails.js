import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaPrint } from 'react-icons/fa';

const BookingDetails = () => {
  const { transactionId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingDoc = await getDoc(doc(db, 'transactions', transactionId));
        if (bookingDoc.exists()) {
          setBooking({ id: bookingDoc.id, ...bookingDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div className="booking-details-container">
      <div className="booking-details-header">
        <h2>Booking Details</h2>
        <div className="nav-links">
          <Link to="/projects" className="btn btn-secondary">Back to Projects</Link>
          <Link to="/admin" className="btn btn-secondary">Back to Admin</Link>
          <button onClick={handlePrint} className="print-button">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      <div className="booking-sections">
        <section className="info-section">
          <h3>{booking.bookingType === 'member' ? 'Member' : 'Non-member'} Information</h3>
          {booking.bookingType === 'member' ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name</span>
                <span className="value">{booking.userDisplayName}</span>
              </div>
              <div className="info-item">
                <span className="label">Referral ID</span>
                <span className="value">{booking.propertyDetails.referralId}</span>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name</span>
                <span className="value">{booking.nonMemberDetails.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Email</span>
                <span className="value">{booking.nonMemberDetails.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone</span>
                <span className="value">{booking.nonMemberDetails.phone}</span>
              </div>
            </div>
          )}
        </section>

        <section className="info-section">
          <h3>Property Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Project Name</span>
              <span className="value">{booking.projectName}</span>
            </div>
            <div className="info-item">
              <span className="label">Asset Type</span>
              <span className="value">{booking.assetType}</span>
            </div>
            <div className="info-item">
              <span className="label">Area</span>
              <span className="value">{booking.propertyDetails.area}</span>
            </div>
            <div className="info-item">
              <span className="label">Location</span>
              <span className="value">{booking.propertyDetails.location}</span>
            </div>
            {Object.entries(booking.propertyDetails)
              .filter(([key]) => !['area', 'location'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="info-item">
                  <span className="label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="value">{value}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="info-section">
          <h3>Pricing Details</h3>
          <div className="info-grid">
            {["Residential Plot", "Commercial Plot", "Villa"].includes(booking.assetType) && (
              <div className="info-item">
                <span className="label">Price per sq.ft</span>
                <span className="value">₹{booking.pricing.pricePerSqFt?.toLocaleString() || '0'}/sq.ft</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Total Price</span>
              <span className="value">₹{booking.pricing.totalPrice.toLocaleString()}</span>
            </div>
            <div className="info-item highlight">
              <span className="label">Discount Amount</span>
              <span className="value">₹{booking.pricing.discount.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Final Price</span>
              <span className="value">₹{booking.pricing.finalPrice.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Booking Amount</span>
              <span className="value">₹{booking.pricing.bookingAmount.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Incentive</span>
              <span className="value">₹{booking.pricing.incentive.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>
      <style jsx="true">{`
        @media print {
          .print-button, .nav-links .btn {
            display: none !important;
          }
          .booking-details-container {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0;
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default BookingDetails;