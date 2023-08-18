export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { email } = req.body;
  
      // TODO: Add email to your database or handle it accordingly.
  
      // Generate the WhatsApp link (assuming you have the chatbot number)
      const waNumber = '+593994309557';  // replace with your chatbot number
      const link = `https://wa.me/${waNumber}?text=Hello!`;
  
      res.status(200).json({ link });
    } else {
      res.status(405).end();  // Method Not Allowed
    }
  }
  