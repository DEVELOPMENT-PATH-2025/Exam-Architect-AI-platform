import { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft,
  Clock,
  Play,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Download,
  Keyboard,
  Camera,
  Mic,
  Video,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Maximize2,
  Lock,
  UserCheck,
  UserX
} from 'lucide-react';
import { generateMockPaperAgent, evaluateMockPaperAgent, proctorPresenceAgent } from '../services/geminiService';
import HandwrittenInputPanel from './HandwrittenInputPanel';
import { cn } from '../lib/utils';

interface MockPart {
  partId: string;
  label: string;
  type: string;
  marks: number;
  text: string;
  keywords: string[];
  modelAnswer: string;
  unitLabel?: string;
  unitTitle?: string;
}

interface MockChoice {
  label: string;
  parts: MockPart[];
}

interface MockSection {
  questionNumber: number;
  unitLabel: string;
  unitTitle: string;
  marks: number;
  choiceA: MockChoice;
  choiceB: MockChoice;
}

interface MockPaper {
  title: string;
  subject: string;
  code: string;
  universityName: string;
  semester: string;
  totalMarks: number;
  durationSeconds: number;
  instructions: string[];
  sections: MockSection[];
}

interface PartAnswerState {
  mode: 'keyboard' | 'photo';
  text: string;
  imageDataUrl: string | null;
  mimeType: string | null;
}

function formatTimer(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildShuffledMixedPaper(rawPaper: MockPaper): MockPaper {
  const secs = rawPaper.sections || [];
  if (secs.length !== 5) return rawPaper;

  const permA = shuffleIndices(5);
  let permB = shuffleIndices(5);
  // Ensure every question mixes two DIFFERENT units across part (a) and part (b)
  for (let attempt = 0; attempt < 15 && permB.some((v, idx) => v === permA[idx]); attempt++) {
    permB = shuffleIndices(5);
  }
  if (permB.some((v, idx) => v === permA[idx])) {
    permB = permA.map((_, idx) => permA[(idx + 1) % 5]);
  }

  const pickPart = (sec: MockSection, choice: 'A' | 'B', preferredType: 'numerical' | 'long', fallbackIdx: number): MockPart => {
    const pool = choice === 'A' ? sec.choiceA.parts : sec.choiceB.parts;
    const found = pool.find((p) => p.type === preferredType) || pool[fallbackIdx] || pool[0];
    return {
      ...found,
      unitLabel: sec.unitLabel,
      unitTitle: sec.unitTitle
    };
  };

  const mixedSections: MockSection[] = Array.from({ length: 5 }, (_, idx) => {
    const qNum = idx + 1;
    const sec1 = secs[permA[idx]];
    const sec2 = secs[permB[idx]];
    const flipOrder = idx % 2 === 1;

    const pA1 = pickPart(sec1, 'A', flipOrder ? 'numerical' : 'long', 0);
    const pA2 = pickPart(sec2, 'A', flipOrder ? 'long' : 'numerical', 1);

    const pB1 = pickPart(sec2, 'B', flipOrder ? 'long' : 'numerical', 0);
    const pB2 = pickPart(sec1, 'B', flipOrder ? 'numerical' : 'long', 1);

    return {
      questionNumber: qNum,
      unitLabel: `${sec1.unitLabel} & ${sec2.unitLabel}`,
      unitTitle: `Shuffled Mixed Section (${sec1.unitLabel} + ${sec2.unitLabel})`,
      marks: 14,
      choiceA: {
        label: `Choice A (Q${qNum}A)`,
        parts: [
          { ...pA1, partId: `Q${qNum}A-a`, label: '(a)' },
          { ...pA2, partId: `Q${qNum}A-b`, label: '(b)' }
        ]
      },
      choiceB: {
        label: `Choice B (Q${qNum}B)`,
        parts: [
          { ...pB1, partId: `Q${qNum}B-a`, label: '(a)' },
          { ...pB2, partId: `Q${qNum}B-b`, label: '(b)' }
        ]
      }
    };
  });

  return {
    ...rawPaper,
    sections: mixedSections
  };
}

export default function MockExamSimulator({
  curriculum,
  onBack
}: {
  curriculum: any;
  onBack: () => void;
}) {
  const subjects = curriculum?.subjects || [];
  const [selectedSubjectName, setSelectedSubjectName] = useState(subjects[0]?.name || '');
  const selectedSubject = useMemo(
    () =>
      subjects.find((s: any) => s.name === selectedSubjectName) ||
      subjects[0] || { name: selectedSubjectName, code: 'CORE', topics: [] },
    [subjects, selectedSubjectName]
  );

  const [phase, setPhase] = useState<'setup' | 'writing' | 'evaluating' | 'results'>('setup');
  const [generatingPaper, setGeneratingPaper] = useState(false);
  const [paper, setPaper] = useState<MockPaper | null>(null);

  // Per question: 'A' | 'B' choice selection
  const [unitChoiceMap, setUnitChoiceMap] = useState<Record<number, 'A' | 'B'>>({
    1: 'A',
    2: 'A',
    3: 'A',
    4: 'A',
    5: 'A'
  });

  // Per partId answer store
  const [answers, setAnswers] = useState<Record<string, PartAnswerState>>({});

  // 3-Hour (10800s) Countdown Timer
  const [secondsLeft, setSecondsLeft] = useState(3 * 60 * 60);

  // Proctoring State (Camera + Mic + Fullscreen + Person Presence + Tab-Switch)
  const proctorStreamRef = useRef<MediaStream | null>(null);
  const proctorVideoRef = useRef<HTMLVideoElement | null>(null);
  const setupVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micIntervalRef = useRef<number | null>(null);
  const suppressBlurRef = useRef<boolean>(false);
  const disqualifiedLockRef = useRef<boolean>(false);
  const wasNativeFullscreenRef = useRef<boolean>(false);
  const absenceCountRef = useRef<number>(0);
  const presenceCheckBusyRef = useRef<boolean>(false);
  const lastViolationAtRef = useRef<number>(0);
  const inViolationStateRef = useRef<boolean>(false);
  const violationHistoryRef = useRef<
    { strike: number; type: string; label: string; reason: string; time: string }[]
  >([]);
  const latestPaperRef = useRef<MockPaper | null>(null);
  const latestAnswersRef = useRef<Record<string, PartAnswerState>>({});
  const latestUnitChoiceMapRef = useRef<Record<number, 'A' | 'B'>>({ 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A' });
  const submitHandlerRef = useRef<(autoReason?: string) => void>(() => {});

  const [proctorStatus, setProctorStatus] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle');
  const [proctorError, setProctorError] = useState<string | null>(null);
  const [camActive, setCamActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [absenceWarnings, setAbsenceWarnings] = useState(0);
  const [personPresentStatus, setPersonPresentStatus] = useState<'checking' | 'present' | 'violation'>('checking');
  const [activeCamViolationLabel, setActiveCamViolationLabel] = useState<string | null>(null);
  const [setupCameraAlert, setSetupCameraAlert] = useState<{
    status: 'checking' | 'ok' | 'shutter_blocked' | 'other_person_detected' | 'object_detected' | 'person_absent';
    label: string;
    reason: string;
  } | null>(null);
  const [absenceModal, setAbsenceModal] = useState<{
    count: number;
    violationType: 'shutter_blocked' | 'other_person_detected' | 'object_detected' | 'person_absent';
    title: string;
    reason: string;
    personReturned: boolean;
  } | null>(null);

  latestPaperRef.current = paper;
  latestAnswersRef.current = answers;
  latestUnitChoiceMapRef.current = unitChoiceMap;

  // Evaluation Result
  const [evalResult, setEvalResult] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getFullscreenElement = () => {
    return document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement || null;
  };

  const enterBrowserFullscreen = async (): Promise<boolean> => {
    try {
      if (getFullscreenElement()) {
        wasNativeFullscreenRef.current = true;
        setIsNativeFullscreen(true);
        return true;
      }
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      } else {
        return false;
      }
      const active = Boolean(getFullscreenElement());
      if (active) wasNativeFullscreenRef.current = true;
      setIsNativeFullscreen(active);
      return active;
    } catch {
      setIsNativeFullscreen(Boolean(getFullscreenElement()));
      return false;
    }
  };

  const exitBrowserFullscreen = () => {
    wasNativeFullscreenRef.current = false;
    setIsNativeFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } catch {
      // Ignore exit errors
    }
  };

  const stopProctoringMedia = () => {
    if (micIntervalRef.current) {
      window.clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (proctorStreamRef.current) {
      proctorStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      proctorStreamRef.current = null;
    }
    setCamActive(false);
    setMicActive(false);
    setMicLevel(0);
    setSetupCameraAlert(null);
    setActiveCamViolationLabel(null);
  };

  useEffect(() => {
    return () => {
      stopProctoringMedia();
      exitBrowserFullscreen();
    };
  }, []);

  // Attach active MediaStream to whichever video preview element is mounted
  useEffect(() => {
    const stream = proctorStreamRef.current;
    if (!stream) return;
    if (phase === 'setup' && setupVideoRef.current) {
      setupVideoRef.current.srcObject = stream;
      setupVideoRef.current.play().catch(() => {});
    }
    if (phase === 'writing' && proctorVideoRef.current) {
      proctorVideoRef.current.srcObject = stream;
      proctorVideoRef.current.play().catch(() => {});
    }
  }, [phase, proctorStatus, camActive]);

  const startMicAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      micIntervalRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 90) * 100)));
      }, 150);
    } catch {
      // Ignore AudioContext restriction if any; mic track itself remains checked
    }
  };

  const enableProctorDevices = async (): Promise<boolean> => {
    setProctorStatus('checking');
    setProctorError(null);
    stopProctoringMedia();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setProctorStatus('error');
      setProctorError('Camera and Microphone access is required for proctored exams, but your browser blocked media devices.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 } },
        audio: true
      });

      const videoTracks = stream.getVideoTracks().filter((t) => t.readyState === 'live');
      const audioTracks = stream.getAudioTracks().filter((t) => t.readyState === 'live');

      if (videoTracks.length === 0 || audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        setProctorStatus('error');
        setProctorError('Both Camera and Microphone must be active to enter the proctored mock exam.');
        return false;
      }

      proctorStreamRef.current = stream;
      setCamActive(true);
      setMicActive(true);
      setProctorStatus('ready');
      startMicAnalyzer(stream);

      if (setupVideoRef.current) {
        setupVideoRef.current.srcObject = stream;
        setupVideoRef.current.play().catch(() => {});
      }

      return true;
    } catch (err: any) {
      setProctorStatus('error');
      setProctorError(
        err?.name === 'NotAllowedError'
          ? 'Permission denied: please allow BOTH Camera and Microphone in your browser address bar to start the proctored exam.'
          : 'Unable to access Camera & Microphone. Please verify devices are connected and allowed.'
      );
      return false;
    }
  };

  const computeAttemptStatsSnapshot = () => {
    const curPaper = latestPaperRef.current;
    const curAnswers = latestAnswersRef.current;
    const curChoiceMap = latestUnitChoiceMapRef.current;
    if (!curPaper) {
      return {
        attemptedParts: 0,
        missedParts: 10,
        totalParts: 10,
        attemptedMarks: 0,
        attemptedList: [] as string[],
        missedList: [] as string[]
      };
    }

    let attemptedParts = 0;
    let totalParts = 0;
    let attemptedMarks = 0;
    const attemptedList: string[] = [];
    const missedList: string[] = [];

    curPaper.sections.forEach((sec) => {
      const chosenKey = curChoiceMap[sec.questionNumber] || 'A';
      const chosen = chosenKey === 'A' ? sec.choiceA : sec.choiceB;
      chosen.parts.forEach((p) => {
        totalParts += 1;
        const ans = curAnswers[p.partId];
        if (ans && (ans.text?.trim() || ans.imageDataUrl)) {
          attemptedParts += 1;
          attemptedMarks += p.marks;
          attemptedList.push(p.partId);
        } else {
          missedList.push(p.partId);
        }
      });
    });

    return {
      attemptedParts,
      missedParts: Math.max(0, totalParts - attemptedParts),
      totalParts,
      attemptedMarks,
      attemptedList,
      missedList
    };
  };

  const triggerDisqualification = (reason: string) => {
    if (disqualifiedLockRef.current) return;
    disqualifiedLockRef.current = true;
    const stats = computeAttemptStatsSnapshot();
    const dqTime = new Date().toLocaleTimeString();
    const finalLog = [
      ...violationHistoryRef.current,
      {
        strike: violationHistoryRef.current.length + 1,
        type: 'auto_disqualified',
        label: 'Auto-Disqualification',
        reason,
        time: dqTime
      }
    ];
    stopProctoringMedia();
    exitBrowserFullscreen();
    setAbsenceModal(null);
    setEvalResult({
      disqualified: true,
      disqualificationReason: reason,
      disqualifiedAt: dqTime,
      subject: latestPaperRef.current?.subject || selectedSubject.name,
      totalObtained: 0,
      totalMax: 70,
      percentage: 0,
      grade: 'FAILED (DISQUALIFIED)',
      attemptedParts: stats.attemptedParts,
      missedParts: stats.missedParts,
      totalParts: stats.totalParts,
      attemptedMarks: stats.attemptedMarks,
      attemptedList: stats.attemptedList,
      missedList: stats.missedList,
      violationLog: finalLog,
      evaluatedParts: []
    });
    setPhase('results');
  };

  // Monitor tab switching, window blur, fullscreen exit, and camera/mic track disconnect during active exam
  useEffect(() => {
    if (phase !== 'writing') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerDisqualification('Tab switch or browser minimization detected during the proctored exam.');
      }
    };

    const handleWindowBlur = () => {
      if (suppressBlurRef.current) return;
      triggerDisqualification('Window focus lost (switched tab, app, or external window) during the proctored exam.');
    };

    const handleWindowFocus = () => {
      if (suppressBlurRef.current) {
        window.setTimeout(() => {
          suppressBlurRef.current = false;
        }, 350);
      }
    };

    const handleFullscreenChange = () => {
      const fsActive = Boolean(getFullscreenElement());
      setIsNativeFullscreen(fsActive);
      if (fsActive) {
        wasNativeFullscreenRef.current = true;
      } else if (wasNativeFullscreenRef.current && !suppressBlurRef.current) {
        triggerDisqualification('Exited mandatory Fullscreen Mode (ESC or window restore) during the proctored exam.');
      }
    };

    const stream = proctorStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          triggerDisqualification(
            `${track.kind === 'video' ? 'Camera' : 'Microphone'} feed was disabled or disconnected during the proctored exam.`
          );
        };
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [phase, paper]);

  // Monitor camera in BOTH Setup preview box (live pre-check warnings) AND Active Fullscreen Exam (3 warnings -> 4th auto-submit):
  // Detects: Privacy Shutter Closed, Other Person Detected (2+ people), Object Detected (any object apart from face), & Not Present on Camera.
  useEffect(() => {
    const isSetupLive = phase === 'setup' && camActive;
    const isWritingLive = phase === 'writing';
    if (!isSetupLive && !isWritingLive) return;

    let cancelled = false;
    presenceCheckBusyRef.current = false;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    let lastAiCheckAt = 0;

    type ViolationKind = 'shutter_blocked' | 'other_person_detected' | 'object_detected' | 'person_absent';

    const labelMap: Record<ViolationKind, string> = {
      shutter_blocked: 'Privacy Shutter Closed',
      other_person_detected: 'Other Person Detected',
      object_detected: 'Object Detected',
      person_absent: 'Not on Camera'
    };

    const titleMap: Record<ViolationKind, string> = {
      shutter_blocked: 'Privacy Shutter Closed / Remove Object!',
      other_person_detected: 'Other Person Detected!',
      object_detected: 'Object Detected!',
      person_absent: 'Not Visible on Camera!'
    };

    const handleViolationDetected = (vType: ViolationKind, reasonText: string) => {
      if (cancelled) return;

      if (isSetupLive) {
        setSetupCameraAlert({
          status: vType,
          label: labelMap[vType],
          reason: reasonText
        });
        return;
      }

      const now = Date.now();
      const wasInViolation = inViolationStateRef.current;
      const cooldownMs = wasInViolation ? 3200 : 1200;

      setPersonPresentStatus('violation');
      setActiveCamViolationLabel(labelMap[vType]);

      // Respect short cooldown so dual local+AI loops don't double-strike within 1 second
      if (now - lastViolationAtRef.current < cooldownMs) {
        return;
      }

      lastViolationAtRef.current = now;
      inViolationStateRef.current = true;
      absenceCountRef.current += 1;
      const nextWarn = absenceCountRef.current;
      setAbsenceWarnings(nextWarn);

      const entry = {
        strike: nextWarn,
        type: vType,
        label: labelMap[vType],
        reason: reasonText,
        time: new Date().toLocaleTimeString()
      };
      violationHistoryRef.current = [...violationHistoryRef.current, entry];

      if (nextWarn <= 3) {
        setAbsenceModal({
          count: nextWarn,
          violationType: vType,
          title: titleMap[vType],
          reason: reasonText,
          personReturned: false
        });
      } else {
        setAbsenceModal(null);
        submitHandlerRef.current(
          `Auto-submitted on 4th camera violation (${labelMap[vType]}): ${reasonText}`
        );
      }
    };

    const runProctorMonitorTick = async () => {
      if (cancelled || disqualifiedLockRef.current || presenceCheckBusyRef.current) return;
      const video = isSetupLive ? setupVideoRef.current : proctorVideoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || !ctx) return;

      presenceCheckBusyRef.current = true;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // 1. Instant local check for closed privacy shutter / finger / object covering lens
        let sumLuma = 0;
        let sumSq = 0;
        let edgeCount = 0;
        let prevLuma = 0;
        let count = 0;
        const step = 16;
        for (let i = 0; i < pixels.length; i += step) {
          const luma = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          sumLuma += luma;
          sumSq += luma * luma;
          if (count > 0 && Math.abs(luma - prevLuma) > 10) {
            edgeCount += 1;
          }
          prevLuma = luma;
          count += 1;
        }
        const avgLuma = count > 0 ? sumLuma / count : 0;
        const variance = count > 0 ? Math.max(0, sumSq / count - avgLuma * avgLuma) : 0;
        const stdDev = Math.sqrt(variance);
        const edgeRatio = count > 1 ? edgeCount / (count - 1) : 0;

        const isShutterClosedLocally = avgLuma < 16 || (stdDev < 10 && edgeRatio < 0.025);
        if (isShutterClosedLocally) {
          handleViolationDetected(
            'shutter_blocked',
            'Your camera privacy shutter is closed or an object is covering the lens. Open your camera shutter or remove the object immediately.'
          );
          return;
        }

        // 2. Run Gemini Vision check every ~2.0s to detect:
        //    - Other person (2+ people in frame -> "Other Person Detected")
        //    - Any object brought apart from face ("Object Detected")
        //    - Candidate not present on camera ("Not on Camera")
        const now = Date.now();
        if (now - lastAiCheckAt < 1900) {
          return;
        }
        lastAiCheckAt = now;

        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        const res = await proctorPresenceAgent(frameDataUrl, 'image/jpeg');

        if (cancelled || disqualifiedLockRef.current) return;
        if (res.fallback) return;

        if (res.shutterClosedOrBlocked || res.violationType === 'shutter_blocked') {
          handleViolationDetected(
            'shutter_blocked',
            res.reason ||
              'Camera privacy shutter closed or lens blocked. Remove any object or open your camera immediately.'
          );
        } else if (res.otherPersonDetected || res.violationType === 'other_person_detected') {
          handleViolationDetected(
            'other_person_detected',
            res.reason || 'Other person detected on camera (two or more people visible). Only you may be on camera.'
          );
        } else if (res.objectDetected || res.violationType === 'object_detected') {
          const itemLabel = res.detectedItem && res.detectedItem !== 'none' ? ` (${res.detectedItem})` : '';
          handleViolationDetected(
            'object_detected',
            res.reason ||
              `Object detected${itemLabel} apart from your face. Remove all objects from camera view immediately.`
          );
        } else if (!res.personPresent || res.violationType === 'person_absent') {
          handleViolationDetected(
            'person_absent',
            res.reason || 'You are not visible on camera. Keep your face centered on camera.'
          );
        } else {
          if (isSetupLive) {
            setSetupCameraAlert({
              status: 'ok',
              label: 'Single Person Verified',
              reason: 'Only your face is visible — no extra person or object detected.'
            });
          } else {
            inViolationStateRef.current = false;
            setPersonPresentStatus('present');
            setActiveCamViolationLabel(null);
            setAbsenceModal((prev) => (prev ? { ...prev, personReturned: true } : null));
          }
        }
      } catch {
        // Keep exam running cleanly on transient frame read error
      } finally {
        presenceCheckBusyRef.current = false;
      }
    };

    const initialTimer = window.setTimeout(runProctorMonitorTick, 700);
    const intervalId = window.setInterval(runProctorMonitorTick, 1000);

    return () => {
      cancelled = true;
      presenceCheckBusyRef.current = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
    };
  }, [phase, camActive]);

  // Live 3-Hour Countdown Timer (runs continuously in proctored mode)
  useEffect(() => {
    if (phase !== 'writing') return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-submit if 3-hour countdown reaches 0
  useEffect(() => {
    if (phase === 'writing' && secondsLeft === 0 && paper) {
      submitHandlerRef.current();
    }
  }, [secondsLeft, phase]);

  const startProctoredMockExam = async () => {
    setGeneratingPaper(true);
    wasNativeFullscreenRef.current = false;
    try {
      // Request fullscreen synchronously on user click when cam & mic are already active
      if (camActive && micActive && proctorStreamRef.current) {
        enterBrowserFullscreen();
      }

      const devicesOk = camActive && micActive && proctorStreamRef.current ? true : await enableProctorDevices();
      if (!devicesOk) {
        exitBrowserFullscreen();
        setGeneratingPaper(false);
        return;
      }

      const generated = await generateMockPaperAgent({
        subject: selectedSubject.name,
        code: selectedSubject.code || 'CORE',
        topics: selectedSubject.topics || [],
        universityName: curriculum?.universityName || 'Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal',
        semester: curriculum?.semester || 'Semester End-Term Examination'
      });

      const shuffledPaper = buildShuffledMixedPaper(generated);

      disqualifiedLockRef.current = false;
      absenceCountRef.current = 0;
      presenceCheckBusyRef.current = false;
      lastViolationAtRef.current = 0;
      inViolationStateRef.current = false;
      violationHistoryRef.current = [];
      setAbsenceWarnings(0);
      setAbsenceModal(null);
      setPersonPresentStatus('checking');
      setPaper(shuffledPaper);
      setUnitChoiceMap({ 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A' });
      setAnswers({});
      setSecondsLeft(shuffledPaper.durationSeconds || 3 * 60 * 60);
      setEvalResult(null);
      if (!getFullscreenElement()) {
        await enterBrowserFullscreen();
      }
      setPhase('writing');
    } catch (err) {
      console.error('Failed to generate proctored mock exam:', err);
      exitBrowserFullscreen();
    } finally {
      setGeneratingPaper(false);
    }
  };

  const getPartAnswer = (partId: string): PartAnswerState => {
    return (
      answers[partId] || {
        mode: 'keyboard',
        text: '',
        imageDataUrl: null,
        mimeType: null
      }
    );
  };

  const updatePartAnswer = (partId: string, patch: Partial<PartAnswerState>) => {
    setAnswers((prev) => ({
      ...prev,
      [partId]: {
        ...(prev[partId] || { mode: 'keyboard', text: '', imageDataUrl: null, mimeType: null }),
        ...patch
      }
    }));
  };

  const handleFilePickerTrigger = () => {
    suppressBlurRef.current = true;
    window.setTimeout(() => {
      suppressBlurRef.current = false;
    }, 15000);
  };

  const attemptedStats = useMemo(() => {
    if (!paper) return { attemptedParts: 0, totalParts: 10, attemptedMarks: 0 };
    let attemptedParts = 0;
    let totalParts = 0;
    let attemptedMarks = 0;

    paper.sections.forEach((sec) => {
      const chosenKey = unitChoiceMap[sec.questionNumber] || 'A';
      const chosen = chosenKey === 'A' ? sec.choiceA : sec.choiceB;
      chosen.parts.forEach((p) => {
        totalParts += 1;
        const ans = getPartAnswer(p.partId);
        if (ans.text.trim() || ans.imageDataUrl) {
          attemptedParts += 1;
          attemptedMarks += p.marks;
        }
      });
    });

    return { attemptedParts, totalParts, attemptedMarks };
  }, [paper, unitChoiceMap, answers]);

  const handleSubmitFullPaper = async (autoSubmittedReason?: string) => {
    const cleanAutoReason = typeof autoSubmittedReason === 'string' ? autoSubmittedReason : undefined;
    const curPaper = latestPaperRef.current;
    if (!curPaper || disqualifiedLockRef.current) return;
    const statsSnapshot = computeAttemptStatsSnapshot();
    const curChoiceMap = latestUnitChoiceMapRef.current;
    const curAnswers = latestAnswersRef.current;
    const violationLogSnapshot = [...violationHistoryRef.current];

    stopProctoringMedia();
    exitBrowserFullscreen();
    setAbsenceModal(null);
    setPhase('evaluating');

    const submissions: any[] = [];
    curPaper.sections.forEach((sec) => {
      const chosenKey = curChoiceMap[sec.questionNumber] || 'A';
      const chosen = chosenKey === 'A' ? sec.choiceA : sec.choiceB;
      chosen.parts.forEach((p) => {
        const ans = curAnswers[p.partId] || { mode: 'keyboard', text: '', imageDataUrl: null, mimeType: null };
        submissions.push({
          questionNumber: sec.questionNumber,
          unitLabel: p.unitLabel || sec.unitLabel,
          unitTitle: p.unitTitle || sec.unitTitle,
          choiceLabel: `Choice ${chosenKey}`,
          partId: p.partId,
          partLabel: p.label,
          type: p.type,
          marks: p.marks,
          question: p.text,
          modelAnswer: p.modelAnswer,
          keywords: p.keywords || [],
          userAnswer: ans.text || '',
          handwrittenImageBase64: ans.imageDataUrl || undefined,
          handwrittenMimeType: ans.mimeType || undefined
        });
      });
    });

    try {
      const result = await evaluateMockPaperAgent({
        subject: curPaper.subject,
        submissions
      });
      setEvalResult({
        disqualified: false,
        autoSubmittedReason: cleanAutoReason,
        attemptedParts: statsSnapshot.attemptedParts,
        missedParts: statsSnapshot.missedParts,
        totalParts: statsSnapshot.totalParts,
        attemptedList: statsSnapshot.attemptedList,
        missedList: statsSnapshot.missedList,
        violationLog: violationLogSnapshot,
        ...result
      });
      setPhase('results');
    } catch (err) {
      console.error('Mock paper evaluation error:', err);
      const evaluatedParts = submissions.map((s) => {
        const hasAttempt = Boolean(s.userAnswer?.trim() || s.handwrittenImageBase64);
        return {
          ...s,
          obtainedMarks: hasAttempt ? 4 : 0,
          maxMarks: s.marks,
          coveredPoints: hasAttempt ? ['Attempted core concepts'] : [],
          missingPoints: hasAttempt
            ? [{ point: 'Add diagram and real-world example for full marks', potentialMarks: '+2 Marks' }]
            : [{ point: 'Unattempted question', potentialMarks: '+7 Marks' }],
          feedback: hasAttempt ? 'Awarded 4/7 marks.' : 'Not attempted (0/7 marks).'
        };
      });
      const totalObtained = evaluatedParts.reduce((sum, p) => sum + p.obtainedMarks, 0);
      const pct = Math.round((totalObtained / 70) * 100);
      setEvalResult({
        disqualified: false,
        autoSubmittedReason: cleanAutoReason,
        attemptedParts: statsSnapshot.attemptedParts,
        missedParts: statsSnapshot.missedParts,
        totalParts: statsSnapshot.totalParts,
        attemptedList: statsSnapshot.attemptedList,
        missedList: statsSnapshot.missedList,
        violationLog: violationLogSnapshot,
        subject: curPaper.subject,
        totalObtained,
        totalMax: 70,
        percentage: pct,
        grade: pct >= 75 ? 'A' : pct >= 50 ? 'B' : 'C',
        evaluatedParts
      });
      setPhase('results');
    }
  };

  submitHandlerRef.current = handleSubmitFullPaper;

  // Unit-by-unit breakdown from evaluated shuffled parts (covers Units 1-5)
  const unitScoreSummary = useMemo(() => {
    if (!evalResult || evalResult.disqualified) return [];
    const parts: any[] = evalResult.evaluatedParts || [];
    return [1, 2, 3, 4, 5].map((uNum) => {
      const label = `Unit ${uNum}`;
      const uParts = parts.filter((p) => p.unitLabel === label);
      const obtained = Number(uParts.reduce((s, p) => s + (Number(p.obtainedMarks) || 0), 0).toFixed(1));
      const maxMarks = uParts.reduce((s, p) => s + (Number(p.maxMarks) || 7), 0) || 14;
      const pct = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;
      return { unitLabel: label, count: uParts.length, obtained, maxMarks, pct };
    });
  }, [evalResult]);

  const downloadEvaluationPDF = async () => {
    if (!paper || !evalResult) return;
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const timeTaken = formatTimer((paper.durationSeconds || 10800) - secondsLeft);
      const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      // Header Banner
      doc.setFillColor(evalResult.disqualified ? 153 : 15, evalResult.disqualified ? 27 : 23, evalResult.disqualified ? 27 : 42);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(paper.universityName.toUpperCase(), 105, 9, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(evalResult.disqualified ? 254 : 96, evalResult.disqualified ? 202 : 165, evalResult.disqualified ? 202 : 250);
      doc.text(
        evalResult.disqualified
          ? `PROCTORED EXAM DISQUALIFICATION RECORD • ${paper.subject.toUpperCase()}`
          : `PROCTORED 70-MARK MOCK EXAM REPORT • ${paper.subject.toUpperCase()}`,
        105,
        16,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
      doc.text(`Course Code: ${paper.code} | Time Spent: ${timeTaken} | Date: ${todayDate}`, 105, 22, { align: 'center' });

      if (evalResult.disqualified) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(239, 68, 68);
        doc.roundedRect(10, 32, 190, 48, 3, 3, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(185, 28, 28);
        doc.text('EXAM STATUS: AUTO-DISQUALIFIED — RESULT: FAILED (0 / 70)', 16, 41);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(127, 29, 29);
        doc.text(`Auto-Disqualification Reason: ${evalResult.disqualificationReason}`, 16, 49, { maxWidth: 178 });
        doc.text(
          `Questions Attempted: ${evalResult.attemptedParts ?? 0}/${evalResult.totalParts ?? 10}  |  Questions Missed: ${evalResult.missedParts ?? 10}/${evalResult.totalParts ?? 10}  |  Total Marks: 0 / 70`,
          16,
          62
        );
        doc.text(
          `Missed Questions: ${(evalResult.missedList || []).join(', ') || 'None'}  |  Timestamp: ${evalResult.disqualifiedAt || todayDate}`,
          16,
          69,
          { maxWidth: 178 }
        );

        const dqLogs = Array.isArray(evalResult.violationLog) ? evalResult.violationLog : [];
        if (dqLogs.length > 0) {
          autoTable(doc, {
            startY: 86,
            head: [['Event #', 'Time', 'Violation Type', 'Reason']],
            body: dqLogs.map((v: any) => [`#${v.strike}`, v.time, v.label, v.reason]),
            theme: 'grid',
            headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontSize: 7.5 },
            bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59], cellPadding: 2.2 }
          });
        }
        doc.save(`${paper.subject.replace(/[^a-zA-Z0-9]/g, '_')}_DISQUALIFIED_Mock_Report.pdf`);
        return;
      }

      const attParts = evalResult.attemptedParts ?? attemptedStats.attemptedParts;
      const totParts = evalResult.totalParts ?? attemptedStats.totalParts;
      const misParts = evalResult.missedParts ?? Math.max(0, totParts - attParts);

      // Score Cards
      const metrics = [
        { label: 'TOTAL MARKS', val: `${evalResult.totalObtained}/70 (${evalResult.percentage}%)` },
        { label: 'ATTEMPTED Qs', val: `${attParts} / ${totParts} Parts` },
        { label: 'MISSED Qs', val: `${misParts} / ${totParts} Parts` },
        { label: 'SUBMISSION MODE', val: evalResult.autoSubmittedReason ? 'AUTO-SUBMITTED' : `GRADE ${evalResult.grade}` }
      ];
      let x = 10;
      metrics.forEach((m) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(x, 31, 44.5, 16, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, x + 3, 36);
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(m.val, x + 3, 43);
        x += 48.5;
      });

      let curY = 54;
      if (evalResult.autoSubmittedReason) {
        doc.setFillColor(255, 247, 237);
        doc.setDrawColor(245, 158, 11);
        doc.roundedRect(10, 50, 190, 16, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        doc.setTextColor(180, 83, 9);
        doc.text(`AUTO-SUBMISSION REASON: ${evalResult.autoSubmittedReason}`, 14, 57, { maxWidth: 182 });
        curY = 72;
      }

      const unitRows = unitScoreSummary.map((u) => [
        u.unitLabel,
        `${u.count} Parts`,
        `${u.obtained}/${u.maxMarks}`,
        `${u.pct}%`
      ]);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('1. UNIT-BY-UNIT MASTERY SUMMARY (ALL 5 UNITS COVERED)', 10, curY);

      autoTable(doc, {
        startY: curY + 3,
        head: [['Unit', 'Attempted Parts', 'Unit Marks', 'Accuracy %']],
        body: unitRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 7.5 },
        bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59], cellPadding: 2.2 }
      });

      let nextY = ((doc as any).lastAutoTable?.finalY || 110) + 8;
      const vLog = Array.isArray(evalResult.violationLog) ? evalResult.violationLog : [];
      if (vLog.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(185, 28, 28);
        doc.text('PROCTORING VIOLATION LOG', 10, nextY);
        autoTable(doc, {
          startY: nextY + 3,
          head: [['Strike #', 'Time', 'Violation', 'Details']],
          body: vLog.map((v: any) => [`#${v.strike}`, v.time, v.label, v.reason]),
          theme: 'grid',
          headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 7.5 },
          bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 }
        });
        nextY = ((doc as any).lastAutoTable?.finalY || nextY + 24) + 8;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('2. SHUFFLED QUESTION-BY-QUESTION EVALUATOR FEEDBACK', 10, nextY);

      const parts: any[] = evalResult.evaluatedParts || [];
      const qRows = parts.map((p) => [
        `${p.partId} (${p.unitLabel})`,
        p.type?.toUpperCase() || 'LONG',
        p.question,
        `${p.obtainedMarks}/${p.maxMarks || 7}`,
        p.feedback || ''
      ]);

      autoTable(doc, {
        startY: nextY + 3,
        head: [['Question / Unit', 'Type', 'Prompt', 'Marks', 'Evaluator Feedback']],
        body: qRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 7.5 },
        bodyStyles: { fontSize: 6.8, textColor: [51, 65, 85], cellPadding: 2.2 },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 64 },
          3: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
          4: { cellWidth: 64 }
        }
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `ExamArchitect Proctored 70-Mark Mock Exam • ${paper.subject} • Page ${i} of ${pageCount}`,
          105,
          292,
          { align: 'center' }
        );
      }

      doc.save(`${paper.subject.replace(/[^a-zA-Z0-9]/g, '_')}_70Mark_Proctored_Report.pdf`);
    } catch (err) {
      console.error('Mock PDF Export Error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // PHASE 1: SETUP & PROCTORING PRE-CHECK SCREEN
  if (phase === 'setup') {
    return (
      <div className="space-y-8 pb-20 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <button
              onClick={() => {
                stopProctoringMedia();
                onBack();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>AI Proctored • Fullscreen + Cam + Mic + Tab-Lock</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Proctored 3-Hour University Mock Exam Simulator
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Full 70-Mark semester examination in Fullscreen Lock mode with questions shuffled across all 5 units (including mandatory numericals), continuous webcam &amp; microphone proctoring, and instant disqualification on tab switching or exiting fullscreen.
            </p>
          </div>

          {/* Rules & Pattern Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shuffled All-Unit Paper</p>
              <p className="text-base font-black text-slate-900">70 Marks • Units 1–5 Mixed</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Every unit covered in shuffled order with Theory + Numericals &amp; OR choices
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Camera AI Proctoring</p>
              <p className="text-base font-black text-blue-700">3 Warnings → Auto-Submit</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Privacy shutter closed, phones/books/2nd person, or leaving camera: 3 alerts then auto-submit on 4th
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Zero-Tolerance Rule</p>
              <p className="text-base font-black text-rose-800">Tab / Esc = Instant FAIL</p>
              <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                Switching tabs, minimizing, or exiting fullscreen auto-disqualifies (0/70)
              </p>
            </div>
          </div>

          {/* Proctoring Camera & Mic Pre-Check Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div
                className={cn(
                  'w-36 h-24 rounded-xl bg-slate-900 border-2 overflow-hidden relative flex items-center justify-center shrink-0',
                  setupCameraAlert && setupCameraAlert.status !== 'ok' && setupCameraAlert.status !== 'checking'
                    ? 'border-rose-500'
                    : 'border-slate-300'
                )}
              >
                {camActive ? (
                  <video ref={setupVideoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
                ) : (
                  <Video className="w-7 h-7 text-slate-500" />
                )}
                <span
                  className={cn(
                    'absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase',
                    !camActive
                      ? 'bg-slate-800 text-slate-300'
                      : setupCameraAlert && setupCameraAlert.status !== 'ok' && setupCameraAlert.status !== 'checking'
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                  )}
                >
                  {!camActive
                    ? 'CAM OFF'
                    : setupCameraAlert && setupCameraAlert.status !== 'ok' && setupCameraAlert.status !== 'checking'
                      ? setupCameraAlert.label
                      : 'CAM LIVE'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {proctorStatus === 'ready' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Camera className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-xs font-black text-slate-900">
                    {proctorStatus === 'ready'
                      ? 'Camera & Microphone Verified — Ready to Enter Exam'
                      : 'Verify Camera & Microphone Before Starting'}
                  </span>
                </div>

                {/* Live Pre-Check AI Detection Status (Object / Other Person / Not on Camera / Shutter) */}
                {camActive && setupCameraAlert && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black border',
                      setupCameraAlert.status === 'ok'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                    )}
                  >
                    {setupCameraAlert.status === 'ok' ? (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>
                      {setupCameraAlert.status === 'ok'
                        ? setupCameraAlert.label
                        : `WARNING — ${setupCameraAlert.label}: ${setupCameraAlert.reason}`}
                    </span>
                  </div>
                )}

                {/* Live Mic Level Meter */}
                <div className="flex items-center gap-2">
                  <Mic className={cn('w-3.5 h-3.5', micActive ? 'text-emerald-600' : 'text-slate-400')} />
                  <div className="flex items-center gap-1">
                    {[15, 35, 55, 75, 90].map((threshold, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-2.5 h-3 rounded-xs transition-colors',
                          micActive && micLevel >= threshold ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {micActive ? 'Mic Listening' : 'Mic Off'}
                  </span>
                </div>

                {proctorError && (
                  <p className="text-xs font-bold text-rose-600 leading-snug max-w-md">{proctorError}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={proctorStatus === 'checking'}
              onClick={enableProctorDevices}
              className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
            >
              {proctorStatus === 'checking'
                ? 'Requesting Access...'
                : proctorStatus === 'ready'
                  ? 'Re-Verify Cam & Mic'
                  : 'Enable Camera & Mic'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 pt-2 border-t border-slate-100">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Select Subject Paper
              </label>
              <select
                value={selectedSubjectName}
                onChange={(e) => setSelectedSubjectName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {subjects.map((s: any, idx: number) => (
                  <option key={`${s.code || 'sub'}-${s.name || 'item'}-${idx}`} value={s.name}>
                    {s.code ? `[${s.code}] ` : ''}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={generatingPaper || !selectedSubject?.name}
              onClick={startProctoredMockExam}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {generatingPaper ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Shuffling Units &amp; Starting Exam...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Proctored 3-Hour Exam</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 3: EVALUATING SCREEN
  if (phase === 'evaluating') {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <h3 className="text-lg font-black text-slate-900">Evaluating Your 70-Mark Proctored Paper...</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Grading typed responses, numericals &amp; handwritten photos across all 5 units
        </p>
      </div>
    );
  }

  // PHASE 4: RESULTS SCREEN (HANDLES BOTH DISQUALIFIED/FAILED AND PASSED/AUTO-SUBMITTED)
  if (phase === 'results' && paper && evalResult) {
    if (evalResult.disqualified) {
      const dqLogs: any[] = Array.isArray(evalResult.violationLog) ? evalResult.violationLog : [];
      return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
          <div className="bg-rose-950 text-white rounded-3xl border-2 border-rose-500 p-8 sm:p-10 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-rose-400" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400 text-[11px] font-black uppercase tracking-widest text-rose-200">
                Auto-Disqualified • Attempt Terminated
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white">
                DISQUALIFIED — RESULT: FAILED (0 / 70)
              </h2>
              <p className="text-sm text-rose-200 font-medium max-w-xl mx-auto">
                <strong className="text-white">Disqualification Reason:</strong> {evalResult.disqualificationReason}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left bg-black/25 p-5 rounded-2xl border border-rose-800">
              <div>
                <p className="text-[10px] font-black uppercase text-rose-300">Total Marks</p>
                <p className="text-lg font-black font-mono text-rose-400 mt-0.5">0 / 70 (FAILED)</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-rose-300">Questions Attempted</p>
                <p className="text-lg font-black font-mono text-white mt-0.5">
                  {evalResult.attemptedParts ?? 0} / {evalResult.totalParts ?? 10}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-rose-300">Questions Missed</p>
                <p className="text-lg font-black font-mono text-amber-300 mt-0.5">
                  {evalResult.missedParts ?? 10} / {evalResult.totalParts ?? 10}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-rose-300">Disqualified At</p>
                <p className="text-sm font-bold text-white mt-0.5">{evalResult.disqualifiedAt}</p>
              </div>
            </div>

            {Array.isArray(evalResult.missedList) && evalResult.missedList.length > 0 && (
              <div className="text-left bg-black/20 px-4 py-3 rounded-xl border border-rose-800/70 text-xs text-rose-200">
                <span className="font-black uppercase text-rose-300 mr-2">Missed Questions:</span>
                <span>{evalResult.missedList.join(', ')}</span>
              </div>
            )}

            {dqLogs.length > 0 && (
              <div className="text-left bg-black/25 rounded-2xl border border-rose-800/80 p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">
                  Proctoring Violation &amp; Disqualification Audit Log
                </p>
                <div className="space-y-1.5">
                  {dqLogs.map((v, i) => (
                    <div key={i} className="text-xs text-rose-100 flex flex-wrap items-center justify-between gap-2 bg-rose-900/40 px-3 py-2 rounded-lg">
                      <span>
                        <strong className="text-rose-300">#{v.strike} [{v.label}]:</strong> {v.reason}
                      </span>
                      <span className="font-mono text-[11px] text-rose-300">{v.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={downloadEvaluationPDF}
                disabled={downloadingPdf}
                className="px-5 py-3 bg-white text-rose-950 hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Disqualification Record PDF</span>
              </button>
              <button
                onClick={() => setPhase('setup')}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Proctored Exam</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    const parts: any[] = evalResult.evaluatedParts || [];
    const totalPartsCount = evalResult.totalParts ?? (parts.length || 10);
    const attemptedPartsCount = evalResult.attemptedParts ?? attemptedStats.attemptedParts;
    const missedPartsCount = evalResult.missedParts ?? Math.max(0, totalPartsCount - attemptedPartsCount);
    const missedQuestionIds: string[] =
      evalResult.missedList ||
      parts.filter((p) => !p.userAnswer?.trim() && !p.handwrittenImageBase64).map((p) => p.partId);
    const violationLog: any[] = Array.isArray(evalResult.violationLog) ? evalResult.violationLog : [];

    return (
      <div className="space-y-8 pb-20 max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            {evalResult.autoSubmittedReason ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-300">
                Auto-Submitted • Proctoring Violation Limit Reached (4th Attempt)
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Proctored Exam Complete • Clean Session Verified
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {paper.subject} — 70-Mark Paper Result
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {evalResult.autoSubmittedReason
                ? `Auto-Submission Reason: ${evalResult.autoSubmittedReason}`
                : `Time Taken: ${formatTimer((paper.durationSeconds || 10800) - secondsLeft)} • Shuffled All-Unit Paper`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadEvaluationPDF}
              disabled={downloadingPdf}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{downloadingPdf ? 'Exporting PDF...' : 'Download Evaluation PDF'}</span>
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Mock Exam</span>
            </button>
          </div>
        </div>

        {/* Auto-Submission Reason & Violation Log Banner (if Auto-Submitted or Warnings Recorded) */}
        {(evalResult.autoSubmittedReason || violationLog.length > 0) && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-amber-950">
                  {evalResult.autoSubmittedReason ? 'Auto-Submitted Test Report' : 'Proctoring Warnings Recorded'}
                </h4>
                {evalResult.autoSubmittedReason && (
                  <p className="text-xs font-bold text-rose-700 mt-1">
                    Reason for Auto-Submit: {evalResult.autoSubmittedReason}
                  </p>
                )}
              </div>
            </div>
            {violationLog.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {violationLog.map((v, i) => (
                  <div
                    key={i}
                    className="bg-white/90 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-black text-rose-700">
                        Strike #{v.strike} ({v.label}):
                      </span>{' '}
                      <span className="text-slate-700">{v.reason}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">{v.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Score Summary Cards: Total Marks, Percentage/Grade, Attempted Qs, Missed Qs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Total Marks Scored</span>
            <div className="text-4xl font-black font-mono mt-2">
              {evalResult.totalObtained}
              <span className="text-xl text-slate-400">/70</span>
            </div>
            <p className="text-[11px] font-bold text-slate-300 mt-1">
              {evalResult.percentage}% • Grade {evalResult.grade}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Questions Attempted</span>
            <div className="text-4xl font-black font-mono text-emerald-600 mt-2">
              {attemptedPartsCount}
              <span className="text-xl text-slate-400">/{totalPartsCount}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Answered &amp; Evaluated</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Questions Missed</span>
            <div className="text-4xl font-black font-mono text-rose-600 mt-2">
              {missedPartsCount}
              <span className="text-xl text-slate-400">/{totalPartsCount}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">
              {missedQuestionIds.length > 0 ? missedQuestionIds.join(', ') : 'None missed!'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Awarded Grade</span>
            <div className="text-4xl font-black text-blue-700 mt-2 flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              <span>{evalResult.grade}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {evalResult.autoSubmittedReason ? 'Auto-Submitted' : 'Completed'}
            </p>
          </div>
        </div>

        {/* Unit-by-Unit Marks Cards (Aggregated across shuffled questions) */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {unitScoreSummary.map((u) => (
            <div key={u.unitLabel} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-600">{u.unitLabel}</span>
                <span className="text-[10px] font-bold text-slate-400">{u.count} Parts</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {u.obtained}
                <span className="text-sm text-slate-400">/{u.maxMarks}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    u.pct >= 60 ? 'bg-emerald-500' : u.pct >= 35 ? 'bg-blue-600' : 'bg-rose-500'
                  )}
                  style={{ width: `${Math.min(100, u.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Question-by-Question Evaluation Details */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
              Shuffled Question-by-Question Evaluator Breakdown
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {parts.map((p, idx) => (
              <div key={idx} className="p-6 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                        {p.partId} • {p.unitLabel}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase px-2 py-0.5 rounded',
                          p.type === 'numerical' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {p.type}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{p.question}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black font-mono text-blue-700">{p.obtainedMarks}</span>
                    <span className="text-sm font-bold text-slate-400 font-mono">/{p.maxMarks || 7}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {p.feedback}
                </p>
                {Array.isArray(p.missingPoints) && p.missingPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.missingPoints.map((mp: any, i: number) => (
                      <span
                        key={i}
                        className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg font-medium"
                      >
                        {mp.potentialMarks || '+1 Mark'}: {mp.point}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PHASE 2: ACTIVE PROCTORED 3-HOUR EXAM WRITING HALL (ALL QUESTIONS IN ONE SCROLL)
  if (!paper) return null;
  const isLowTime = secondsLeft < 15 * 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
      {/* Camera Proctoring Violation Warning Popup Modal (Warnings 1, 2, 3 across Shutter/Other Person/Object/Absence) */}
      {absenceModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto">
              {absenceModal.violationType === 'shutter_blocked' ? (
                <ShieldAlert className="w-8 h-8 text-rose-600" />
              ) : absenceModal.violationType === 'object_detected' ? (
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              ) : (
                <UserX className="w-8 h-8 text-rose-600" />
              )}
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest">
                Proctoring Warning {absenceModal.count} of 3
              </span>
              <h3 className="text-xl font-black text-rose-700">
                {absenceModal.count === 3
                  ? `FINAL WARNING (3/3): ${absenceModal.title}`
                  : absenceModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {absenceModal.reason}{' '}
                {absenceModal.count === 3
                  ? 'On the 4th violation attempt, your exam will be AUTO-SUBMITTED immediately.'
                  : `You have ${3 - absenceModal.count} warning${3 - absenceModal.count === 1 ? '' : 's'} left before your exam auto-submits on the 4th attempt.`}
              </p>
            </div>

            {/* Strike Indicator 1 -> 2 -> 3 -> Auto-Submit */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    'py-2 px-1 rounded-xl border text-[10px] font-black uppercase',
                    step <= absenceModal.count
                      ? 'bg-rose-600 text-white border-rose-600'
                      : step === 4
                        ? 'bg-slate-100 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                  )}
                >
                  {step === 4 ? '4: Submit' : `Warn ${step}`}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAbsenceModal(null)}
              className={cn(
                'w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-colors',
                absenceModal.personReturned
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              )}
            >
              {absenceModal.personReturned
                ? 'Camera Cleared — Resume Exam'
                : 'I Understand — Fix Camera & Resume'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 pb-20 max-w-6xl mx-auto">
        {/* Top Sticky Proctored Exam Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg sticky top-2 z-30">
          <div className="flex items-center gap-3">
            {/* Live Webcam Proctoring Monitor */}
            <div
              className={cn(
                'w-20 h-14 rounded-xl bg-black border-2 overflow-hidden relative shrink-0',
                personPresentStatus === 'violation' ? 'border-rose-500' : 'border-emerald-500/80'
              )}
            >
              <video ref={proctorVideoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
              <span
                className={cn(
                  'absolute top-1 left-1 w-2 h-2 rounded-full animate-pulse',
                  personPresentStatus === 'violation' ? 'bg-rose-500' : 'bg-emerald-400'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-400 shrink-0" />
                <h2 className="text-sm sm:text-base font-black leading-tight">{paper.subject} (70 Marks)</h2>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-300 font-medium mt-1 flex-wrap">
                <span>
                  Attempted: {attemptedStats.attemptedParts}/{attemptedStats.totalParts} parts ({attemptedStats.attemptedMarks}/70 marks)
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <Mic className="w-3 h-3" />
                  <span>MIC LIVE</span>
                  <span className="inline-flex items-center gap-0.5 ml-0.5">
                    {[20, 45, 70].map((t, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-1 h-2.5 rounded-xs',
                          micLevel >= t ? 'bg-emerald-400' : 'bg-slate-700'
                        )}
                      />
                    ))}
                  </span>
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-bold uppercase',
                    personPresentStatus === 'violation' ? 'text-rose-400' : 'text-emerald-400'
                  )}
                >
                  {personPresentStatus === 'violation' ? (
                    <UserX className="w-3 h-3" />
                  ) : (
                    <UserCheck className="w-3 h-3" />
                  )}
                  <span>
                    {personPresentStatus === 'violation'
                      ? `${activeCamViolationLabel || 'CAM ALERT'} (${absenceWarnings}/3 WARN)`
                      : absenceWarnings > 0
                        ? `SINGLE PERSON OK (${absenceWarnings}/3 WARN)`
                        : 'SINGLE PERSON OK'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isNativeFullscreen ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-[10px] font-black uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fullscreen Locked</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={enterBrowserFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Enter Fullscreen</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-[10px] font-black uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Tab / Esc = Disqualified</span>
            </div>

            {/* Live 3-Hour Timer */}
            <div
              className={cn(
                'px-3.5 py-2 rounded-xl border flex items-center gap-2 font-mono font-black text-sm',
                isLowTime
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                  : 'bg-slate-800 border-slate-700 text-emerald-300'
              )}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleSubmitFullPaper()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
            >
              Submit Paper &amp; Grade
            </button>
          </div>
        </div>

        {/* Single Top Proctoring Rules Reminder */}
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Proctoring active (Fullscreen + Camera AI + Mic): keep camera shutter open &amp; unobstructed, stay alone on camera (no phone, book, notes, or 2nd person), and remain visible — 3 alerts then auto-submit on 4th violation. Tab-switch / Esc triggers instant disqualification.
          </span>
        </div>

        {/* All 5 Shuffled Questions Displayed Together in One Scroll */}
        <div className="space-y-6">
          {paper.sections.map((sec) => {
            const chosenKey = unitChoiceMap[sec.questionNumber] || 'A';
            const chosenChoice = chosenKey === 'A' ? sec.choiceA : sec.choiceB;

            return (
              <div
                key={sec.questionNumber}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                      Question {sec.questionNumber} of {paper.sections.length} • Shuffled Cross-Unit Section (14 Marks)
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">{sec.unitTitle}</h3>
                  </div>

                  {/* Internal OR Choice Selector */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
                    <button
                      type="button"
                      onClick={() => setUnitChoiceMap((prev) => ({ ...prev, [sec.questionNumber]: 'A' }))}
                      className={cn(
                        'px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all',
                        chosenKey === 'A' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      Attempt Choice A
                    </button>
                    <span className="text-[10px] font-black text-slate-400 px-1">OR</span>
                    <button
                      type="button"
                      onClick={() => setUnitChoiceMap((prev) => ({ ...prev, [sec.questionNumber]: 'B' }))}
                      className={cn(
                        'px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all',
                        chosenKey === 'B' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      Attempt Choice B
                    </button>
                  </div>
                </div>

                {/* Sub-Questions (a) and (b) */}
                <div className="space-y-6">
                  {chosenChoice.parts.map((part) => {
                    const ans = getPartAnswer(part.partId);
                    return (
                      <div key={part.partId} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black font-mono">
                                Q{sec.questionNumber}{chosenKey} {part.label}
                              </span>
                              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {part.marks} Marks • {part.unitLabel || sec.unitLabel}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-black uppercase px-2 py-0.5 rounded border',
                                  part.type === 'numerical'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                )}
                              >
                                {part.type === 'numerical' ? 'Numerical Problem' : 'Long Theory'}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed pt-1">
                              {part.text}
                            </p>
                          </div>
                        </div>

                        {/* Mode Switcher: Keyboard vs Handwritten Photo */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="inline-flex items-center p-0.5 rounded-xl bg-white border border-slate-200">
                            <button
                              type="button"
                              onClick={() => updatePartAnswer(part.partId, { mode: 'keyboard' })}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer',
                                ans.mode === 'keyboard' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                              )}
                            >
                              <Keyboard className="w-3 h-3" />
                              <span>Keyboard</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePartAnswer(part.partId, { mode: 'photo' })}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer',
                                ans.mode === 'photo' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                              )}
                            >
                              <Camera className="w-3 h-3" />
                              <span>Handwritten Photo</span>
                            </button>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {ans.imageDataUrl
                              ? 'Photo Attached'
                              : `${ans.text.trim() ? ans.text.trim().split(/\s+/).length : 0} words`}
                          </span>
                        </div>

                        {ans.mode === 'photo' && (
                          <HandwrittenInputPanel
                            compact
                            imageDataUrl={ans.imageDataUrl}
                            onFilePickerTrigger={handleFilePickerTrigger}
                            onImageChange={(url, mime) =>
                              updatePartAnswer(part.partId, { imageDataUrl: url, mimeType: mime })
                            }
                          />
                        )}

                        <textarea
                          value={ans.text}
                          onPaste={(e) => e.preventDefault()}
                          onChange={(e) => updatePartAnswer(part.partId, { text: e.target.value })}
                          placeholder={
                            part.type === 'numerical'
                              ? 'Write Given Data, Governing Formula, Step-by-Step Calculation, and Boxed Final Value with Units...'
                              : ans.mode === 'photo'
                                ? 'Optional typed notes or summary alongside your handwritten photo...'
                                : 'Type your 7-mark exam response here (Definition, Steps/Architecture, Comparison, Example)...'
                          }
                          className={cn(
                            'w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed',
                            ans.mode === 'photo' ? 'h-20' : 'h-40'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom End-of-Paper Submission Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="text-sm font-black text-slate-900">End of 70-Mark Question Paper</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Attempted {attemptedStats.attemptedParts} of {attemptedStats.totalParts} parts ({attemptedStats.attemptedMarks}/70 marks). Review your answers above before submitting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSubmitFullPaper()}
            className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <span>Finish &amp; Evaluate 70-Mark Paper</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
