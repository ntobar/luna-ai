import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { token, amount } = req.body;

      const charge = await stripe.charges.create({
        amount,
        currency: 'usd',
        description: 'Example payment',
        source: token,
      });

      res.json({ success: true, charge });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
