<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mahonys Packing API</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
        h1 { color: #1a3a6b; }
        code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; }
        a { color: #2563eb; }
    </style>
</head>
<body>
    <h1>Mahonys Packing System – Backend</h1>
    <p>Laravel API + PostgreSQL backend for the packing system.</p>
    <p><strong>API base:</strong> <code>{{ url('/api') }}</code></p>
    <p>Use the Next.js frontend or call endpoints such as:</p>
    <ul>
        <li><code>GET /api/app-state</code> – Bootstrap all reference data</li>
        <li><code>GET /api/customers</code> – List customers</li>
        <li><code>GET /api/tickets</code> – List tickets</li>
        <li><code>GET /api/packs</code> – List packs</li>
    </ul>
    <p>See <code>routes/api.php</code> for all routes.</p>
</body>
</html>
