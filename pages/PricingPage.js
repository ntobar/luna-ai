// components/PricingPage.js

import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';
import { Footer, Navbar } from '../components';

// import lunalogo from '../public/lunalogoround.png';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_PRICE_ID_STRIPE);

const plans = [
  {
    id: 'price_1O9HXYDTDxndnwTNdox4OYdc',
    name: 'Basic Plan',
    price: '$1.99/month',
    description: 'For casual users who need basic tools and assistance.',
    features: [
      '10,000 tokens per month',
      '50 audio transcriptions per month',
      '20 image generations per month',
      'Standard response time',
      'Email support',
    ],
  },
  {
    id: 'price_1O9GYODTDxndnwTN1MiTtJI3',
    name: 'Standard Plan',
    price: '$4.99/month',
    description: 'Ideal for regular users who need more flexibility.',
    features: [
      '50,000 tokens per month',
      '100 audio transcriptions per month',
      '50 image generations per month',
      'Priority response time',
      'Email and chat support',
    ],
  },
  {
    id: 'price_1O9HXxDTDxndnwTNckqTs6Yj',
    name: 'Premium Plan',
    price: '$9.99/month',
    description: 'For power users who demand the best performance.',
    features: [
      'Unlimited tokens per month',
      'Unlimited audio transcriptions per month',
      'Unlimited image generations per month',
      'Premium response time',
      'Priority customer support',
    ],
  },
];

const redirectToCheckout = async (priceId) => {
  const stripe = await stripePromise;
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/success/`,
    cancelUrl: `${window.location.origin}/cancel/`,
  });
  if (error) {
    console.error('Stripe checkout error:', error);
  }
};





// const PricingCard = ({ plan }) => (
//   <div className="max-w-md bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden my-5">
//     <h3 className="bg-blue-500 text-white text-lg leading-6 font-bold text-center uppercase p-3">{plan.name}</h3>
//     <p className="text-2xl text-gray-800 font-bold text-center mt-2">{plan.price}</p>
//     <p className="text-gray-600 text-sm text-center mt-2 px-6">{plan.description}</p>
//     <ul className="list-disc list-inside m-4">
//       {plan.features.map((feature, index) => (
//         <li key={index} className="text-gray-700 text-sm py-1">{feature}</li>
//       ))}
//     </ul>
//     <button
//       className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-b-lg transition ease-in-out duration-300"
//       onClick={() => redirectToCheckout(plan.id)}
//     >
//       Choose {plan.name}
//     </button>
//   </div>
// );


// const PricingPage = () => (
//   <div className="py-8 bg-gradient-to-br from-teal-200 to-green-200">
//     {/* Logo image */}


//     <div className="flex justify-center my-6">
//       <Image src="/lunalogoround.png" alt="Logo" width={300} height={300} /> {/* Adjust the path and size as needed */}
//       {/* <Image src="/lunalogoround.png" alt="Logo" className="h-20" /> Adjust the path and size as needed */}
//     </div>

//     <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Choose Your Plan</h1>
//     <div className="flex flex-wrap justify-center gap-8">
//       {plans.map((plan) => (
//         <PricingCard key={plan.id} plan={plan} />
//       ))}
//     </div>
//   </div>
// );

const PricingCard = ({ plan }) => (
  <div className="max-w-md bg-white rounded-lg border border-gray-200 overflow-hidden my-5 shadow-xl shadow-shadow-color">
    <h3 className="bg-light-blue text-dark-text text-lg leading-6 font-bold text-center uppercase p-3">{plan.name}</h3>
    <p className="text-2xl text-dark-text font-bold text-center mt-2">{plan.price}</p>
    <p className="text-gray-600 text-sm text-center mt-2 px-6">{plan.description}</p>
    <ul className="list-disc list-inside m-4">
      {plan.features.map((feature, index) => (
        <li key={index} className="text-dark-text text-sm py-1">{feature}</li>
      ))}
    </ul>
    <button 
      className="w-full bg-light-blue hover:bg-light-blue text-dark-text font-bold py-3 px-4 rounded-b-lg transition ease-in-out duration-300"
      onClick={() => redirectToCheckout(plan.id)}
    >
      Choose {plan.name}
    </button>
  </div>
);

const PricingPage = () => (
  <div className="py-8 bg-dark-blue">
    <div className="flex flex-col items-center justify-center my-6">
      <Image src="/lunalogoround.png" alt="Luna.AI Logo" width={300} height={300} />
    </div>

    <h1 className="text-4xl font-bold text-center mb-8 text-light-blue">Choose Your Plan</h1>
    
    <div className="flex flex-wrap justify-center gap-8">
      {plans.map((plan) => (
        <PricingCard key={plan.id} plan={plan} />
      ))}
    </div>
  </div>
);


// const PricingPage = () => (
//   <div className="py-8">
//     <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
//     <div className="flex flex-wrap justify-center gap-8">
//       {plans.map((plan) => (
//         <PricingCard key={plan.id} plan={plan} />
//       ))}
//     </div>
//   </div>
// );

export default PricingPage;

// const PricingCard = ({ plan }) => (
//   <div className="pricing-card">
//     <h3>{plan.name}</h3>
//     <p className="price">{plan.price}</p>
//     <p className="description">{plan.description}</p>
//     <ul className="features">
//       {plan.features.map((feature, index) => (
//         <li key={index}>{feature}</li>
//       ))}
//     </ul>
//     <button onClick={() => redirectToCheckout(plan.id)}>Choose {plan.name}</button>
//   </div>
// );

// const PricingPage = () => (
//   <div className="pricing-page">
//     <h1>Choose Your Plan</h1>
//     <div className="pricing-grid">
//       {plans.map((plan) => (
//         <PricingCard key={plan.id} plan={plan} />
//       ))}
//     </div>
//     <style jsx>{`
// .pricing-page {
//   padding: 4rem 0;
//   background: #f4f7f6; /* Lighter background for a fresher look */
//   color: #333;
//   font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
// }

// .pricing-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//   gap: 2rem;
//   justify-content: center;
//   padding: 0 4rem;
// }

// .pricing-card {
//   background: white;
//   border: 1px solid #e1e1e1; /* subtle border */
//   box-shadow: 0 4px 8px rgba(0,0,0,0.1);
//   border-radius: 16px;
//   overflow: hidden;
//   transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
//   padding: 2rem; /* added padding */
// }

// .pricing-card:hover {
//   transform: translateY(-5px);
//   box-shadow: 0 6px 12px rgba(0,0,0,0.15);
// }

// .pricing-card h3 {
//   background: #0084ff; /* Slightly different blue */
//   color: white;
//   margin: 0;
//   padding: 2rem; /* increased padding */
//   font-size: 1.8rem;
//   font-weight: 600; /* made the title bolder */
// }

// .price {
//   font-size: 2.5rem; /* larger font size */
//   color: #333;
//   margin: 1rem 0;
//   font-weight: bold; /* bolder font weight */
// }

// .description {
//   padding: 0 2rem; /* increased padding */
//   margin: 0 0 1.5rem;
//   border-bottom: 1px solid #eee;
//   font-size: 0.95rem;
//   color: #666;
//   line-height: 1.5; /* increased line height */
// }

// .features {
//   padding: 2rem; /* increased padding */
//   list-style: none;
//   margin: 0;
//   color: #333;
//   font-size: 0.9rem;
// }

// .features li {
//   margin-bottom: 1rem; /* increased space */
//   position: relative;
//   padding-left: 1.5rem;
// }

// .features li::before {
//   content: '';
//   display: block;
//   position: absolute;
//   left: 0;
//   top: 0.5rem;
//   width: 8px;
//   height: 8px;
//   background: #0084ff; /* Slightly different blue */
//   border-radius: 50%;
// }

// button {
//   display: block;
//   width: calc(100% - 3rem);
//   margin: 1.5rem auto;
//   padding: 1rem 2rem;
//   font-size: 1rem;
//   font-weight: bold;
//   color: white;
//   background-color: #0084ff; /* Slightly different blue */
//   border: 1px solid #0070f3; /* subtle border */
//   border-radius: 12px; /* rounded corners */
//   cursor: pointer;
//   transition: background-color 0.3s ease, transform 0.3s ease;
// }

// button:hover {
//   background-color: #0056b3;
//   transform: scale(1.05); /* subtle grow effect */
// }

// @media (max-width: 768px) {
//   .pricing-grid {
//     padding: 0 2rem;
//   }
// }

//   `}</style>
//   </div>
// );

// export default PricingPage;
