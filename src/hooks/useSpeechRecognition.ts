import { useEffect, useRef, useState, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  segments: string[];
  error: string | null;
  isSupported: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [segments, setSegments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const segmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      setIsSupported(false);
      return;
    }

    console.log('Initializing speech recognition...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setError(null);
    };

    recognitionRef.current.onresult = (event: any) => {
      console.log('Speech recognition result received', event);
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcriptPart + ' ';
        } else {
          interimText += transcriptPart;
        }
      }

      if (finalText) {
        console.log('Final transcript:', finalText);
        setTranscript(prev => prev + finalText);
        
        // Add to segments for analysis
        setSegments(prev => {
          const newSegments = [...prev, finalText.trim()];
          // Keep only last 10 segments for analysis
          return newSegments.slice(-10);
        });

        // Reset segment timeout
        if (segmentTimeoutRef.current) {
          clearTimeout(segmentTimeoutRef.current);
        }
      }

      setInterimTranscript(interimText);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
        // Don't stop on no-speech, just continue listening
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
      } else if (event.error === 'aborted') {
        console.log('Speech recognition aborted');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      // Only set listening to false for critical errors
      if (event.error === 'not-allowed' || event.error === 'network') {
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended, isListening:', isListening);
      // Don't automatically restart here - let the component control it
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Error stopping recognition:', e);
        }
      }
      if (segmentTimeoutRef.current) {
        clearTimeout(segmentTimeoutRef.current);
      }
    };
  }, []); // Remove isListening from dependencies

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    console.log('Starting listening...');
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      if (recognitionRef.current && !isListening) {
        setIsListening(true);
        setError(null);
        recognitionRef.current.start();
        console.log('Recognition started successfully');
      }
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Failed to start recording. Please check your microphone.');
      }
      setIsListening(false);
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
        console.log('Recognition stopped');
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setSegments([]);
    setError(null);
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    segments,
    error,
    isSupported
  };
};
