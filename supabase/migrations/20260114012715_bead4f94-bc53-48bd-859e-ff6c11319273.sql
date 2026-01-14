-- Enable full replica identity for realtime updates
ALTER TABLE admin_messages REPLICA IDENTITY FULL;
ALTER TABLE user_announcements REPLICA IDENTITY FULL;
ALTER TABLE announcements REPLICA IDENTITY FULL;