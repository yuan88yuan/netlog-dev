import { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import EventList from './components/EventList';
import CreateEvent from './components/CreateEvent';
import EventSourceManager from './components/EventSourceManager';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AppContent = () => {
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false);
  const eventListRef = useRef<any>(null);
  const location = useLocation();

  const handleToggleCreateEventModal = () => {
    setShowCreateEventModal(prev => !prev);
  };

  const handleEventCreated = () => {
    setShowCreateEventModal(false);
    if (eventListRef.current && eventListRef.current.refreshEvents) {
      eventListRef.current.refreshEvents();
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary mb-0">
          {location.pathname === '/sources' ? 'Event Source Manager' : 'Event Dashboard'}
        </h1>
        <div className="d-flex align-items-center">
          <nav>
            <Link to="/" className="btn btn-outline-secondary me-2">
              <i className="bi bi-list-ul"></i> Dashboard
            </Link>
            <Link to="/sources" className="btn btn-outline-secondary me-3">
              <i className="bi bi-archive"></i> Sources
            </Link>
          </nav>
          <button onClick={handleToggleCreateEventModal} className="btn btn-primary">
            <i className="bi bi-plus-circle"></i> Create Event
          </button>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<EventList ref={eventListRef} />} />
        <Route path="/sources" element={<EventSourceManager />} />
      </Routes>

      <CreateEvent
        show={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
