<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'),
    ]),
    // Restreint aux sous-domaines Vercel du projet (contenant "cotis" dans le nom)
    'allowed_origins_patterns' => [
        '/^https:\/\/[a-z0-9-]*cotis[a-z0-9-]*\.vercel\.app$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];

 