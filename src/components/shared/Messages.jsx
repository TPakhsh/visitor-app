import React from 'react';

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm">
      {message}
    </div>
  );
}

export function SuccessMessage({ message }) {
  if (!message) return null;
  return (
    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm">
      {message}
    </div>
  );
}
