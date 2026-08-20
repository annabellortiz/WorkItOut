import express from 'express';
const _adminModule: any = require('firebase-admin');
const admin: any = _adminModule && _adminModule.default ? _adminModule.default : _adminModule;
const serviceAccount: any = require('../serviceAccountKey.json');

const credential = (admin.credential && typeof admin.credential.cert === 'function')
  ? admin.credential.cert(serviceAccount)
  : admin.cert(serviceAccount);

admin.initializeApp({
  credential,
});

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const app = express();

app.use(express.json());

// Auth middleware: expects Authorization: Bearer <idToken>
async function authenticate(req: any, res: any, next: any) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'missing authorization header' });
  const idToken = m[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (e) {
    console.error('verifyIdToken failed', e);
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Create account
app.post('/user', async (req, res) => {
  try {
    const { id, name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });

    const data = { name, email, createdAt: new Date().toISOString() };

    if (id) {
      const docRef = db.collection('users').doc(id);
      await docRef.set(data, { merge: false });
      return res.status(201).json({ id: docRef.id, ...data });
    }

    const docRef = await db.collection('users').add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Read account
app.get('/user/:id', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    return res.json(doc.exists ? doc.data() : null);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// List saved workouts for authenticated user
app.get('/user/me/workouts', authenticate, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const col = db.collection('users').doc(uid).collection('savedWorkouts');
    const snaps = await col.orderBy('createdAt', 'desc').get();
    const results: any[] = [];
    snaps.forEach((d: any) => results.push({ id: d.id, ...d.data() }));
    return res.json({ workouts: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Create saved workout
app.post('/user/me/workouts', authenticate, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const payload = req.body || {};
    const data = { ...payload, createdAt: new Date().toISOString() };
    const docRef = await db.collection('users').doc(uid).collection('savedWorkouts').add(data);
    const doc = await docRef.get();
    return res.status(201).json({ id: docRef.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Update saved workout (partial replace)
app.put('/user/me/workouts/:workoutId', authenticate, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const wid = req.params.workoutId;
    const payload = req.body || {};
    const docRef = db.collection('users').doc(uid).collection('savedWorkouts').doc(wid);
    await docRef.set({ ...payload, updatedAt: new Date().toISOString() }, { merge: true });
    const doc = await docRef.get();
    return res.json({ id: docRef.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Delete saved workout
app.delete('/user/me/workouts/:workoutId', authenticate, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const wid = req.params.workoutId;
    await db.collection('users').doc(uid).collection('savedWorkouts').doc(wid).delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
