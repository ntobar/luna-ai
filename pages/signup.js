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

// END WORKING FUNCTION ---------------------

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
//     <div className="flex flex-col items-center justify-center h-screen gradient-01">
//       <div className="p-6 rounded-lg shadow-lg glassmorphism w-2/3 md:w-1/2 lg:w-1/3">
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email"
//           className="px-4 py-2 mb-4 w-full border rounded focus:outline-none focus:border-indigo-500"
//         />
//         <button 
//           onClick={handleSubmit} 
//           className="px-6 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none w-full"
//         >
//           Get WhatsApp Link
//         </button>
//       </div>
      
//       {link && (
//         <div className="mt-4">
//           <a 
//             href={link} 
//             target="_blank" 
//             rel="noopener noreferrer" 
//             className="px-6 py-2 text-white bg-green-600 rounded hover:bg-green-700"
//           >
//             Open WhatsApp Chat
//           </a>
//         </div>
//       )}
//     </div>
//   );
// }


// BEST WORKING SOLUTION!!!!
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-01">
      <div className="p-8 rounded-lg shadow-lg glassmorphism w-96">
        <h1 className="text-2xl mb-4">Signup for WhatsApp</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="p-2 w-full mb-4 rounded border"
        />
        <button onClick={handleSubmit} className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Get WhatsApp Link
        </button>
        {link && (
          <div className="mt-4">
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              Open WhatsApp Chat
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
// END OF BEST WORKING SOLUTION

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-01">
      <div className="p-8 rounded-lg shadow-lg glassmorphism w-96">
        <h1 className="text-2xl mb-4 font-bold">Signup for WhatsApp</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="p-2 w-full mb-4 rounded border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <button onClick={handleSubmit} className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200">
          Get WhatsApp Link
        </button>
        {link && (
          <div className="mt-4">
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600">
              Open WhatsApp Chat
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
