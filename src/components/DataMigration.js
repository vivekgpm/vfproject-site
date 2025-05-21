import { useState } from 'react';
import { migrateProjects } from '../utils/migrateData';
import { updateUsersForSearch } from '../utils/userSearchMigration';

const DataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isUpdatingUsers, setIsUpdatingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userUpdateSuccess, setUserUpdateSuccess] = useState(false);

  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      setSuccess(false);
      
      await migrateProjects();
      
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleUserSearchOptimization = async () => {
    try {
      setIsUpdatingUsers(true);
      setError(null);
      setUserUpdateSuccess(false);
      
      await updateUsersForSearch();
      
      setUserUpdateSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsUpdatingUsers(false);
    }
  };

  return (
    <div className="migration-container">
      <div className="migration-section">
        <h2>Project Data Migration</h2>
        <p>This will migrate sample project details to Firebase. Images should be uploaded manually.</p>
        
        <div className="sample-data-info">
          <h3>Sample Data Includes:</h3>
          <ul>
            <li>Residential Plot with plot number and direction</li>
            <li>Commercial Plot with plot number and direction</li>
            <li>Farm Land with survey number</li>
            <li>Commercial Shop with shop number and floor number</li>
            <li>Apartment with unit number and floor number</li>
          </ul>
        </div>
        
        <button 
          onClick={handleMigration}
          disabled={isMigrating}
          className="migrate-button"
        >
          {isMigrating ? 'Migrating...' : 'Migrate Sample Project Data'}
        </button>
        
        {success && <div className="success-message">Sample projects data migrated successfully!</div>}
      </div>

      <div className="migration-section">
        <h2>User Search Optimization</h2>
        <p>This will update user data to optimize the search functionality. Run this once to enable efficient user search.</p>
        
        <button 
          onClick={handleUserSearchOptimization}
          disabled={isUpdatingUsers}
          className="migrate-button"
        >
          {isUpdatingUsers ? 'Updating Users...' : 'Optimize User Search'}
        </button>
        
        {userUpdateSuccess && <div className="success-message">User search optimization completed successfully!</div>}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default DataMigration;