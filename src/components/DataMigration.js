import { useState } from 'react';
import { migrateProjects } from '../utils/migrateData';

const DataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  return (
    <div className="migration-container">
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
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Sample projects data migrated successfully!</div>}
    </div>
  );
};

export default DataMigration;