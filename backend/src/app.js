const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorMiddleware = require('./middlewares/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const ticketRoutes = require('./modules/tickets/ticket.routes');
const messageRoutes = require('./modules/messages/message.routes');
const categoryRoutes = require('./modules/categories/category.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets/:ticketId/messages', messageRoutes);
app.use('/api/categories', categoryRoutes);

app.use(errorMiddleware);

module.exports = app;
