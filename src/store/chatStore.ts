import { create } from 'zustand';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
  board_id: string;
}

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  newMessage: string;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsOpen: (isOpen: boolean) => void;
  setNewMessage: (message: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  newMessage: '',
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setIsOpen: (isOpen) => set({ isOpen }),
  setNewMessage: (newMessage) => set({ newMessage }),
}));