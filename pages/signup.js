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
//     <div className="min-h-screen flex items-center justify-center bg-gradient-01">
//       <div className="p-8 rounded-lg shadow-lg glassmorphism w-96">
//         <h1 className="text-2xl mb-4">Signup for WhatsApp</h1>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email"
//           className="p-2 w-full mb-4 rounded border"
//         />
//         <button onClick={handleSubmit} className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//           Get WhatsApp Link
//         </button>
//         {link && (
//           <div className="mt-4">
//             <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
//               Open WhatsApp Chat
//             </a>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// END OF BEST WORKING SOLUTION
// import { useState } from 'react';

// export default function Signup() {
//     return (
//       <div style={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: '100vh'
//       }}>
//         Hello World
//       </div>
//     );
//   }

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
//     <div style={{
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       height: '100vh',
//       flexDirection: 'column'
//     }}>
//       <div className="glassmorphism p-4 rounded-md mb-4">
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email"
//           className="p-2 rounded-md mb-2 w-full"
//         />
//         <button 
//           onClick={handleSubmit} 
//           className="p-2 rounded-md bg-blue-500 text-white w-full"
//         >
//           Get WhatsApp Link
//         </button>
//       </div>

//       {link && (
//         <a 
//           href={link} 
//           target="_blank" 
//           rel="noopener noreferrer"
//           className="p-2 rounded-md bg-green-500 text-white"
//         >
//           Open WhatsApp Chat
//         </a>
//       )}
//     </div>
//   );
// }


// import { useState } from 'react';

// export default function Signup() {
//   const [email, setEmail] = useState('');
//   const [link, setLink] = useState(null);

//   const handleSubmit = async () => {
//     if (!email) return;  // simple validation to ensure the email is entered

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
//     <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
//       <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)' }}>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email"
//           style={{ padding: '10px', marginBottom: '10px', width: '200px', borderRadius: '5px' }}
//         />
//         <button onClick={handleSubmit} style={{ padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
//           Get WhatsApp Link
//         </button>

//         {link && (
//           <div style={{ marginTop: '10px' }}>
//             <a href={link} target="_blank" rel="noopener noreferrer">
//               Open WhatsApp Chat
//             </a>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

//WORKING FUNCTION BEGINNING

// import { useState } from 'react';

// export default function Signup() {
//   const [email, setEmail] = useState('');

// //   const handleSubmit = async () => {
// //     if (!email) return;  // Simple validation to ensure the email is entered

// //     const response = await fetch('/api/generateLink', {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify({ email }),
// //     });

// //     const data = await response.json();
// //     if (data && data.link) {
// //       window.open(data.link, '_blank');  // This will open the link directly in a new tab
// //     }
// //   };

// const handleSubmit = async () => {
//     const isValidEmail = (email) => {
//         const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
//         return regex.test(email);
//       };

//     if (!isValidEmail(email)) {
//       alert("Please enter a valid email!");
//       return;
//     }

//     const response = await fetch('/api/generateLink', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ email }),
//     });

//     const data = await response.json();
//     if (data && data.link) {
//       window.open(data.link, '_blank');
//     }
//   };


//   return (
//     <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
//       <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email"
//           style={{ padding: '10px', marginBottom: '10px', width: '200px', borderRadius: '5px' }}
//         />
//         <br />
//         <button onClick={handleSubmit} style={{ padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
//           Get WhatsApp Link
//         </button>
//       </div>
//     </div>
//   );
// }


// WORKING FUNCTION END

import { useState } from 'react';

export default function Signup() {
    const [email, setEmail] = useState('');

    const isValidEmail = (email) => {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return regex.test(email);
    };

    const handleSubmit = async () => {
        if (!isValidEmail(email)) {
            alert("Please enter a valid email!");
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
        if (data && data.link) {
            window.open(data.link, '_blank');
        }
    };

    return (
        <div className="hero-gradient" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{ padding: '10px', marginBottom: '10px', width: '200px', borderRadius: '5px' }}
                />
                <br />
                <button onClick={handleSubmit} style={{ padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Get WhatsApp Link
                </button>
            </div>
        </div>
    );
}




