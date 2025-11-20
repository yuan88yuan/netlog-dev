import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'bootstrap';

interface CreateEventProps {
  show: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Your deployed backend URL

const CreateEvent: React.FC<CreateEventProps> = ({ show, onClose, onEventCreated }) => {
  const [eventSourceName, setEventSourceName] = useState<string>('');
  const [eventContent, setEventContent] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const bsModal = useRef<Modal | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      bsModal.current = new Modal(modalRef.current, { backdrop: 'static', keyboard: false });
    }
    return () => {
      if (bsModal.current) {
        bsModal.current.dispose();
        bsModal.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (bsModal.current) {
      if (show) {
        bsModal.current.show();
      } else {
        bsModal.current.hide();
      }
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/event-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_source_name: eventSourceName, content: eventContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(`Event log created successfully! ID: ${data.id}`);
      setEventSourceName('');
      setEventContent('');
      onEventCreated(); // Notify parent to refresh list and close modal
    } catch (e: any) {
      setError(`Failed to create event log: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="createEventModal" tabIndex={-1} aria-labelledby="createEventModalLabel" aria-hidden="true" ref={modalRef}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title" id="createEventModalLabel">Create New Event Log</h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {message && <div className="alert alert-success" role="alert">{message}</div>}
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="eventSourceName" className="form-label">Event Source Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="eventSourceName"
                  value={eventSourceName}
                  onChange={(e) => setEventSourceName(e.target.value)}
                  placeholder="e.g., UserActivity, SystemError"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="eventContent" className="form-label">Event Content</label>
                <textarea
                  className="form-control"
                  id="eventContent"
                  rows={5}
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  placeholder="e.g., User logged in, Failed to process payment"
                  required
                ></textarea>
              </div>
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
