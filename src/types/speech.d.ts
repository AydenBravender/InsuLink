// src/types/speech.d.ts
declare interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
