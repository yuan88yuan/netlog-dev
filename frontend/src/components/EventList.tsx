import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface EventSource {
  id: number;
  name: string;
}

interface EventLog {
  id: number;
  event_source_id: number;
  timestamp: string;
  content: string;
  event_source_name: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Your deployed backend URL

const EventList = forwardRef((_props, ref) => {
  const [eventSources, setEventSources] = useState<EventSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<EventSource | null>(null);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventSources();
    fetchAllEventLogs(); // Fetch all events by default on initial load
  }, []);

  useImperativeHandle(ref, () => ({
    refreshEvents() {
      if (selectedSource) {
        fetchEventLogs(selectedSource.id);
      } else {
        fetchAllEventLogs();
      }
    }
  }));

  const fetchEventSources = async () => {
    try {
      // setLoading(true); // Loading handled by fetchAllEventLogs initially
      const response = await fetch(`${API_BASE_URL}/event-sources`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: EventSource[] = await response.json();
      setEventSources(data);
      // No default selection here, as 'All Events' is the default
    } catch (e: any) {
      setError(`Failed to fetch event sources: ${e.message}`);
    } finally {
      // setLoading(false); // Loading handled by fetchAllEventLogs initially
    }
  };

  const fetchEventLogs = async (sourceId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/event-logs/source/${sourceId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: EventLog[] = await response.json();
      setEventLogs(data);
    } catch (e: any) {
      setError(`Failed to fetch event logs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedSource(null); // Indicate that no specific source is selected
      fetchAllEventLogs();
    } else {
      const sourceId = parseInt(value, 10);
      const source = eventSources.find(s => s.id === sourceId);
      if (source) {
        setSelectedSource(source);
        fetchEventLogs(source.id);
      }
    }
  };

  const fetchAllEventLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/event-logs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: EventLog[] = await response.json();
      setEventLogs(data);
    } catch (e: any) {
      setError(`Failed to fetch all event logs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-5" role="alert">{error}</div>;
  }

  return (
    <div className="container py-4">

      <div className="mb-3">
        <label htmlFor="eventSourceSelect" className="form-label">Select Event Source:</label>
        <select
          id="eventSourceSelect"
          className="form-select"
          value={selectedSource?.id || 'all'}
          onChange={handleSourceChange}
        >
          <option value="all">* All Events</option>
          {eventSources.length === 0 ? (
            <option value="" disabled>No event sources available</option>
          ) : (
            eventSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="row g-4">
        <div className="col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">{selectedSource ? `Event Logs for ${selectedSource.name}` : 'All Event Logs'}</h5>
            </div>
            <div className="card-body">
              {eventLogs.length === 0 ? (
                <p className="text-muted">No logs found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-striped">
                    <thead>
                      <tr>
                        <th scope="col">日期時間</th>
                        {!selectedSource && <th scope="col">Event Source</th>}
                        <th scope="col">事件內容</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                            })}
                          </td>
                          {!selectedSource && <td>{log.event_source_name}</td>}
                          <td>{log.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EventList;
