const Buyer = require('../models/Buyer');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findBuyerForUser = async ({ uid, email, email_verified }) => {
  const buyerByUid = uid ? await Buyer.findOne({ uid }) : null;
  if (buyerByUid || !email || !email_verified) return buyerByUid;

  const buyerByEmail = await Buyer.findOne({
    email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i')
  });
  if (!buyerByEmail || buyerByEmail.uid === uid) return buyerByEmail;

  return Buyer.findOneAndUpdate(
    { _id: buyerByEmail._id, uid: buyerByEmail.uid },
    { $set: { uid } },
    { new: true, runValidators: true }
  );
};

module.exports = findBuyerForUser;
