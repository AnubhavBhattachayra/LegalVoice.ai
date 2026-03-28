import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VoiceProcessor({ onTranscript }: { onTranscript?: (text: string, lang: string) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('');
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isRecording]);

    const startRecording = async () => {
        setError('');
        setTranscript('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = processAudio;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Microphone access denied or unavailable. Please check your browser permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
    };

    const processAudio = async () => {
        setIsProcessing(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        // In a real implementation you would allow the user to select their language,
        // or let Whisper auto-detect it.

        try {
            // Assuming a backend route /api/voice/transcribe (proxying to :8000/voice/transcribe)
            // For this component we use the default backend URL if NO NEXT_PUBLIC_API_URL is set
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');

            const res = await fetch(`${apiUrl}/voice/transcribe`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to process audio');
            }

            const data = await res.json();
            setTranscript(data.transcript);
            setLanguage(data.detected_language);

            if (onTranscript) {
                onTranscript(data.transcript, data.detected_language);
            }
        } catch (err: any) {
            console.error('Audio processing error:', err);
            setError(err.message || 'An error occurred while processing the audio.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="bg-black/50 border-gray-800 w-full max-w-md mx-auto">
            <CardContent className="p-6 flex flex-col items-center">
                <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Voice Input (Whisper)</h3>
                    <p className="text-sm text-gray-400">
                        Supports 8 regional Indian languages natively.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-900 border text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-center items-center mb-6 h-32 w-full bg-gray-900/50 rounded-lg border border-gray-800">
                    {isRecording ? (
                        <div className="flex space-x-2 items-center">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                            </span>
                            <span className="text-red-400 font-medium animate-pulse">Listening...</span>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center text-[#00f0ff]">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span className="text-sm font-medium">Transcribing with PyTorch/Whisper...</span>
                        </div>
                    ) : transcript ? (
                        <div className="flex flex-col items-center text-green-400 p-4 text-center">
                            <CheckCircle2 className="h-8 w-8 mb-2" />
                            <p className="text-sm line-clamp-2">"{transcript}"</p>
                            <span className="text-xs text-gray-500 mt-2 uppercase">Detected: {language}</span>
                        </div>
                    ) : (
                        <Mic className="h-12 w-12 text-gray-700" />
                    )}
                </div>

                <div className="flex justify-center w-full">
                    {!isRecording ? (
                        <Button
                            onClick={startRecording}
                            disabled={isProcessing}
                            className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold h-12 rounded-full"
                        >
                            <Mic className="h-5 w-5 mr-2" />
                            Start Recording
                        </Button>
                    ) : (
                        <Button
                            onClick={stopRecording}
                            variant="destructive"
                            className="w-full font-bold h-12 rounded-full bg-red-500 hover:bg-red-600"
                        >
                            <Square className="h-5 w-5 mr-2 fill-current" />
                            Stop Recording
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
