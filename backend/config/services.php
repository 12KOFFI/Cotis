<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],


    'geniuspay' => [
        'base_url'       => env('GENIUSPAY_BASE_URL', 'https://pay.genius.ci/api/v1'),
        'key'            => env('GENIUSPAY_API_KEY'),
        'secret'         => env('GENIUSPAY_API_SECRET'),
        'webhook_secret' => env('GENIUSPAY_WEBHOOK_SECRET'),
        'sandbox'        => env('GENIUSPAY_SANDBOX', true),
    ],

];
