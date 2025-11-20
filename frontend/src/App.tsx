import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import EventList from './components/EventList';
import CreateEvent from './components/CreateEvent';
import EventSourceManager from './components/EventSourceManager';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Tooltip } from 'bootstrap';

const AppContent = () => {
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false);
  const eventListRef = useRef<any>(null);
  const location = useLocation();

  useEffect(() => {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new Tooltip(tooltipTriggerEl);
    });
    // Cleanup tooltips on component unmount
    return () => {
      tooltipList.forEach(tooltip => tooltip.dispose());
    };
  }, []);

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
    <>
      {/* Combined Fixed Header */}
      <div className="fixed-top d-flex justify-content-between align-items-center p-3 bg-body-tertiary z-index-sticky">
        <h1 className="h4 text-primary mb-0">
          {location.pathname === '/sources' ? 'Event Source Manager' : 'Event Dashboard'}
        </h1>
        <div>
          <nav className="d-inline-block">
            <Link 
              to="/" 
              className="btn btn-outline-secondary me-2"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Dashboard"
            >
              <i className="bi bi-list-ul"></i>
            </Link>
            <Link 
              to="/sources" 
              className="btn btn-outline-secondary me-3"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Sources"
            >
              <i className="bi bi-archive"></i>
            </Link>
          </nav>
          <button 
            onClick={handleToggleCreateEventModal} 
            className="btn btn-primary"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Create Event"
          >
            <i className="bi bi-plus-circle"></i>
          </button>
        </div>
      </div>

      <div className="container py-4 pt-custom-for-fixed-header">
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
    </>
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
