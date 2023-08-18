// import { useState } from 'react';

// export default function Signup() {
//   const [email, setEmail] = useState('');
//   const [link, setLink] = useState(null);

//   const handleSubmit = async () => {
//     const response = await fetch('/api/generateLink', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ email }),
//     });

//     const data = await response.json();
//     setLink(data.link);
//   };

//   return (
//     <div>
//       <input
//         type="email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         placeholder="Enter your email"
//       />
//       <button onClick={handleSubmit}>Get WhatsApp Link</button>

//       {link && (
//         <div>
//           <a href={link} target="_blank" rel="noopener noreferrer">
//             Open WhatsApp Chat
//           </a>
//         </div>
//       )}
//     </div>
//   );
// }
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
    <div className="flex flex-col items-center justify-center h-screen gradient-01">
      <div className="p-6 rounded-lg shadow-lg glassmorphism w-2/3 md:w-1/2 lg:w-1/3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="px-4 py-2 mb-4 w-full border rounded focus:outline-none focus:border-indigo-500"
        />
        <button 
          onClick={handleSubmit} 
          className="px-6 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none w-full"
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
