import { useState } from 'react';
import { useRouter } from 'next/router';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '../utils/stripe';


import CheckoutForm from './CheckoutForm';

const stripePromise = getStripe();

const CheckoutPage = () => {
  const router = useRouter();

  console.log("STRIPE PROMISE: ", stripePromise);
  const [message, setMessage] = useState('');

  const onSuccessfulCheckout = () => {
    setMessage('Payment successful!');
    router.push('/');
  };

  return (
    <div>
      {message ? <p>{message}</p> : (
        <Elements stripe={stripePromise}>
          <CheckoutForm onSuccess={onSuccessfulCheckout} />
        </Elements>
      )}
    </div>
  );
}

export default CheckoutPage;
