import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import ProjectList from "./components/ProjectList";
import ProjectDetails from "./components/ProjectDetails";
import Profile from "./components/Profile";
import AdminHome from "./components/AdminHome";
import AddMember from "./components/AddMember";
import Plans from "./components/Plans";
import BookAsset from "./components/BookAsset";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import Login from "./components/Login";
import { AuthProvider } from "./contexts/AuthContext"; //Import AuthProvider
import AdminUserManagement from "./components/AdminUserManagement";
import BookingDetails from "./components/BookingDetails";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EditTransaction from './components/EditTransaction';
import UserProfile from "./components/UserProfile"; // Import UserProfile
import EditProfile from "./components/EditProfile"; // Import EditProfile
import "../src/components/AppStyles.css"; // Import the centralized CSS file
import ManageAssetTransaction from "./components/ManageAssetTransaction";
import UpdateAssetPurchase from "./components/UpdateAssetPurchase";
import Inventory from "./components/Inventory"; // Import Inventory
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap your application with AuthProvider */}
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <AdminHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/add-member"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <AddMember />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/newmember"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <AdminUserManagement />
                  </ProtectedRoute>
                }
              />
                 <Route
                path="/admin/manage-asset-transactions"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <ManageAssetTransaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/user/:userId"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit-profile/:userId"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-details/:transactionId"
                element={
                  <ProtectedRoute>
                    <BookingDetails />
                  </ProtectedRoute>
                }
              />
              <Route path="/plans" element={<Plans />} />
              <Route
                path="/book-asset/:projectId/:assetType"
                element={
                  <ProtectedRoute>
                    <BookAsset />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-transaction/:id"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <EditTransaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/update-asset-purchase"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <UpdateAssetPurchase />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/admin/inventory"
                element={
                  <ProtectedRoute isAdminRoute={true}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
