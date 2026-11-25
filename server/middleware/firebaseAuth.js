const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const projectId = process.env.FIREBASE_PROJECT_ID || 'export-maal';

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId
  });
}

const firebaseAuth = getAuth();

const requireFirebaseAuth = async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!token) {
    return res.status(401).json({ message: 'Firebase sign-in is required' });
  }

  try {
    req.firebaseUser = await firebaseAuth.verifyIdToken(token);
  } catch (error) {
    console.error(
      `Firebase token verification failed (${error.code || 'unknown'}):`,
      error.message
    );
    const message = error.code === 'auth/id-token-expired'
      ? 'Your Firebase session expired. Please sign in again.'
      : 'Firebase could not verify this token. Sign in again, and check that Firebase Admin uses the same project as the web app.';
    return res.status(401).json({ message });
  }

  next();
};

const requireVerifiedEmail = (req, res, next) => {
  if (!req.firebaseUser.email_verified) {
    return res.status(403).json({ message: 'A verified email is required' });
  }

  next();
};

module.exports = { requireFirebaseAuth, requireVerifiedEmail };
