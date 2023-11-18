// import { loadStripe } from "@stripe/stripe-js";

// const getStripe = () => {
//   console.log("STRIPE KEY: ", process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
//   if (window.Stripe) {
//     return Promise.resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY));
//   }
//   return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
// };

// export default getStripe;


// new

import { loadStripe } from '@stripe/stripe-js';

const getStripe = () => {
  console.log("STRIPE TEST KEY: ", process.env.NEXT_PUBLIC_STRIPE_TEST_KEY);
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_TEST_KEY);
};

export default getStripe;