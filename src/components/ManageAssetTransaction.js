import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import "../styles/AppStyles.css"; // Import your CSS styles

const ManageAssetTransaction = () => {
  const [assetPurchases, setAssetPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchAssetPurchases = async () => {
      try {
        const assetPurchasesRef = collection(db, "assetPurchases");
        const assetPurchasesQuery = query(
          assetPurchasesRef,
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(assetPurchasesQuery);
        const purchasesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAssetPurchases(purchasesData);
      } catch (error) {
        console.error("Error fetching asset purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetPurchases();
  }, []);

  // Filter assets based on search term
  const filteredAssets = assetPurchases.filter(
    (asset) =>
      asset.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / pageSize);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="manage-assets-container">
      <div className="header-section">
        <h2>Manage Asset Purchases</h2>
        <Link to="/admin" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by member name, project name, or asset ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-responsive">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset ID</th>
              <th>Member Name</th>
              <th>Project</th>
              <th>Asset Type</th>
              <th>Total Price</th>
              <th>Booking Amount</th>
              <th>Remaining Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAssets.map((asset) => (
              <tr key={asset.id}>
                <td>{formatDate(asset.createdAt)}</td>
                <td>{asset.assetId}</td>
                <td>{asset.userDisplayName || "N/A"}</td>
                <td>{asset.projectName}</td>
                <td>{asset.assetType}</td>
                <td>
                  ₹{asset.pricing?.totalPrice?.toLocaleString("en-IN") || "0"}
                </td>
                <td>₹{asset.bookingAmount?.toLocaleString("en-IN") || "0"}</td>
                <td>
                  ₹
                  {asset.pricing?.remainingPayment?.toLocaleString("en-IN") ||
                    "0"}
                </td>
                <td>
                  <span
                    className={`status-badge ${asset.status?.toLowerCase()}`}
                  >
                    {asset.status || "Pending"}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/booking-details/${asset.id}`}
                    className="btn btn-info btn-sm"
                  >
                    Details
                  </Link>
                  <Link
                    //to="/update-asset-purchase"
                    to={`/edit-transaction/${asset.id}`}
                    state={{ asset }}
                    className="btn btn-payment btn-sm"
                    style={{ marginLeft: "8px" }}
                  >
                    +Payment
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageAssetTransaction;
