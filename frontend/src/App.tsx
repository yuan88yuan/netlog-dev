import React, { useState, useRef } from 'react';
import EventList from './components/EventList';
import CreateEvent from './components/CreateEvent';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'bootstrap';

function App() {
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false);
  const eventListRef = useRef<any>(null); // Ref to EventList to call its refresh method

  const handleToggleCreateEventModal = () => {
    setShowCreateEventModal(prev => !prev);
  };

  const handleEventCreated = () => {
    setShowCreateEventModal(false); // Close modal after event is created
    if (eventListRef.current && eventListRef.current.refreshEvents) {
      eventListRef.current.refreshEvents(); // Refresh the event list
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h1 className="text-primary mb-0">Event Dashboard</h1>
        <button onClick={handleToggleCreateEventModal} className="ms-3 btn btn-outline-primary">
          {showCreateEventModal ? (
            <i className="bi bi-list-ul"></i> // Icon for Event List
          ) : (
            <i className="bi bi-plus-circle"></i> // Icon for Create Event
          )}
        </button>
      </div>

      <EventList ref={eventListRef} />

      {/* Create Event Modal */}
      <CreateEvent
        show={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}

export default App;
