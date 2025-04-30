import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import ProjectList from "./components/ProjectList";
import ProjectDetails from "./components/ProjectDetails";
import Layout from "./components/Layout";
import Profile from "./components/Profile";
import AdminHome from "./components/AdminHome";
import AddMember from "./components/AddMember";
import Plans from "./components/Plans";
import BookAsset from "./components/BookAsset";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import Login from "./components/Login";
import { AuthProvider } from "./contexts/AuthContext"; //Import AuthProvider
import "../src/components/AppStyles.css"; // Import the centralized CSS file

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap your application with AuthProvider */}
      <Router>
        <Layout>
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
            <Route path="/plans" element={<Plans />} />
            <Route
              path="/book-asset/:projectId/:assetType"
              element={
                <ProtectedRoute>
                  <BookAsset />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
