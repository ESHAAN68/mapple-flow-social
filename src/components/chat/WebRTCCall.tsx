import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Phone, PhoneOff, Video, VideoOff, Monitor, MonitorOff, PhoneIncoming } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WebRTCCallProps {
  conversationId: string;
  isCallActive: boolean;
  onCallToggle: () => void;
  otherUser?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const WebRTCCall: React.FC<WebRTCCallProps> = ({
  conversationId,
  isCallActive,
  onCallToggle,
  otherUser
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
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    // Always listen for incoming calls
    setupCallListener();

    if (isCallActive && callStatus === 'idle') {
      initiateCall();
    } else if (!isCallActive) {
      endCall();
    }

    return () => {
      endCall();
    };
  }, [isCallActive]);

  const setupCallListener = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const callChannel = supabase
      .channel(`calls:${conversationId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user?.id }
        }
      })
      .on('broadcast', { event: 'call-invitation' }, (payload) => {
        console.log('Received call invitation:', payload);
        if (payload.payload.to_user_id === user?.id && payload.payload.from_user_id !== user?.id) {
          setIncomingCall(payload.payload);
          // Show toast notification for incoming call
          toast({
            title: "Incoming Call",
            description: `${payload.payload.caller_name} is calling you`,
          });
        }
      })
      .on('broadcast', { event: 'call-accepted' }, (payload) => {
        console.log('Call accepted:', payload);
        if (payload.payload.to_user_id === user?.id) {
          setCallStatus('connected');
          initializeCall();
        }
      })
      .on('broadcast', { event: 'call-declined' }, (payload) => {
        console.log('Call declined:', payload);
        if (payload.payload.to_user_id === user?.id) {
          setCallStatus('idle');
          onCallToggle();
          toast({
            title: "Call declined",
            description: "The other user declined your call",
            variant: "destructive",
          });
        }
      })
      .on('broadcast', { event: 'call-ended' }, (payload) => {
        console.log('Call ended:', payload);
        setCallStatus('idle');
        endCall();
      })
      .on('broadcast', { event: 'webrtc-offer' }, async (payload) => {
        console.log('Received WebRTC offer:', payload);
        if (payload.payload.to_user_id === user?.id) {
          await handleOffer(payload.payload.offer);
        }
      })
      .on('broadcast', { event: 'webrtc-answer' }, async (payload) => {
        console.log('Received WebRTC answer:', payload);
        if (payload.payload.to_user_id === user?.id) {
          await handleAnswer(payload.payload.answer);
        }
      })
      .on('broadcast', { event: 'webrtc-ice' }, async (payload) => {
        console.log('Received ICE candidate:', payload);
        if (payload.payload.to_user_id === user?.id) {
          await handleIceCandidate(payload.payload.candidate);
        }
      })
      .subscribe();

    channelRef.current = callChannel;
  };

  const initiateCall = () => {
    if (!otherUser) {
      toast({
        title: "Cannot start call",
        description: "No other user in conversation",
        variant: "destructive",
      });
      return;
    }

    setCallStatus('calling');
    
    // Send call invitation
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-invitation',
      payload: {
        from_user_id: user?.id,
        to_user_id: otherUser.id,
        conversation_id: conversationId,
        caller_name: user?.user_metadata?.display_name || user?.email
      }
    });

    toast({
      title: "Calling...",
      description: `Calling ${otherUser.display_name || otherUser.username}`,
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (callStatus === 'calling') {
        setCallStatus('idle');
        onCallToggle();
        toast({
          title: "Call timeout",
          description: "No answer from the other user",
          variant: "destructive",
        });
      }
    }, 30000);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    setIncomingCall(null);
    setCallStatus('connected');
    
    // Notify caller that call was accepted
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-accepted',
      payload: {
        from_user_id: user?.id,
        to_user_id: incomingCall.from_user_id,
        conversation_id: conversationId
      }
    });

    // Start WebRTC
    await initializeCall();
  };

  const declineCall = () => {
    if (!incomingCall) return;

    // Notify caller that call was declined
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-declined',
      payload: {
        from_user_id: user?.id,
        to_user_id: incomingCall.from_user_id,
        conversation_id: conversationId
      }
    });

    setIncomingCall(null);
  };

  const initializeCall = async () => {
    try {
      console.log('Initializing WebRTC call...');
      
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
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('Received remote stream:', event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        console.log('ICE candidate:', event.candidate);
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc-ice',
            payload: {
              candidate: event.candidate,
              from_user_id: user?.id,
              to_user_id: otherUser?.id,
              conversation_id: conversationId
            }
          });
        }
      };

      // Connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnectionRef.current?.connectionState);
        if (peerConnectionRef.current?.connectionState === 'connected') {
          toast({
            title: "Call connected",
            description: "You are now connected",
          });
        }
      };

      // If we're the caller, create offer
      if (callStatus === 'calling') {
        console.log('Creating offer...');
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc-offer',
          payload: {
            offer: offer,
            from_user_id: user?.id,
            to_user_id: otherUser?.id,
            conversation_id: conversationId
          }
        });
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Call failed",
        description: "Failed to access camera/microphone",
        variant: "destructive",
      });
      endCall();
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log('Handling offer:', offer);
    if (!peerConnectionRef.current) {
      await initializeCall();
    }

    if (!peerConnectionRef.current) return;

    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'webrtc-answer',
      payload: {
        answer: answer,
        from_user_id: user?.id,
        to_user_id: otherUser?.id,
        conversation_id: conversationId
      }
    });
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    console.log('Handling answer:', answer);
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(answer);
    setCallStatus('connected');
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    console.log('Handling ICE candidate:', candidate);
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
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
    console.log('Ending call...');
    
    // Notify other user
    if (callStatus !== 'idle') {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'call-ended',
        payload: {
          from_user_id: user?.id,
          to_user_id: otherUser?.id,
          conversation_id: conversationId
        }
      });
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
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
    setCallStatus('idle');
  };

  // Incoming call notification
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <PhoneIncoming className="w-12 h-12 mx-auto text-primary animate-pulse" />
            <div>
              <h3 className="text-lg font-semibold">Incoming Call</h3>
              <p className="text-muted-foreground">{incomingCall.caller_name}</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={acceptCall} className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button onClick={declineCall} variant="destructive" className="flex-1">
                <PhoneOff className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Call button when not in call
  if (!isCallActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          console.log('Call button clicked, other user:', otherUser);
          if (otherUser) {
            onCallToggle();
          } else {
            toast({
              title: 'Cannot call',
              description: 'No user selected',
              variant: 'destructive'
            });
          }
        }}
        disabled={!otherUser}
      >
        <Phone className="w-4 h-4" />
      </Button>
    );
  }

  // Call interface when active
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex flex-col h-full">
        {/* Call status indicator */}
        <div className="p-4 text-center bg-primary text-primary-foreground">
          <p className="text-sm">
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && 'Connected'}
          </p>
        </div>

        {/* Video container */}
        <div className="flex-1 relative">
          {/* Remote video (main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-muted"
          />
          
          {/* Local video (picture-in-picture) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-border bg-muted"
          />

          {/* No video placeholder */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-semibold">
                    {(otherUser?.display_name || otherUser?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <p className="text-lg font-medium">
                  {otherUser?.display_name || otherUser?.username || 'Unknown User'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="p-4 bg-card border-t">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleVideo}
              disabled={callStatus !== 'connected'}
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="sm"
              onClick={toggleScreenShare}
              disabled={callStatus !== 'connected'}
            >
              {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                endCall();
                onCallToggle();
              }}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};