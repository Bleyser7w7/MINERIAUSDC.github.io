const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost/tetris_game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthdate: { type: Date, required: true },
    profileImage: { type: String, default: 'perfil.png' },
    balance: { type: Number, default: 0 },
    miningStreak: { type: Number, default: 0 },
    lastMiningDate: { type: Date },
    totalMined: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Ruta de registro
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, birthdate, profileImage } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: 'El email o nombre de usuario ya está registrado' 
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario
        const user = new User({
            username,
            email,
            password: hashedPassword,
            birthdate,
            profileImage
        });

        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id },
            'tu_clave_secreta',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta de login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user._id },
            'tu_clave_secreta',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Middleware de autenticación
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'tu_clave_secreta');
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Por favor autentíquese' });
    }
};

// Ruta protegida de ejemplo
app.get('/profile', auth, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            balance: req.user.balance
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 