import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  FileText,
  Image,
  Camera,
  Headphones,
  Film,
  Smile,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatAttachmentMenuProps {
  userId: string;
  conversationId: string;
  onFileUploaded: (url: string, fileName: string, fileType: string) => void;
  onEmojiSelect: (emoji: string) => void;
}

const FILE_CATEGORIES = [
  {
    label: 'Document',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar',
    color: 'text-violet-400',
  },
  {
    label: 'Photos & Videos',
    icon: Image,
    accept: 'image/*,video/*',
    color: 'text-blue-400',
  },
  {
    label: 'Camera',
    icon: Camera,
    accept: 'image/*',
    capture: true,
    color: 'text-red-400',
  },
  {
    label: 'Audio',
    icon: Headphones,
    accept: 'audio/*',
    color: 'text-orange-400',
  },
  {
    label: 'GIF',
    icon: Film,
    accept: 'image/gif',
    color: 'text-green-400',
  },
];

export const ChatAttachmentMenu: React.FC<ChatAttachmentMenuProps> = ({
  userId,
  conversationId,
  onFileUploaded,
  onEmojiSelect,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAccept, setCurrentAccept] = useState('');
  const [currentCapture, setCurrentCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const handleCategoryClick = (accept: string, capture?: boolean) => {
    setCurrentAccept(accept);
    setCurrentCapture(capture || false);
    // Small delay to let state update, then click input
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5GB limit
    const MAX_SIZE = 5 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5GB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadProgress(`Uploading ${file.name} (${sizeMB}MB)...`);

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${conversationId}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : 'file';

      onFileUploaded(urlData.publicUrl, file.name, fileType);

      toast({
        title: 'File sent',
        description: file.name,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={currentAccept}
        capture={currentCapture ? 'environment' : undefined}
        onChange={handleFileChange}
      />

      {/* Attachment dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={isUploading}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-52 bg-popover border-border"
        >
          {FILE_CATEGORIES.map((cat) => (
            <DropdownMenuItem
              key={cat.label}
              onClick={() => handleCategoryClick(cat.accept, cat.capture)}
              className="cursor-pointer"
            >
              <cat.icon className={`w-5 h-5 mr-3 ${cat.color}`} />
              <span>{cat.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Emoji picker */}
      <Popover open={showEmoji} onOpenChange={setShowEmoji}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <Smile className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-auto p-0 border-none"
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => {
              onEmojiSelect(emoji.native);
              setShowEmoji(false);
            }}
            theme="dark"
            previewPosition="none"
            skinTonePosition="search"
          />
        </PopoverContent>
      </Popover>

      {/* Upload progress indicator */}
      {isUploading && (
        <span className="text-xs text-muted-foreground animate-pulse truncate max-w-[150px]">
          {uploadProgress}
        </span>
      )}
    </div>
  );
};
