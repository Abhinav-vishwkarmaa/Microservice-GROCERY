import express from 'express';
import cors from 'cors';
import { verifyToken } from './middlewere/userAuth.js';
// Routes
import userRoutes from './routes/user.routes.js';
import addressRoutes from './routes/address.routes.js';
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(verifyToken);
// Mount Routes
app.use('/api/user', userRoutes);       // user profile, auth, delete account
app.use('/api/user/address', addressRoutes); // address CRUD

const PORT = process.env.PORT || 8001

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
export default app;
