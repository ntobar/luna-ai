import { loadStripe } from "@stripe/stripe-js";

const getStripe = () => {
  if (window.Stripe) {
    return Promise.resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY));
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
};

export default getStripe;
