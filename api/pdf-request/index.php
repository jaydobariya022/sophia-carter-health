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

// If not defined, also inspect root .env if present
if (empty($localConfig['brevo_api_key']) && file_exists(__DIR__ . '/../../.env')) {
    $envLines = @file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($envLines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || $trimmed[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            $k = trim($k);
            $v = trim($v);
            if (!getenv($k)) {
                putenv("{$k}={$v}");
                $_ENV[$k] = $v;
            }
        }
    }
}

$config = [
    'brevo_api_key' => getenv('BREVO_API_KEY') ?: ($localConfig['brevo_api_key'] ?? ''),
    'sender_email' => getenv('BREVO_SENDER_EMAIL') ?: ($localConfig['sender_email'] ?? 'support@wellnesswithsophia.cc'),
    'sender_name'  => getenv('BREVO_SENDER_NAME') ?: ($localConfig['sender_name'] ?? 'Sophia Carter'),
    'list_id'      => getenv('BREVO_CONTACT_LIST_ID') ? (int)getenv('BREVO_CONTACT_LIST_ID') : ($localConfig['list_id'] ?? 7),
    'template_id'  => getenv('BREVO_PDF_TEMPLATE_ID') ? (int)getenv('BREVO_PDF_TEMPLATE_ID') : ($localConfig['template_id'] ?? null),
];

// Product Allowlist Catalog
$products = [
    'weight-loss-reset' => [
        'name' => 'The Complete Women Over 40 Wellness & Weight Loss Bundle (3 Free E-Books)',
        'pdfPath' => '/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf',
        'books' => [
            [
                'name' => "Why the Scale Won't Budge After 40",
                'subtitle' => "7 gentle, realistic habits that work with your changing body",
                'image' => "/weight-loss-book/assets/images/book-why-scale-wont-budge.jpg",
                'path' => '/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf'
            ],
            [
                'name' => "Sunday Prep, Easy Week",
                'subtitle' => "Healthy meal prep & 12 simple morning drinks for women over 40",
                'image' => "/weight-loss-book/assets/images/book-sunday-prep-easy-week.jpg",
                'path' => '/weight-loss-book/assets/images/Sunday-Prep-Easy-Week.pdf'
            ],
            [
                'name' => "The 7-Minute Weight Loss Reset",
                'subtitle' => "Simple morning habits, smart food choices & daily rituals",
                'image' => "/weight-loss-book/assets/images/book-7-minute-weight-loss-reset.jpg",
                'path' => '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf'
            ]
        ]
    ],
    'women-40-plus-bundle' => [
        'name' => 'The Complete Women Over 40 Wellness & Weight Loss Bundle (3 Free E-Books)',
        'pdfPath' => '/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf',
        'books' => [
            [
                'name' => "Why the Scale Won't Budge After 40",
                'subtitle' => "7 gentle, realistic habits that work with your changing body",
                'image' => "/weight-loss-book/assets/images/book-why-scale-wont-budge.jpg",
                'path' => '/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf'
            ],
            [
                'name' => "Sunday Prep, Easy Week",
                'subtitle' => "Healthy meal prep & 12 simple morning drinks for women over 40",
                'image' => "/weight-loss-book/assets/images/book-sunday-prep-easy-week.jpg",
                'path' => '/weight-loss-book/assets/images/Sunday-Prep-Easy-Week.pdf'
            ],
            [
                'name' => "The 7-Minute Weight Loss Reset",
                'subtitle' => "Simple morning habits, smart food choices & daily rituals",
                'image' => "/weight-loss-book/assets/images/book-7-minute-weight-loss-reset.jpg",
                'path' => '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf'
            ]
        ]
    ],
    'womens-health-guide' => [
        'name' => "Sophia's Women's Health & Wellness Guide",
        'pdfPath' => '/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf'
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
    if (!empty($config['list_id'])) {
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
        $emailPayload['subject'] = '🎁 Your 3 Free E-Books Are Ready! (Instant PDF Download)';
        if (!empty($product['books'])) {
            $booksCards = '';
            foreach ($product['books'] as $idx => $b) {
                $bUrl = $protocol . '://' . $host . $b['path'];
                $bImg = $protocol . '://' . $host . ($b['image'] ?? '');
                $bNum = $idx + 1;
                $booksCards .= "
                <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:18px;box-shadow:0 4px 10px rgba(0,0,0,0.04);'>
                  <tr>
                    <td style='padding:18px;'>
                      <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%'>
                        <tr>
                          <td width='100' valign='top' style='padding-right:16px;'>
                            <a href='{$bUrl}' target='_blank'>
                              <img src='{$bImg}' alt='{$b['name']}' width='100' style='display:block;border-radius:6px;width:100%;max-width:100px;height:auto;border:1px solid #e2e8f0;'>
                            </a>
                          </td>
                          <td valign='middle'>
                            <span style='display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 8px;border-radius:10px;text-transform:uppercase;margin-bottom:6px;'>
                              Book #{$bNum}
                            </span>
                            <h3 style='margin:0 0 6px 0;color:#0f172a;font-size:16px;font-weight:800;'>
                              {$b['name']}
                            </h3>
                            <p style='margin:0 0 12px 0;color:#64748b;font-size:13px;line-height:1.4;'>
                              {$b['subtitle']}
                            </p>
                            <a href='{$bUrl}' target='_blank' style='display:inline-block;background:#1b4332;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:6px;'>
                              📥 Download Book #{$bNum} (PDF)
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>";
            }

            $emailPayload['htmlContent'] = "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>Your 3 Free E-Books Are Ready</title>
</head>
<body style=\"margin:0;padding:0;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;\">
  <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color:#0b1120;padding:30px 15px;'>
    <tr>
      <td align='center'>
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width:620px;background-color:#f8fafc;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);'>
          
          <tr>
            <td style='background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 30px;text-align:center;border-bottom:3px solid #f59e0b;'>
              <span style='display:inline-block;background:rgba(245,158,11,0.2);color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;border:1px solid rgba(245,158,11,0.4);'>
                ⚡ Instant Digital Download Bundle
              </span>
              <h1 style='margin:6px 0 0 0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;'>
                Sophia Carter <span style='color:#f59e0b;'>Health</span>
              </h1>
            </td>
          </tr>

          <tr>
            <td align='center' style='background:#ffffff;padding:20px 24px 0 24px;'>
              <img src='{$protocol}://{$host}/weight-loss-book/assets/images/bundle-collection.jpg' alt='Free 3-Book Bundle' width='560' style='display:block;border-radius:10px;width:100%;max-width:560px;height:auto;box-shadow:0 8px 24px rgba(0,0,0,0.08);'>
            </td>
          </tr>

          <tr>
            <td style='padding:28px 30px 20px 30px;'>
              <h2 style='margin:0 0 12px 0;color:#0f172a;font-size:22px;font-weight:800;line-height:1.3;'>
                Hi {$firstName}, Your 3 Free E-Books Are Ready! 🎉
              </h2>
              <p style='margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;'>
                Thank you for requesting the complete <strong>Women Over 40 Wellness & Weight Loss Bundle</strong>!
              </p>
              <p style='margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;'>
                Click each button below to download your digital guides immediately:
              </p>

              {$booksCards}

              <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-top:10px;margin-bottom:24px;'>
                <tr>
                  <td>
                    <p style='margin:0 0 6px 0;color:#334155;font-size:15px;line-height:1.6;'>
                      Here's to your renewed health, confidence, and vibrant energy!
                    </p>
                    <p style='margin:0 0 2px 0;color:#0f172a;font-size:16px;font-weight:800;'>
                      Sophia Carter
                    </p>
                    <p style='margin:0;color:#64748b;font-size:13px;'>
                      Holistic Health & Wellness Specialist • Sophia Carter Health
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style='background:#0f172a;padding:24px 30px;text-align:center;border-top:1px solid #1e293b;'>
              <p style='margin:0 0 10px 0;color:#94a3b8;font-size:12px;line-height:1.5;'>
                You received this email because you requested the 3 Free E-Books on <a href='https://wellnesswithsophia.cc' style='color:#f59e0b;text-decoration:none;'>wellnesswithsophia.cc</a>.
              </p>
              <p style='margin:0;color:#64748b;font-size:11px;'>
                &copy; 2026 Sophia Carter Health. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        } else {
            $emailPayload['htmlContent'] = "
                <h2>Hi {$firstName},</h2>
                <p>Thank you for requesting your free copy of <strong>{$product['name']}</strong>!</p>
                <p><a href='{$downloadUrl}' style='display:inline-block; background:#f59e0b; color:#111; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:6px;'>📥 DOWNLOAD YOUR PDF NOW</a></p>
                <p>If link does not open, copy this: {$downloadUrl}</p>
            ";
        }
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
    'message' => 'Success! Check your inbox for your 3 free eBooks, or download them directly below.',
    'downloadUrl' => $downloadUrl,
    'productName' => $product['name'],
    'books' => $product['books'] ?? []
]);
