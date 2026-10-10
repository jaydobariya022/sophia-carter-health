<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── 1. Configuration & Brevo API Setup ──────────────────────────────────────
$localConfig = file_exists(__DIR__ . '/config.php') ? include(__DIR__ . '/config.php') : [];

$config = [
    'brevo_api_key' => getenv('BREVO_API_KEY') ?: ($localConfig['brevo_api_key'] ?? ''),
    'sender_email' => getenv('BREVO_SENDER_EMAIL') ?: ($localConfig['sender_email'] ?? 'support@sophiacarterhealth.com'),
    'sender_name'  => getenv('BREVO_SENDER_NAME') ?: ($localConfig['sender_name'] ?? 'Sophia Carter Health'),
    'list_id'      => getenv('BREVO_CONTACT_LIST_ID') ? (int)getenv('BREVO_CONTACT_LIST_ID') : ($localConfig['list_id'] ?? null),
    'template_id'  => getenv('BREVO_PDF_TEMPLATE_ID') ? (int)getenv('BREVO_PDF_TEMPLATE_ID') : ($localConfig['template_id'] ?? null),
];

// Product Allowlist Catalog
$products = [
    'weight-loss-reset' => [
        'name' => 'The 7-Minute Weight Loss Reset',
        'pdfPath' => '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf'
    ],
    'womens-health-guide' => [
        'name' => "Sophia's Women's Health & Wellness Guide",
        'pdfPath' => '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf'
    ]
];

// ── 2. Read Request Body ─────────────────────────────────────────────────────
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$fullName = trim($data['full_name'] ?? '');
$email = strtolower(trim($data['email'] ?? ''));
$productId = trim($data['product_id'] ?? 'weight-loss-reset');
$marketingConsent = !empty($data['marketing_consent']);

// ── 3. Validate Inputs ──────────────────────────────────────────────────────
if (strlen($fullName) < 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please enter your full name']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please enter a valid email address']);
    exit;
}

if (!isset($products[$productId])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid product requested']);
    exit;
}

$product = $products[$productId];
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'wellnesswithsophia.cc';
$downloadUrl = $protocol . '://' . $host . $product['pdfPath'];

// ── 4. Save Customer Lead to Local Database / Storage ────────────────────────
try {
    $dbDir = __DIR__ . '/../../data';
    if (!file_exists($dbDir)) {
        @mkdir($dbDir, 0755, true);
    }
    $dbPath = $dbDir . '/leads.db';
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'website',
        product_id TEXT NOT NULL,
        pdf_requested_at TEXT NOT NULL,
        marketing_consent INTEGER NOT NULL DEFAULT 0,
        delivery_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");

    $stmt = $pdo->prepare("INSERT INTO leads (full_name, email, product_id, pdf_requested_at, marketing_consent) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$fullName, $email, $productId, date('Y-m-d H:i:s'), $marketingConsent ? 1 : 0]);
} catch (Exception $e) {
    // Continue even if SQLite write fails on restricted host
}

// ── 5. Trigger Brevo API ──────────────────────────────────────────────────────
if ($config['brevo_api_key'] && $config['brevo_api_key'] !== 'YOUR_BREVO_API_KEY_HERE') {
    $firstName = explode(' ', $fullName)[0];

    // A. Sync Contact to Brevo
    $contactPayload = [
        'email' => $email,
        'attributes' => [
            'FIRSTNAME' => $firstName,
            'FULLNAME' => $fullName,
            'OPT_IN' => $marketingConsent,
            'REQUESTED_PDF' => $product['name'],
            'SUBMISSION_DATE' => date('Y-m-d')
        ],
        'updateEnabled' => true
    ];
    if ($marketingConsent && $config['list_id']) {
        $contactPayload['listIds'] = [(int)$config['list_id']];
    }

    $ch = curl_init('https://api.brevo.com/v3/contacts');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER => [
            'api-key: ' . $config['brevo_api_key'],
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($contactPayload)
    ]);
    $contactResponse = curl_exec($ch);
    $contactHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($contactHttpCode >= 400) {
        @file_put_contents(__DIR__ . '/../../data/brevo_error.log', date('Y-m-d H:i:s') . " [Contact Error {$contactHttpCode}]: " . $contactResponse . "\n", FILE_APPEND);
    }

    // B. Send Transactional Email
    $emailPayload = [
        'to' => [['email' => $email, 'name' => $fullName]],
        'sender' => ['email' => $config['sender_email'], 'name' => $config['sender_name']],
    ];

    if ($config['template_id']) {
        $emailPayload['templateId'] = $config['template_id'];
        $emailPayload['params'] = [
            'FIRSTNAME' => $firstName,
            'PRODUCT_NAME' => $product['name'],
            'DOWNLOAD_URL' => $downloadUrl,
            'SUPPORT_EMAIL' => $config['sender_email']
        ];
    } else {
        $emailPayload['subject'] = 'Your PDF Is Ready - ' . $product['name'];
        $emailPayload['htmlContent'] = "
            <h2>Hi {$firstName},</h2>
            <p>Thank you for requesting your free copy of <strong>{$product['name']}</strong>!</p>
            <p><a href='{$downloadUrl}' style='display:inline-block; background:#f59e0b; color:#111; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:6px;'>📥 DOWNLOAD YOUR PDF NOW</a></p>
            <p>If link does not open, copy this: {$downloadUrl}</p>
        ";
    }

    $ch2 = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch2, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER => [
            'api-key: ' . $config['brevo_api_key'],
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($emailPayload)
    ]);
    $emailResponse = curl_exec($ch2);
    $emailHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);

    if ($emailHttpCode >= 400) {
        @file_put_contents(__DIR__ . '/../../data/brevo_error.log', date('Y-m-d H:i:s') . " [Email Error {$emailHttpCode}]: " . $emailResponse . "\n", FILE_APPEND);
    }
}

// ── 6. Return Success Response ───────────────────────────────────────────────
echo json_encode([
    'success' => true,
    'message' => 'Success! Check your inbox for your PDF, or download it directly below.',
    'downloadUrl' => $downloadUrl,
    'productName' => $product['name']
]);
