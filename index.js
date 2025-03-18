const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Serve static files (like the logo)
app.use(express.static(__dirname));

// Get API URL from environment variables (injected via Kubernetes secret)
const apiUrl = process.env.API_URL || 'http://localhost:4000'; // Fallback URL

app.get('/', async (req, res) => {
    try {
        if (!apiUrl) {
            throw new Error('API URL is not defined');
        }
        
        const response = await axios.get(`${apiUrl}/messages`);
        const messages = response.data;

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Messages</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    header, footer { background: #007bff; color: white; padding: 1rem; text-align: center; }
                    header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; position: fixed; top: 0; left: 0; width: 100%; }
                    main { padding: 2rem; padding-top: 60; padding-bottom: 60px; overflow: auto; margin-top: 20px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    table, th, td { border: 1px solid #ccc; }
                    th, td { padding: 0.5rem; text-align: left; }
                    th { background: #007bff; color: white; }
                    button { padding: 0.5rem 1rem; background: #28a745; color: white; border: none; cursor: pointer; margin-right: 40px; }
                    button:hover { background: #218838; }
                    footer { display: flex; align-items: center; justify-content: center; height: 60px; position: fixed; bottom: 0; left: 0; width: 100%; }
                </style>
                <script>
                    setInterval(() => {
                        location.reload();
                    }, 20000); // Auto-refresh every 20 seconds
                </script>
            </head>
            <body>
                <header>
                    <img src="/entando_logo.png" alt="Logo" style="height: 80px;width: 80px;vertical-align:middle">
                    <h1>Message Viewer</h1>
                    <button onclick="location.reload()">Refresh Messages</button>
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

app.listen(port, () => {
    console.log(`Frontend app listening at http://localhost:${port}`);
});
