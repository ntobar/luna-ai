// import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// const CheckoutForm = ({ onSuccess }) => {
//   const stripe = useStripe();
//   const elements = useElements();

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     const card = elements.getElement(CardElement);
//     const result = await stripe.createToken(card);

//     if (result.error) {
//       console.error(result.error);
//     } else {
//       // Send token to server
//       const response = await fetch('/api/payment', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           token: result.token.id,
//           amount: 1000, // Example amount in cents
//         }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         onSuccess();
//       } else {
//         console.error(data.message);
//       }
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <CardElement />
//       <button type="submit">Pay</button>
//     </form>
//   );
// };

// export default CheckoutForm;


// pages/checkout.js
import { useEffect, useState } from 'react';
import getStripe from '../utils/stripe';

const CheckoutPage = () => {
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripe = await getStripe();
      setStripe(stripe);
    };
    initializeStripe();
  }, []);

  const handleClick = async (event) => {
    event.preventDefault();
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: process.env.NEXT_PUBLIC_PRICE_ID_STRIPE, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${window.location.origin}/success/`,
      cancelUrl: `${window.location.origin}/cancel/`,
    });
    if (error) {
      console.warn('Error:', error);
    }
  };

  return (
    <button disabled={!stripe} onClick={handleClick}>
      Checkout
    </button>
  );
};

export default CheckoutPage;
