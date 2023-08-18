import { useState } from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [link, setLink] = useState(null);

  const handleSubmit = async () => {
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

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button onClick={handleSubmit}>Get WhatsApp Link</button>

      {link && (
        <div>
          <a href={link} target="_blank" rel="noopener noreferrer">
            Open WhatsApp Chat
          </a>
        </div>
      )}
    </div>
  );
}
