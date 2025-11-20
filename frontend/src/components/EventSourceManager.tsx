import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface EventSource {
  id: number;
  name: string;
}

const EventSourceManager: React.FC = () => {
  const [eventSources, setEventSources] = useState<EventSource[]>([]);
  const [newEventSourceName, setNewEventSourceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPruneModal, setShowPruneModal] = useState<boolean>(false);
  const [selectedSourceForPrune, setSelectedSourceForPrune] = useState<EventSource | null>(null);
  const [pruneCount, setPruneCount] = useState<number>(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEventSources();
  }, []);

  const fetchEventSources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/event-sources`);
      if (!response.ok) {
        throw new Error('Failed to fetch event sources');
      }
      const data = await response.json();
      setEventSources(data);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEventSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventSourceName.trim()) {
      setError('Event source name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/event-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newEventSourceName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event source');
      }

      setNewEventSourceName('');
      fetchEventSources(); // Refresh the list
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteEventSource = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event source and all its logs?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/event-sources/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete event source');
        }

        fetchEventSources(); // Refresh the list
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handlePruneLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceForPrune || pruneCount <= 0) {
      setError('Invalid source or count for pruning.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/event-logs/prune`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_source_name: selectedSourceForPrune.name,
          count: pruneCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to prune event logs');
      }
      
      const result = await response.json();
      setSuccessMessage(result.message || 'Logs pruned successfully.');
      setTimeout(() => setSuccessMessage(null), 5000); // Hide message after 5 seconds
      handleClosePruneModal();

    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleShowPruneModal = (source: EventSource) => {
    setSelectedSourceForPrune(source);
    setShowPruneModal(true);
  };

  const handleClosePruneModal = () => {
    setShowPruneModal(false);
    setSelectedSourceForPrune(null);
    setPruneCount(1);
    setError(null);
  };

  return (
    <div className="container mt-4">
      <h2>Manage Event Sources</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Create New Event Source</h5>
          <form onSubmit={handleCreateEventSource}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="New event source name"
                value={newEventSourceName}
                onChange={(e) => setNewEventSourceName(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">Create</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Existing Event Sources</h5>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventSources.map((source) => (
                  <tr key={source.id}>
                    <td>{source.id}</td>
                    <td>{source.name}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleShowPruneModal(source)}
                      >
                        Prune
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteEventSource(source.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Prune Modal */}
      <Modal show={showPruneModal} onHide={handleClosePruneModal}>
        <Modal.Header closeButton>
          <Modal.Title>Prune Event Logs for "{selectedSourceForPrune?.name}"</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePruneLogs}>
          <Modal.Body>
            {error && <div className="alert alert-danger">{error}</div>}
            <Form.Group>
              <Form.Label>Number of old logs to delete:</Form.Label>
              <Form.Control
                type="number"
                value={pruneCount}
                onChange={(e) => setPruneCount(Number(e.target.value))}
                min="1"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClosePruneModal}>
              Cancel
            </Button>
            <Button variant="warning" type="submit">
              Prune Logs
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EventSourceManager;

