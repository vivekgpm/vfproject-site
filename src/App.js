import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import Layout from './components/Layout';
import Profile from './components/Profile';
import AdminHome from './components/AdminHome';
import AddMember from './components/AddMember';
import Plans from './components/Plans';
import BookAsset from './components/BookAsset';
import '../src/components/AppStyles.css'; // Import the centralized CSS file

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/add-member" element={<AddMember />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/book-asset/:projectId/:assetType" element={<BookAsset />} />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;