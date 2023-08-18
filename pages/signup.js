import { useState } from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [link, setLink] = useState(null);

  const handleSubmit = async () => {
    if (!email || !validateEmail(email)) {
      alert("Please enter a valid email address!");
      return;
    }

    const response = await fetch('/api/generateLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    setLink(data.link);
  };

  const validateEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gradient-01">
      <div className="p-6 rounded-lg shadow-md glassmorphism">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="px-4 py-2 mb-4 w-64 border rounded focus:outline-none focus:border-indigo-500"
        />
        <button 
          onClick={handleSubmit} 
          className="px-6 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none"
        >
          Get WhatsApp Link
        </button>
      </div>
      
      {link && (
        <div className="mt-4">
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-6 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Open WhatsApp Chat
          </a>
        </div>
      )}
    </div>
  );
}
