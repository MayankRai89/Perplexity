import { useState, useEffect, useRef } from "react";

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => {
    const saved = localStorage.getItem("voice_auto_speak");
    return saved === "true";
  });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("voice_auto_speak", autoSpeak);
  }, [autoSpeak]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = (onResult) => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in this browser. Try Chrome or Edge!",
      );
      return;
    }

    recognitionRef.current.onresult = (e) => {
      const resultText = e.results[0][0].transcript;
      if (onResult) onResult(resultText);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text, messageId = null) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (speakingMessageId === messageId && messageId !== null) {
      setSpeakingMessageId(null);
      return;
    }

    const cleanText = text
      .replace(/[*#`_\-]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.onstart = () => {
      if (messageId !== null) setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  };

  return {
    isListening,
    autoSpeak,
    setAutoSpeak,
    speakingMessageId,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    hasSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
};
