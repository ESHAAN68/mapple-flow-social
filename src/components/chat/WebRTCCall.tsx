import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Phone, PhoneOff, Video, VideoOff, Monitor, MonitorOff } from 'lucide-react';

interface WebRTCCallProps {
  conversationId: string;
  isCallActive: boolean;
  onCallToggle: () => void;
}

export const WebRTCCall: React.FC<WebRTCCallProps> = ({
  conversationId,
  isCallActive,
  onCallToggle
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (isCallActive) {
      initializeCall();
    } else {
      endCall();
    }

    return () => {
      endCall();
    };
  }, [isCallActive]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'webrtc',
            event: 'ice-candidate',
            candidate: event.candidate,
            conversation_id: conversationId,
            sender_id: user?.id
          });
        }
      };

      // Setup Supabase realtime for signaling
      setupSignaling();

      toast({
        title: "Call started",
        description: "Initializing video call...",
      });

    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Call failed",
        description: "Failed to access camera/microphone",
        variant: "destructive",
      });
      onCallToggle();
    }
  };

  const setupSignaling = () => {
    channelRef.current = supabase
      .channel(`webrtc:${conversationId}`)
      .on('broadcast', { event: 'webrtc' }, async (payload) => {
        const { event, offer, answer, candidate } = payload.payload;

        switch (event) {
          case 'offer':
            await handleOffer(offer);
            break;
          case 'answer':
            await handleAnswer(answer);
            break;
          case 'ice-candidate':
            await handleIceCandidate(candidate);
            break;
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Create and send offer
          const offer = await peerConnectionRef.current?.createOffer();
          await peerConnectionRef.current?.setLocalDescription(offer);
          
          channelRef.current.send({
            type: 'webrtc',
            event: 'offer',
            offer: offer,
            conversation_id: conversationId,
            sender_id: user?.id
          });
        }
      });
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    channelRef.current?.send({
      type: 'webrtc',
      event: 'answer',
      answer: answer,
      conversation_id: conversationId,
      sender_id: user?.id
    });
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(answer);
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.addIceCandidate(candidate);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        videoTrack.onended = () => {
          // Switch back to camera when screen sharing ends
          setIsScreenSharing(false);
          if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            sender?.replaceTrack(cameraTrack);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          }
        };

        setIsScreenSharing(true);
      } else {
        // Switch back to camera
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current?.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast({
        title: "Screen share failed",
        description: "Failed to start screen sharing",
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsVideoEnabled(false);
    setIsScreenSharing(false);
  };

  if (!isCallActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onCallToggle}
      >
        <Phone className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex flex-col h-full">
        {/* Video container */}
        <div className="flex-1 relative">
          {/* Remote video (main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local video (picture-in-picture) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-border"
          />
        </div>

        {/* Call controls */}
        <div className="p-4 bg-card border-t">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="sm"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onCallToggle}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};