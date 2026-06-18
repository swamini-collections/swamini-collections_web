const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { id, name, price } = req.body;

    if (!id || !name || !price) {
      return res.status(400).json({
        error: "Missing product information",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",

            product_data: {
              name: name,
            },

            unit_amount: Math.round(price * 100),
          },

          quantity: 1,
        },
      ],

      success_url:
        "https://https://swamini-collectionsweb.vercel.app/success?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        "https://https://swamini-collectionsweb.vercel.app/cancel",
    });

    return res.status(200).json({
      url: session.url,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message,
    });

  }
};
