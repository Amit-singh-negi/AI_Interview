import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsArrowRight, BsCheckCircle } from "react-icons/bs";

import maleVideo from "../assets/videos/male-ai.mp4";
import femaleVideo from "../assets/videos/female-ai.mp4";

import { ServerURL } from "../App";
import Timer from "./Timer";

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions, userName } = interviewData;

  // ---------------------- states ----------------------

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  );

  // Voice
  const [voiceGender, setVoiceGender] = useState("female");
  const [selectedVoice, setSelectedVoice] = useState(null);

  const [subtitle, setSubtitle] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Refs
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);

  // ---------------------- current question ----------------------

  const currentQuestion = questions[currentIndex];

  const isLastQuestion =
    currentIndex === questions.length - 1;

  // ---------------------- video based on gender ----------------------

  const videoSource =
    voiceGender === "male"
      ? maleVideo
      : femaleVideo;

  // ============================================================
  // VOICE SELECTION
  // ============================================================

  const findVoice = (voices, gender) => {
    if (gender === "female") {
      return voices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("zira") ||
          name.includes("samantha") ||
          name.includes("susan") ||
          name.includes("karen") ||
          name.includes("female") ||
          name.includes("aria") ||
          name.includes("jenny") ||
          name.includes("hazel") ||
          name.includes("google us english")
        );
      });
    }

    return voices.find((voice) => {
      const name = voice.name.toLowerCase();

      return (
        name.includes("david") ||
        name.includes("mark") ||
        name.includes("male") ||
        name.includes("alex") ||
        name.includes("daniel") ||
        name.includes("guy") ||
        name.includes("ryan") ||
        name.includes("george")
      );
    });
  };

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) return;

    const voice = findVoice(voices, voiceGender);

    if (voice) {
      setSelectedVoice(voice);
    } else {
      // Fallback if matching voice is not available
      setSelectedVoice(voices[0]);
    }
  };

  useEffect(() => {
    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceGender]);

  // ============================================================
  // CHANGE VOICE
  // ============================================================

  const handleVoiceChange = (gender) => {
    // Stop current speech
    window.speechSynthesis.cancel();

    // Pause current avatar
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    setIsAIPlaying(false);

    // Change gender
    setVoiceGender(gender);
    setSelectedVoice(null);
  };

  // ============================================================
  // SPEECH RECOGNITION
  // ============================================================

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn(
        "Speech Recognition is not supported in this browser."
      );
      return;
    }

    const recognition =
      new window.webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript =
        event.results[
          event.results.length - 1
        ][0].transcript;

      setAnswer((prev) =>
        prev
          ? prev + " " + transcript
          : transcript
      );
    };

    recognition.onerror = (event) => {
      console.log(
        "Speech recognition error:",
        event.error
      );
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
        recognition.abort();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  // ============================================================
  // MICROPHONE
  // ============================================================

  const startMic = () => {
    if (
      recognitionRef.current &&
      !isAIPlaying
    ) {
      try {
        recognitionRef.current.start();
      } catch {
        // already running
      }
    }
  };

  const stopMic = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
    } else {
      startMic();
    }

    setIsMicOn((prev) => !prev);
  };

  // ============================================================
  // SPEAK TEXT
  // ============================================================

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (
        !window.speechSynthesis ||
        !selectedVoice
      ) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const humanText = text
        .replace(/,/g, ", ...")
        .replace(/\./g, ". ...");

      const utterance =
        new SpeechSynthesisUtterance(
          humanText
        );

      utterance.voice = selectedVoice;

      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsAIPlaying(true);

        stopMic();

        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      };

      utterance.onend = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);

        if (isMicOn) {
          startMic();
        }

        setTimeout(() => {
          setSubtitle("");
          resolve();
        }, 300);
      };

      utterance.onerror = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);
        resolve();
      };

      setSubtitle(text);

      window.speechSynthesis.speak(
        utterance
      );
    });
  };

  // ============================================================
  // INTRO + QUESTION NARRATION
  // ============================================================

  useEffect(() => {
    if (!selectedVoice) return;

    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
        );

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        );

        setIsIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );

        if (isLastQuestion) {
          await speakText(
            "Alright, this one might be a bit more challenging."
          );
        }

        await speakText(
          currentQuestion.question
        );

        if (isMicOn) {
          startMic();
        }
      }
    };

    runIntro();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedVoice,
    isIntroPhase,
    currentIndex,
  ]);

  // ============================================================
  // COUNTDOWN TIMER
  // ============================================================

  useEffect(() => {
    if (
      isIntroPhase ||
      !currentQuestion
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isIntroPhase,
    currentIndex,
    currentQuestion,
  ]);

  // Reset timer when question changes

  useEffect(() => {
    if (
      !isIntroPhase &&
      currentQuestion
    ) {
      setTimeLeft(
        currentQuestion.timeLimit || 60
      );
    }
  }, [
    isIntroPhase,
    currentIndex,
    currentQuestion,
  ]);

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================

  const submitAnswer = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await axios.post(
        ServerURL +
          "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken:
            (currentQuestion?.timeLimit ||
              0) - timeLeft,
        },
        {
          withCredentials: true,
        }
      );

      setFeedback(result.data.feedback);

      await speakText(
        result.data.feedback
      );
    } catch (error) {
      console.log(error);

      setSubmitError(
        error.response?.data?.message ||
          "Failed to submit your answer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // AUTO SUBMIT
  // ============================================================

  useEffect(() => {
    if (
      isIntroPhase ||
      !currentQuestion
    ) {
      return;
    }

    if (
      timeLeft === 0 &&
      !isSubmitting &&
      !feedback
    ) {
      submitAnswer();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ============================================================
  // FINISH INTERVIEW
  // ============================================================

  const finishInterview = async () => {
    stopMic();

    setIsMicOn(false);

    try {
      const result = await axios.post(
        ServerURL +
          "/api/interview/finish",
        {
          interviewId,
        },
        {
          withCredentials: true,
        }
      );

      onFinish?.(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  const handleNext = async () => {
    setAnswer("");
    setFeedback("");

    if (isLastQuestion) {
      finishInterview();
      return;
    }

    await speakText(
      "Alright, let's move to the next question."
    );

    setCurrentIndex(
      (prev) => prev + 1
    );

    setTimeout(() => {
      if (isMicOn) {
        startMic();
      }
    }, 500);
  };

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">

      <div className="w-full max-w-[1400px] min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* ================= VIDEO SECTION ================= */}

        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">

          {/* Voice Selector */}

          <div className="w-full max-w-md">

            <p className="text-sm font-semibold text-gray-600 mb-3 text-center">
              Choose AI Interviewer
            </p>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  handleVoiceChange(
                    "female"
                  )
                }
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  voiceGender ===
                  "female"
                    ? "bg-pink-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                👩 Female
              </button>

              <button
                type="button"
                onClick={() =>
                  handleVoiceChange(
                    "male"
                  )
                }
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  voiceGender ===
                  "male"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                👨 Male
              </button>

            </div>

          </div>

          {/* Video */}

          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">

            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />

          </div>

          {/* Subtitle */}

          {subtitle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">

              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">
                {subtitle}
              </p>

            </div>
          )}

          {/* Timer Area */}

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">

            <div className="flex justify-center items-center">

              <span className="text-sm text-gray-500">
                Interview status
              </span>

              {isAIPlaying && (
                <span className="text-sm font-semibold text-teal-600 ml-2">
                  AI Speaking
                </span>
              )}

            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex justify-center">

              <Timer
                timeLeft={timeLeft}
                totalTime={
                  currentQuestion?.timeLimit
                }
              />

            </div>

            <div className="h-px bg-gray-200" />

            <div className="grid grid-cols-2 gap-6 text-center">

              <div>
                <span className="block text-2xl font-bold text-teal-600">
                  {currentIndex + 1}
                </span>

                <span className="text-xs text-gray-400">
                  Current Question
                </span>
              </div>

              <div>
                <span className="block text-2xl font-bold text-teal-600">
                  {questions.length}
                </span>

                <span className="text-xs text-gray-400">
                  Total Questions
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* ================= TEXT SECTION ================= */}

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">

          <h2 className="text-xl sm:text-2xl font-bold text-teal-600 mb-6">
            AI Smart Interview
          </h2>

          {!isIntroPhase && (
            <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">

              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Question{" "}
                {currentIndex + 1}{" "}
                of {questions.length}
              </p>

              <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {currentQuestion?.question}
              </div>

            </div>
          )}

          {/* Answer */}

          <textarea
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            value={answer}
            placeholder="Type your answer here..."
            className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-teal-500 transition text-gray-800"
          />

          {/* Submit */}

          {!feedback ? (
            <div className="mt-6">

              {submitError && (
                <p className="text-sm text-red-600 text-center mb-3">
                  {submitError}
                </p>
              )}

              <div className="flex items-center gap-4">

                {/* Mic */}

                <motion.button
                  onClick={toggleMic}
                  whileTap={{
                    scale: 0.9,
                  }}
                  className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-black text-white shadow-lg"
                >
                  {isMicOn ? (
                    <FaMicrophone
                      size={20}
                    />
                  ) : (
                    <FaMicrophoneSlash
                      size={20}
                    />
                  )}
                </motion.button>

                {/* Submit */}

                <motion.button
                  onClick={
                    submitAnswer
                  }
                  disabled={
                    isSubmitting
                  }
                  whileTap={{
                    scale: 0.95,
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:bg-gray-500"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : "Submit Answer"}
                </motion.button>

              </div>

            </div>
          ) : (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="mt-6 bg-teal-50 border border-teal-200 p-5 rounded-2xl shadow-sm"
            >

              <p className="text-teal-700 font-medium mb-4">
                {feedback}
              </p>

              <button
                onClick={
                  handleNext
                }
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1"
              >
                {isLastQuestion ? (
                  <>
                    Finish Interview
                    <BsCheckCircle
                      size={18}
                    />
                  </>
                ) : (
                  <>
                    Next Question
                    <BsArrowRight
                      size={18}
                    />
                  </>
                )}
              </button>

            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Step2Interview;