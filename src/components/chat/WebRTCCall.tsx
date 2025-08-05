import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Phone, PhoneOff, Video, VideoOff, Monitor, MonitorOff, PhoneIncoming, Mic, MicOff, MessageSquare, Users, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [callMessages, setCallMessages] = useState<any[]>([]);
  const [newCallMessage, setNewCallMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);

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

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

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
      .on('broadcast', { event: 'call-message' }, (payload) => {
        console.log('Call message:', payload);
        if (payload.payload.conversation_id === conversationId) {
          setCallMessages(prev => [...prev, payload.payload]);
        }
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
        video: isVideoEnabled,
        audio: isAudioEnabled
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

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
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
    setIsAudioEnabled(false);
    setIsScreenSharing(false);
    setCallStatus('idle');
    setShowChat(false);
    setCallMessages([]);
    setCallDuration(0);
  };

  const sendCallMessage = () => {
    if (!newCallMessage.trim()) return;

    const message = {
      id: Math.random().toString(),
      conversation_id: conversationId,
      sender_id: user?.id,
      sender_name: user?.user_metadata?.display_name || user?.email,
      content: newCallMessage,
      timestamp: new Date().toISOString()
    };

    // Add to local state
    setCallMessages(prev => [...prev, message]);

    // Broadcast to other participants
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-message',
      payload: message
    });

    setNewCallMessage('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Incoming call notification
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-4">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                <PhoneIncoming className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-4 border-2 border-blue-500 rounded-full animate-ping opacity-25"></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Incoming Video Call</h3>
              <p className="text-muted-foreground text-lg">{incomingCall.caller_name}</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={acceptCall} size="lg" className="flex-1 bg-green-600 hover:bg-green-700">
                <Phone className="w-5 h-5 mr-2" />
                Accept
              </Button>
              <Button onClick={declineCall} variant="destructive" size="lg" className="flex-1">
                <PhoneOff className="w-5 h-5 mr-2" />
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
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connected</span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {formatDuration(callDuration)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            2 participants
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={showChat ? 'bg-blue-600 text-white' : ''}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Call Status */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'connected' && `Call duration: ${formatDuration(callDuration)}`}
          </div>

          {/* Screen Share Indicator */}
          {isScreenSharing && (
            <div className="absolute top-16 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Screen sharing
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-card border-l border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold">Call Chat</h3>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {callMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{msg.sender_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm bg-muted p-2 rounded">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newCallMessage}
                onChange={(e) => setNewCallMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendCallMessage()}
                className="flex-1"
              />
              <Button onClick={sendCallMessage} size="sm">
                Send
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-card/95 backdrop-blur-md border-t border-border p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Audio Control */}
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-14 h-14"
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* Video Control */}
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            onClick={toggleScreenShare}
            className="rounded-full w-14 h-14"
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </Button>

          {/* Chat Toggle */}
          <Button
            variant={showChat ? "default" : "outline"}
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className="rounded-full w-14 h-14"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <Settings className="w-6 h-6" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              endCall();
              onCallToggle();
            }}
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};