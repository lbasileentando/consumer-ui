const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const axios = require('axios');

const app = express();
const port = 3000;

// Load environment variables for Keycloak
const keycloakConfig = {
    realm: process.env.KEYCLOAK_REALM || 'demo',
    "auth-server-url": process.env.KEYCLOAK_URL || 'http://37.59.31.126',
    "ssl-required": "none",
    resource: process.env.KEYCLOAK_CLIENT_ID || 'demo-client',
    "public-client": false,  // Mark as confidential
    "credentials": {
        "secret": process.env.KEYCLOAK_CLIENT_SECRET || 'rXxJLhiNx6Tm8ueJQffb6peojLveucxs'
    }
};

// Session store for Keycloak
const memoryStore = new session.MemoryStore();

app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

// Keycloak instance
const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

app.use(keycloak.middleware());

// Serve static files (like the logo)
app.use(express.static(__dirname));

// Get API URL from environment variables (injected via Kubernetes secret)
const apiUrl = process.env.API_URL || 'http://localhost:5001'; // Fallback URL

// Protect the main route with Keycloak authentication
app.get('/', keycloak.protect(), async (req, res) => {
    try {
        const response = await axios.get(`${apiUrl}/messages`);
        const messages = response.data;

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Messages</title>
                <script>
                    setInterval(() => { location.reload(); }, 20000);
                </script>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    header, footer { background: #007bff; color: white; padding: 1rem; text-align: center; }
                    header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; position: fixed; top: 0; left: 0; width: 100%; }
                    main { padding: 2rem; padding-top: 80px; padding-bottom: 60px; overflow: auto; margin-top: 20px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    table, th, td { border: 1px solid #ccc; }
                    th, td { padding: 0.5rem; text-align: left; }
                    th { background: #007bff; color: white; }
                    button { padding: 0.5rem 1rem; background: #28a745; color: white; border: none; cursor: pointer; margin-right: 40px; }
                    button:hover { background: #218838; }
                    footer { display: flex; align-items: center; justify-content: center; height: 60px; position: fixed; bottom: 0; left: 0; width: 100%; }
                </style>
            </head>
            <body>
                <header>
                    <img src="/entando_logo.png" alt="Logo" style="height: 80px;width: 80px;vertical-align:middle">
                    <h1>Message Viewer</h1>
                    <button onclick="location.reload()">Refresh Messages</button>
                    <a href="/logout" style="color:white; text-decoration:none; margin-left:20px;margin-right:20px">Logout</a>
                </header>
                <main>
                    <h2>Messages</h2>
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Content</th>
                            <th>Received At</th>
                        </tr>
                        ${messages.map(msg => {
                            const parsedMessage = JSON.parse(msg.message);
                            return `
                            <tr>
                                <td>${parsedMessage.id}</td>
                                <td>${parsedMessage.content}</td>
                                <td>${new Date(msg.receivedAt).toLocaleString()}</td>
                            </tr>
                            `;
                        }).join('')}
                    </table>
                </main>
                <footer>
                    <p>&copy; 2025 Entando Operations. All rights reserved.</p>
                    <div class="box">
                        <img src="/operations.png" style="height: 40px;width: 40px;margin-left: 10px">
                    </div>
                </footer>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).send(`<h1>Error fetching messages</h1><p>${error.message}</p>`);
    }
});

// Logout route
app.get('/logout', keycloak.protect(), (req, res) => {
    res.redirect(`${keycloakConfig["auth-server-url"]}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout?redirect_uri=http://localhost:${port}`);
});

app.listen(port, () => {
    console.log(`Frontend app listening at http://localhost:${port}`);
});
