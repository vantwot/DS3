require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3');

// Configuración de la base de datos SQLite3
const db = new sqlite3.Database('userinfo.db');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configura el transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

// Configura la Tabla users
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT, email TEXT, password TEXT, age INTEGER)');

// Endpoint de registro
app.post('/register', async (req, res) => {
  const { full_name, email, password, age } = req.body;

  try {
    if (full_name && email && password && age) {
      const query_email = 'SELECT * FROM users WHERE email = ?';

      db.get(query_email, [email], (err, user) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!user) {
          bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            const query_insert = 'INSERT INTO users (full_name, email, password, age) VALUES (?, ?, ?, ?)';
            db.run(query_insert, [full_name, email, hashedPassword, age], (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.status(201).json({ message: 'Usuario registrado exitosamente' });
            });
          });
        } else {
          return res.status(400).json({ error: 'Ya existe este correo registrado' });
        }
      });
    } else {
      res.status(400).json({ message: 'Falta un dato, usuario no registrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de inicio de sesión
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE email = ?';

    db.get(query, [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de recuperación de contraseña
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE email = ?';

    db.get(query, [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Correo incorrecto' });
      }

      const resetCode = Math.random().toString(36).substr(2, 8);

      bcrypt.hash(resetCode, 10, async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
        await db.run(updateQuery, [hashedPassword, email]);

        const mailOptions = {
          from: process.env.USER_EMAIL,
          to: email,
          subject: 'Restablecimiento de contraseña',
          text: `Tu código de restablecimiento de contraseña es: ${resetCode}`,
        };

        transporter.sendMail(mailOptions, function(err, data) {
          if (err) {
            console.log({ error: 'Error al enviar el correo de recuperación.', Detalle: err });
          } else {
            console.log({ message: 'Correo de recuperación enviado con éxito.' });
          }
        });
        res.json({ message: 'Solicitud de recuperación de contraseña enviada' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, () => {
  console.log('Servidor Express escuchando en el puerto 3002');
});
