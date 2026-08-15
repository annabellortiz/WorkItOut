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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
