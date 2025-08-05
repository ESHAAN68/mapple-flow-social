import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Settings, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BoardActionsProps {
  board: any;
  isOwner: boolean;
  onShare: () => void;
}

export const BoardActions: React.FC<BoardActionsProps> = ({ board, isOwner, onShare }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = () => {
    toast({
      title: "Download",
      description: "Download feature will be implemented soon",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Board settings will be implemented soon",
    });
  };

  const handleDelete = async () => {
    if (!isOwner) {
      toast({
        title: "Unauthorized",
        description: "Only the board owner can delete this board",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Delete related data first
      await supabase.from('messages').delete().eq('board_id', board.id);
      await supabase.from('canvas_objects').delete().eq('board_id', board.id);
      await supabase.from('user_presence').delete().eq('board_id', board.id);
      await supabase.from('board_collaborators').delete().eq('board_id', board.id);
      
      // Finally delete the board
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', board.id);

      if (error) throw error;

      toast({
        title: "Board deleted",
        description: "The board has been permanently deleted",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting board:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the board. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleSettings}>
        <Settings className="h-4 w-4" />
      </Button>
      
      <Button variant="ghost" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4" />
      </Button>
      
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Board</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete "{board.title}"? This action cannot be undone.
                All data, messages, and collaborators will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};