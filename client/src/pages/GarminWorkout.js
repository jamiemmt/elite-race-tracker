import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Form,
  Button,
  Alert,
  Card,
  Table,
  Badge,
  Spinner,
} from 'react-bootstrap';
import axios from 'axios';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaUpload,
  FaSearch,
  FaCheckCircle,
  FaStopwatch,
  FaRedo,
} from 'react-icons/fa';

// ─── Inline styles ────────────────────────────────────────────────────────────

// Standalone (home-screen) detection — hides regular Header/Footer padding
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const pageStyle = {
  paddingTop: isStandalone ? 'env(safe-area-inset-top, 16px)' : undefined,
  paddingBottom: 'env(safe-area-inset-bottom, 24px)',
  minHeight: '100dvh',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(duration) {
  if (!duration) return '—';
  if (duration.unit === 'lap_button') return 'Lap btn';
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
    return `Z${target.zone} · ${labels[target.zone] || ''}`;
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

// ─── Step row (handles nesting for repeat blocks) ─────────────────────────────

function StepRow({ step, indent = 0 }) {
  if (step.type === 'repeat') {
    return (
      <>
        <tr>
          <td style={{ paddingLeft: `${indent * 16 + 8}px` }}>
            <Badge bg="primary">↺ {step.count}×</Badge>
          </td>
          <td colSpan={2} className="text-muted fst-italic small">
            Repeat block
          </td>
        </tr>
        {(step.steps || []).map((child, i) => (
          <StepRow key={i} step={child} indent={indent + 1} />
        ))}
      </>
    );
  }

  return (
    <tr>
      <td style={{ paddingLeft: `${indent * 16 + 8}px` }}>
        <Badge
          bg={STEP_COLORS[step.type] || 'secondary'}
          text={step.type === 'other' ? 'dark' : undefined}
        >
          {STEP_LABELS[step.type] || step.type}
        </Badge>
      </td>
      <td className="small">{formatDuration(step.duration)}</td>
      <td className="small">{formatTarget(step.target)}</td>
    </tr>
  );
}

function WorkoutPreview({ parsedWorkout }) {
  if (!parsedWorkout) return null;
  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div className="fw-semibold">{parsedWorkout.name}</div>
          {parsedWorkout.description && (
            <div className="text-muted small mt-1">{parsedWorkout.description}</div>
          )}
        </div>
        <Badge bg="success" className="flex-shrink-0">Running</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <Table striped hover responsive className="mb-0" size="sm">
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

// ─── Example presets ──────────────────────────────────────────────────────────

const EXAMPLES = [
  { label: 'Easy run',         text: '30 minute easy aerobic run' },
  { label: 'Threshold',        text: '10 min warmup, 4×1 mile at threshold pace with 2 min jog recovery, 10 min cooldown' },
  { label: '5K repeats',       text: '20 min warmup, 6×800m at 5K pace with 90 second recovery jog, 15 min cooldown' },
  { label: 'Marathon pace',    text: '15 min warmup, 3×2 miles at marathon pace with 3 min easy recovery, 15 min cooldown' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GarminWorkout() {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedWorkout, setParsedWorkout] = useState(null);
  const [garminWorkout, setGarminWorkout] = useState(null);
  const [status, setStatus] = useState('idle');   // idle | parsing | parsed | uploading | success | error
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showExamples, setShowExamples] = useState(false);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Voice setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSpeechSupported(false); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      setInputText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech') {
        setMessage(`Voice error: ${e.error}`);
        setStatus('error');
      }
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setStatus('idle');
      setMessage('');
      recognitionRef.current.start();
      setIsListening(true);
      textareaRef.current?.focus();
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
      setMessage(err.response?.data?.error || err.message || 'Failed to parse workout');
      setStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!garminWorkout) return;
    setStatus('uploading');
    setMessage('');
    try {
      const { data } = await axios.post('/api/garmin/upload', { garminWorkout });
      setMessage(
        `"${data.workoutName}" added to Garmin Connect. Sync your watch to find it under Training › Workouts.`
      );
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.error || err.message || 'Upload failed');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setInputText('');
    setParsedWorkout(null);
    setGarminWorkout(null);
    setStatus('idle');
    setMessage('');
    setShowExamples(false);
  };

  const handleExample = (text) => {
    setInputText(text);
    setParsedWorkout(null);
    setGarminWorkout(null);
    setStatus('idle');
    setMessage('');
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  const isParsing   = status === 'parsing';
  const isUploading = status === 'uploading';
  const busy        = isParsing || isUploading;
  const hasParsed   = ['parsed', 'uploading', 'success'].includes(status);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <Container className="py-3" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-0 fw-bold">
              <FaStopwatch className="me-2 text-primary" />
              Workout Creator
            </h4>
            <p className="text-muted small mb-0">
              Describe your workout → send to Garmin
            </p>
          </div>
          {(hasParsed || inputText) && (
            <Button variant="outline-secondary" size="sm" onClick={handleReset}>
              <FaRedo className="me-1" /> Reset
            </Button>
          )}
        </div>

        {/* Status banners */}
        {status === 'success' && (
          <Alert variant="success" onClose={handleReset} dismissible className="d-flex align-items-start gap-2">
            <FaCheckCircle className="flex-shrink-0 mt-1" />
            <span>{message}</span>
          </Alert>
        )}
        {status === 'error' && (
          <Alert variant="danger" onClose={() => setStatus('idle')} dismissible>
            {message}
          </Alert>
        )}

        {/* Input card */}
        <Card>
          <Card.Body className="pb-2">
            <div className="d-flex gap-2 align-items-start">
              <Form.Control
                ref={textareaRef}
                as="textarea"
                rows={isStandalone ? 5 : 4}
                placeholder='e.g. "10 min warmup, 4×800m at 5K pace with 90 sec recovery, 10 min cooldown"'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={busy}
                autoCorrect="off"
                autoCapitalize="sentences"
                style={{ fontSize: 16 /* prevents iOS auto-zoom */ }}
              />
              {speechSupported && (
                <Button
                  variant={isListening ? 'danger' : 'outline-secondary'}
                  onClick={toggleListening}
                  disabled={busy}
                  title={isListening ? 'Stop' : 'Speak workout'}
                  style={{ width: 52, height: 52, flexShrink: 0, padding: 0 }}
                >
                  {isListening
                    ? <FaMicrophoneSlash size={20} />
                    : <FaMicrophone size={20} />}
                </Button>
              )}
            </div>

            {isListening && (
              <div className="text-danger small mt-2 d-flex align-items-center gap-2">
                <Spinner animation="grow" size="sm" />
                Listening… tap the mic again to stop.
              </div>
            )}

            {/* Examples */}
            <div className="mt-2">
              <Button
                variant="link"
                size="sm"
                className="p-0 text-decoration-none text-muted"
                onClick={() => setShowExamples(!showExamples)}
                disabled={busy}
              >
                {showExamples ? '▲ Hide examples' : '▼ Show examples'}
              </Button>
              {showExamples && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <Button
                      key={ex.label}
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleExample(ex.text)}
                      style={{ fontSize: 13 }}
                    >
                      {ex.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card.Body>

          <Card.Footer>
            <Button
              variant="primary"
              className="w-100"
              style={{ height: 48 }}
              onClick={handleParse}
              disabled={!inputText.trim() || busy}
            >
              {isParsing ? (
                <><Spinner animation="border" size="sm" className="me-2" />Parsing workout…</>
              ) : (
                <><FaSearch className="me-2" />Parse Workout</>
              )}
            </Button>
          </Card.Footer>
        </Card>

        {/* Preview */}
        {hasParsed && parsedWorkout && (
          <>
            <WorkoutPreview parsedWorkout={parsedWorkout} />

            <Button
              variant="success"
              className="w-100 mt-3"
              style={{ height: 52, fontSize: 17 }}
              onClick={handleUpload}
              disabled={isUploading || status === 'success'}
            >
              {isUploading ? (
                <><Spinner animation="border" size="sm" className="me-2" />Sending to Garmin…</>
              ) : status === 'success' ? (
                <><FaCheckCircle className="me-2" />Sent!</>
              ) : (
                <><FaUpload className="me-2" />Send to Garmin Watch</>
              )}
            </Button>
          </>
        )}
      </Container>
    </div>
  );
}
