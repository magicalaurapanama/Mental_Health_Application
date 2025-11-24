import React from 'react';
import { MessageCircle } from 'lucide-react';
import NavButton from './NavButton';

const FloatingChatButton = ({ onClick }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <NavButton
        icon={<MessageCircle className="h-6 w-6" />}
        label="Chat Here"
        onClick={onClick}
      />
    </div>
  );
};

export default FloatingChatButton;