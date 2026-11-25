const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findFarmerForUser = async ({ uid, email, email_verified }) => {
  const buyerByUid = uid ? await Buyer.findOne({ uid }) : null;
  if (buyerByUid) return null;

  const farmerByUid = uid ? await Farmer.findOne({ uid }) : null;
  if (farmerByUid || !email) return farmerByUid;

  const farmerByEmail = await Farmer.findOne({
    email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i')
  });
  if (!farmerByEmail || farmerByEmail.uid === uid || !email_verified) {
    return farmerByEmail;
  }

  return Farmer.findOneAndUpdate(
    { _id: farmerByEmail._id, uid: farmerByEmail.uid },
    { $set: { uid } },
    { new: true, runValidators: true }
  );
};

module.exports = findFarmerForUser;
