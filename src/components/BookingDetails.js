import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FaPrint } from 'react-icons/fa';

const BookingDetails = () => {
  const { transactionId } = useParams();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingAndPayments = async () => {
      try {
        let assetData;
        
        // First try to get the asset purchase from assetPurchases collection
        const assetPurchaseDoc = await getDoc(doc(db, 'assetPurchases', transactionId));
        
        if (assetPurchaseDoc.exists()) {
          assetData = { id: assetPurchaseDoc.id, ...assetPurchaseDoc.data() };
        } else {
          // If not found in assetPurchases, try to get from transactions
          const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
          
          if (transactionDoc.exists()) {
            const transData = transactionDoc.data();
            // Use the assetId from transaction to get asset purchase details
            const assetPurchaseQuery = query(
              collection(db, 'assetPurchases'),
              where('assetId', '==', transData.assetId)
            );
            const assetPurchaseSnapshot = await getDocs(assetPurchaseQuery);
            
            if (!assetPurchaseSnapshot.empty) {
              const assetDoc = assetPurchaseSnapshot.docs[0];
              assetData = { id: assetDoc.id, ...assetDoc.data() };
            }
          }
        }

        if (assetData) {
          setBooking(assetData);

          // Fetch all payments related to this asset
          const paymentsQuery = query(
            collection(db, 'assetPurchases'),
            where('assetId', '==', assetData.assetId),
           // where('type', '==', 'asset_payment')
          );
          const paymentsSnapshot = await getDocs(paymentsQuery);
          const paymentsData = paymentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPayments(paymentsData[0].paymentHistory);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndPayments();
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  // Use booking amount from asset purchase as total paid
  const totalPaid = booking.paymentSummary?.paidAmount || 0;

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
          <h3>{booking.nonMemberDetails ? 'Non-member' : 'Member'} Information</h3>
          {!booking.nonMemberDetails ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name</span>
                <span className="value">{booking.userDisplayName}</span>
              </div>
              <div className="info-item">
                <span className="label">Referral ID</span>
                <span className="value">{booking.propertyDetails?.referralId}</span>
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
              <span className="label">Asset ID</span>
              <span className="value">{booking.assetId}</span>
            </div>
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
              <span className="value">{booking.propertyDetails?.area}</span>
            </div>
            <div className="info-item">
              <span className="label">Location</span>
              <span className="value">{booking.propertyDetails?.location}</span>
            </div>
            {Object.entries(booking.propertyDetails || {})
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
            {booking.pricing?.pricePerSqFt && (
              <div className="info-item">
                <span className="label">Price per sq.ft</span>
                <span className="value">₹{booking.pricing.pricePerSqFt?.toLocaleString() || '0'}/sq.ft</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Total Price</span>
              <span className="value">₹{booking.pricing?.totalPrice?.toLocaleString() || '0'}</span>
            </div>
            <div className="info-item highlight">
              <span className="label">Total Discount ({booking.pricing?.discountPercentage || 0}%)</span>
              <span className="value">₹{booking.pricing?.totalDiscountAmount?.toLocaleString() || '0'}</span>
            </div>
            <div className="info-item">
              <span className="label">Final Price</span>
              <span className="value">₹{booking.pricing?.totalPrice?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h3>Payment Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Total Paid Amount</span>
              <span className="value">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Remaining Payment</span>
              <span className="value">₹{booking.paymentSummary?.remainingAmount?.toLocaleString() || '0'}</span>
            </div>
            <div className="info-item">
              <span className="label">Earned Commission</span>
              <span className="value">₹{booking.paymentSummary?.totalCommissionEarned?.toLocaleString() || '0'}</span>
            </div>
            <div className="info-item">
              <span className="label">Remaining Commission</span>
              <span className="value">₹{booking.paymentSummary?.remainingCommission?.toLocaleString() || '0'}</span>
            </div>
          </div>

          <div className="payments-list">
            <h4>Payment History</h4>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.createdAt?.toDate().toLocaleDateString()}</td>
                    <td>₹{payment.amount}</td>
                    <td>{payment.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx="true">{`
        .payments-table {
          width: 100%;
          margin-top: 20px;
          border-collapse: collapse;
        }
        .payments-table th,
        .payments-table td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .payments-table th {
          background-color: #f5f5f5;
        }
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
          .payments-table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default BookingDetails;