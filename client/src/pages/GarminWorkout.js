import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
  Table,
  Badge,
  Spinner,
} from 'react-bootstrap';
import axios from 'axios';
import { FaMicrophone, FaMicrophoneSlash, FaUpload, FaSearch, FaCheckCircle, FaWatch } from 'react-icons/fa';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(duration) {
  if (!duration) return '—';
  if (duration.unit === 'lap_button') return 'Lap button';
  if (duration.unit === 'seconds') {
    const total = Math.round(duration.value);
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  }
  if (duration.unit === 'meters') {
    return duration.value >= 1000
      ? `${(duration.value / 1000).toFixed(1)} km`
      : `${duration.value} m`;
  }
  return `${duration.value} ${duration.unit}`;
}

function formatTarget(target) {
  if (!target || target.type === 'no_target') return '—';
  if (target.type === 'pace_zone') {
    const labels = { 1: 'Easy', 2: 'Aerobic', 3: 'Steady', 4: 'Threshold', 5: 'VO₂max' };
    return `Zone ${target.zone} (${labels[target.zone] || ''})`;
  }
  return target.type;
}

const STEP_COLORS = {
  warmup:   'warning',
  cooldown: 'info',
  interval: 'danger',
  recovery: 'success',
  rest:     'secondary',
  repeat:   'primary',
  other:    'light',
};

const STEP_LABELS = {
  warmup:   'Warm-up',
  cooldown: 'Cool-down',
  interval: 'Interval',
  recovery: 'Recovery',
  rest:     'Rest',
  repeat:   'Repeat',
  other:    'Other',
};

// ─── WorkoutPreview ───────────────────────────────────────────────────────────

function StepRow({ step, indent = 0 }) {
  if (step.type === 'repeat') {
    return (
      <>
        <tr>
          <td style={{ paddingLeft: `${indent * 20 + 8}px` }}>
            <Badge bg="primary">↺ {step.count}×</Badge>
          </td>
          <td colSpan={2} className="text-muted fst-italic">Repeat block</td>
        </tr>
        {(step.steps || []).map((child, i) => (
          <StepRow key={i} step={child} indent={indent + 1} />
        ))}
      </>
    );
  }

  return (
    <tr>
      <td style={{ paddingLeft: `${indent * 20 + 8}px` }}>
        <Badge bg={STEP_COLORS[step.type] || 'secondary'} text={step.type === 'other' ? 'dark' : undefined}>
          {STEP_LABELS[step.type] || step.type}
        </Badge>
      </td>
      <td>{formatDuration(step.duration)}</td>
      <td>{formatTarget(step.target)}</td>
    </tr>
  );
}

function WorkoutPreview({ parsedWorkout }) {
  if (!parsedWorkout) return null;
  return (
    <Card className="mt-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>{parsedWorkout.name}</strong>
          {parsedWorkout.description && (
            <div className="text-muted small mt-1">{parsedWorkout.description}</div>
          )}
        </div>
        <Badge bg="success">Running</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <Table striped hover responsive className="mb-0">
          <thead className="table-dark">
            <tr>
              <th>Step</th>
              <th>Duration</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {(parsedWorkout.steps || []).map((step, i) => (
              <StepRow key={i} step={step} />
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const EXAMPLE_WORKOUTS = [
  '10 min easy warmup, then 4x1 mile at threshold pace with 2 min jog recovery between each, 10 min easy cooldown',
  '30 minute easy aerobic run',
  '20 min warmup, 6x800m at 5K pace with 90 second recovery jog, 15 min cooldown',
  '15 min warmup, 3x2 miles at marathon pace with 3 min easy between, 15 min cooldown',
];

export default function GarminWorkout() {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedWorkout, setParsedWorkout] = useState(null);
  const [garminWorkout, setGarminWorkout] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | parsing | parsed | uploading | success | error
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const newText = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r) => r[0].transcript)
        .join(' ');
      setInputText((prev) => (prev ? prev.trim() + ' ' + newText.trim() : newText.trim()));
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        setMessage(`Voice error: ${e.error}`);
        setStatus('error');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setStatus('idle');
      setMessage('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setStatus('parsing');
    setMessage('');
    setParsedWorkout(null);
    setGarminWorkout(null);

    try {
      const { data } = await axios.post('/api/garmin/parse', { description: inputText });
      setParsedWorkout(data.parsedWorkout);
      setGarminWorkout(data.garminWorkout);
      setStatus('parsed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to parse workout';
      setMessage(errMsg);
      setStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!garminWorkout) return;

    setStatus('uploading');
    setMessage('');

    try {
      const { data } = await axios.post('/api/garmin/upload', { garminWorkout });
      setMessage(`"${data.workoutName}" was added to Garmin Connect. Sync your watch to find it under Training › Workouts.`);
      setStatus('success');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Upload failed';
      setMessage(errMsg);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setInputText('');
    setParsedWorkout(null);
    setGarminWorkout(null);
    setStatus('idle');
    setMessage('');
  };

  const handleExample = (text) => {
    setInputText(text);
    setParsedWorkout(null);
    setGarminWorkout(null);
    setStatus('idle');
    setMessage('');
  };

  const isParsing = status === 'parsing';
  const isUploading = status === 'uploading';
  const hasParsed = status === 'parsed' || status === 'uploading' || status === 'success';

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <h2 className="mb-1">
        <FaWatch className="me-2 text-primary" />
        Workout Creator
      </h2>
      <p className="text-muted mb-4">
        Describe your workout in plain English or speak it aloud — Claude will parse it into a
        structured Garmin workout and send it to your watch.
      </p>

      {status === 'success' && (
        <Alert variant="success" onClose={handleReset} dismissible>
          <FaCheckCircle className="me-2" />
          {message}
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="danger" onClose={() => setStatus('idle')} dismissible>
          {message}
        </Alert>
      )}

      {/* Input */}
      <Card>
        <Card.Header>
          <strong>Describe your workout</strong>
        </Card.Header>
        <Card.Body>
          <Form.Group>
            <div className="d-flex gap-2 align-items-start">
              <Form.Control
                as="textarea"
                rows={4}
                placeholder={`e.g. "10 min easy warmup, 4x800m at 5K pace with 90 sec recovery, 10 min cooldown"`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isParsing || isUploading}
              />
              {speechSupported && (
                <Button
                  variant={isListening ? 'danger' : 'outline-secondary'}
                  onClick={toggleListening}
                  disabled={isParsing || isUploading}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                  style={{ minWidth: 46 }}
                >
                  {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </Button>
              )}
            </div>
            {isListening && (
              <div className="text-danger small mt-1">
                <Spinner animation="grow" size="sm" className="me-1" />
                Listening… speak your workout, then click the mic to stop.
              </div>
            )}
          </Form.Group>

          {/* Example workouts */}
          <div className="mt-3">
            <small className="text-muted me-2">Examples:</small>
            {EXAMPLE_WORKOUTS.map((ex, i) => (
              <Button
                key={i}
                variant="link"
                size="sm"
                className="p-0 me-3 text-decoration-none"
                onClick={() => handleExample(ex)}
                disabled={isParsing || isUploading}
              >
                {i === 0 ? 'Threshold intervals' : i === 1 ? 'Easy run' : i === 2 ? '5K repeats' : 'Marathon pace'}
              </Button>
            ))}
          </div>
        </Card.Body>
        <Card.Footer className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={handleParse}
            disabled={!inputText.trim() || isParsing || isUploading}
          >
            {isParsing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Parsing…
              </>
            ) : (
              <>
                <FaSearch className="me-2" />
                Parse Workout
              </>
            )}
          </Button>
          {hasParsed && (
            <Button variant="outline-secondary" onClick={handleReset} disabled={isUploading}>
              Start over
            </Button>
          )}
        </Card.Footer>
      </Card>

      {/* Preview */}
      {hasParsed && parsedWorkout && (
        <>
          <WorkoutPreview parsedWorkout={parsedWorkout} />

          <div className="d-flex justify-content-end mt-3">
            <Button
              variant="success"
              size="lg"
              onClick={handleUpload}
              disabled={isUploading || status === 'success'}
            >
              {isUploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending to Garmin…
                </>
              ) : status === 'success' ? (
                <>
                  <FaCheckCircle className="me-2" />
                  Sent!
                </>
              ) : (
                <>
                  <FaUpload className="me-2" />
                  Send to Garmin Watch
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}
