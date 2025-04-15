import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "replace_this_with_a_random_secure_string";

app.use(cors());
app.use(express.json());

const adapter = new JSONFile("db.json");
const db = new Low(adapter);
await db.read();
db.data ||= { codes: [] };

app.post("/activate", async (req, res) => {
  const { code, fingerprint } = req.body;

  if (!code || !fingerprint) {
    return res.status(400).json({ error: "Missing code or fingerprint" });
  }

  const record = db.data.codes.find(c => c.code === code);

  if (!record) {
    return res.status(404).json({ error: "Code not found" });
  }

  if (record.used) {
    return res.status(403).json({ error: "Code has already been used" });
  }

  record.used = true;
  record.fingerprint = fingerprint;
  await db.write();

  const token = jwt.sign({ fingerprint }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
