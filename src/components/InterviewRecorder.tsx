import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Square, Play, Pause, Trash2, Download, 
  Save, Volume2, Timer, AlertCircle, CheckCircle2,
  Video, VideoOff, RefreshCw, Radio
} from 'lucide-react';
import { Button, Card, Badge } from './UI';
import { useLanguage } from '../contexts/LanguageContext';

export const InterviewRecorder: React.FC<{ onSave?: (blob: Blob) => void }> = ({ onSave }) => {
  const { isBn } = useLanguage();
  
  // MediaRecorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // পরিমাপক সময় শুরু ও শেষ
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      setAudioUrl(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(isBn ? "মাইক্রোফোন অ্যাক্সেস করতে সমস্যা হচ্ছে।" : "Error accessing microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setRecordedBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `interview-answer-${Date.now()}.webm`;
    link.click();
  };

  return (
    <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <Mic className="w-32 h-32" />
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isBn ? 'ইন্টারভিউ এনসার রেকর্ডার' : 'Interview Answer Recorder'}
            </h3>
          </div>
          {isRecording && (
             <Badge variant="danger" className="animate-pulse">
                REC {formatTime(recordingTime)}
             </Badge>
          )}
        </div>

        {!recordedBlob ? (
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500/10 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/10'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                 <Mic className="w-8 h-8" />
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-bold text-slate-800 dark:text-white">
                {isRecording 
                  ? (isBn ? 'আপনার উত্তর রেকর্ড হচ্ছে...' : 'Recording your answer...') 
                  : (isBn ? 'রেকর্ড শুরু করতে ক্লিক করুন' : 'Click to start recording')}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {isBn 
                  ? 'আপনার মাইক্রোফোন ব্যবহার করে প্রশ্নের উত্তর দিন এবং নিজের কন্ঠস্বর শুনুন।' 
                  : 'Use your microphone to answer questions and listen to your performance.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button variant="primary" className="rounded-2xl px-8" onClick={startRecording}>
                   <Mic className="w-4 h-4 mr-2" /> {isBn ? 'রেকর্ড শুরু' : 'Start Recording'}
                </Button>
              ) : (
                <Button variant="danger" className="rounded-2xl px-8" onClick={stopRecording}>
                   <Square className="w-4 h-4 mr-2" /> {isBn ? 'রেকর্ড বন্ধ' : 'Stop Recording'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recorded Audio</span>
                <span className="text-xs font-mono font-bold text-emerald-500">{formatTime(recordingTime)}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePlayPause}
                  className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-full relative overflow-hidden">
                   <motion.div 
                      className="absolute inset-y-0 left-0 bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={isPlaying ? { width: '100%' } : { width: '0%' }}
                      transition={isPlaying ? { duration: recordingTime, ease: 'linear' } : { duration: 0.2 }}
                   />
                </div>
              </div>

              <audio 
                ref={audioPlayerRef} 
                src={audioUrl || ''} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={handleReset}>
                  <Trash2 className="w-3.5 h-3.5 mr-2 text-red-500" /> {isBn ? 'মুছে ফেলুন' : 'Delete'}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={handleDownload}>
                  <Download className="w-3.5 h-3.5 mr-2 text-blue-500" /> {isBn ? 'ডাউনলোড' : 'Download'}
                </Button>
                <Button variant="primary" size="sm" className="rounded-xl" onClick={() => onSave?.(recordedBlob!)}>
                  <Save className="w-3.5 h-3.5 mr-2" /> {isBn ? 'সেভ করুন' : 'Save Result'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex items-start gap-3">
           <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
           <p className="text-[10px] text-slate-500 leading-relaxed italic">
              {isBn 
                ? 'আপনার অডিও রেকর্ডারটি পুরোপুরি লোকালভাবে কাজ করে, গোপনীয়তা বজায় রাখা হয়েছে।' 
                : 'Your audio recording works locally in your browser for privacy and security.'}
           </p>
        </div>
      </div>
    </Card>
  );
};
