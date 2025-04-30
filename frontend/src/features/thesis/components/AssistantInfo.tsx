// Placeholder for displaying Graduation Assistant Info on Thesis Page
import React from 'react';

interface AssistantInfoProps {
  assistantName?: string; // Name might be optional if not assigned yet
}

const AssistantInfo: React.FC<AssistantInfoProps> = ({ assistantName }) => {
  if (!assistantName) {
    return null; // Don't render anything if no assistant is assigned
  }

  return (
    <div className="mt-4 p-2 border rounded bg-gray-100">
      <p><strong>Reviewed by:</strong> {assistantName}</p>
    </div>
  );
};

export default AssistantInfo; 