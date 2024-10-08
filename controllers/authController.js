const connection = require("../db_conn/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res) => {
  const { username, email, number, password, usertype } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO tblusers (username, email, number, password, usertype) VALUES (?, ?, ?, ?,?)";
    await connection.query(query, [
      username,
      email,
      number,
      hashedPassword,
      usertype,
    ]);
    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const login = async (req, res) => {
  const { email, number, password } = req.body;
  try {
    const [rows] = await connection.query(
      "SELECT * FROM tblusers WHERE email = ? OR number = ?",
      [email, number]
    );

    const user = rows[0];

    if (!user) {
      console.log("User not found");
      return res.status(400).send("Cannot find user");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        number: user.number,
        type: user.usertype,
      };
      const options = { expiresIn: "1h", algorithm: "HS256" };
      const token = jwt.sign(payload, process.env.SECRET_KEY, options);
      res.json({ token });
    } else {
      res.status(400).send("Incorrect password"); 
    }
  } catch (error) {
    console.error("Error during login process:", error);
    res.status(500).send("Server error");
  }
};

const user = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const id = decoded.id;
    const useridEcrypt = jwt.sign({ id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    const result = {
      ...decoded,
      id: useridEcrypt,
    };
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = {
  register,
  login,
  user,
};
