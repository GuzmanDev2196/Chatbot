<?php
error_log(php_ini_loaded_file() . ' | ' . ini_get('curl.cainfo') . ' | ' . file_exists(ini_get('curl.cainfo')));
$config = require __DIR__ . '/config.php';
$API_BASE = rtrim($config['api_base_url'], '/');
$API_KEY  = $config['api_key'];
$ALLOWED_ORIGIN = $config['allowed_origin'];

header('Access-Control-Allow-Origin: ' . $ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET');

function eg_ws_get($url, $apiKey) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, $apiKey . ':');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    if (defined('CURLSSLOPT_NO_REVOKE')) {
        curl_setopt($ch, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NO_REVOKE);
    }

    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    // 2. Forzar resolución a IPv4 (Evita cuelgues por DNS)
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    $body = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    //curl_close($ch);
    return ['body' => $body, 'code' => $httpCode, 'contentType' => $contentType, 'error' => $error];
}

function eg_extract_lang_field($value) {
    if (is_array($value)) {
        if (isset($value['value'])) return $value['value'];
        if (isset($value[0]['value'])) return $value[0]['value'];
        return '';
    }
    return (string) $value;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

/* search: busca productos por nombre */
if ($action === 'search') {
    header('Content-Type: application/json; charset=utf-8');

    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    if ($q === '') {
        echo json_encode(['results' => []]);
        exit;
    }

    $likeFilter = '%[' . $q . ']%';
    $searchUrl = $API_BASE . '/products'
        . '?filter[name]=' . rawurlencode($likeFilter)
        . '&filter[active]=1'
        . '&display=' . rawurlencode('[id,name,price]')
        . '&output_format=JSON'
        . '&limit=0,3';

    $searchRes = eg_ws_get($searchUrl, $API_KEY);

    if ($searchRes['code'] !== 200 || !$searchRes['body']) {
        http_response_code(502);
        echo json_encode([
            'error' => 'No se pudo consultar el catálogo de productos.',
            'debug' => $searchRes['error'] ?: ('HTTP ' . $searchRes['code']),
        ]);
        exit;
    }

    $data = json_decode($searchRes['body'], true);
    $products = isset($data['products']) ? $data['products'] : [];

    $results = [];
    foreach ($products as $p) {
        $idProduct = (int) $p['id'];

        // Consultar stock disponible del producto (sin combinaciones: id_product_attribute=0)
        $stockUrl = $API_BASE . '/stock_availables'
            . '?filter[id_product]=' . $idProduct
            . '&filter[id_product_attribute]=0'
            . '&display=' . rawurlencode('[quantity]')
            . '&output_format=JSON';

        $stockRes = eg_ws_get($stockUrl, $API_KEY);
        $quantity = null;
        if ($stockRes['code'] === 200 && $stockRes['body']) {
            $stockData = json_decode($stockRes['body'], true);
            if (!empty($stockData['stock_availables'][0]['quantity'])
                || (isset($stockData['stock_availables'][0]['quantity']) && $stockData['stock_availables'][0]['quantity'] === '0')
            ) {
                $quantity = (int) $stockData['stock_availables'][0]['quantity'];
            }
        }

        $results[] = [
            'id'       => $idProduct,
            'name'     => eg_extract_lang_field(isset($p['name']) ? $p['name'] : ''),
            'price'    => isset($p['price']) ? (float) $p['price'] : null,
            'stock'    => $quantity,
            'imageUrl' => 'api-proxy.php?action=image&id=' . $idProduct,
        ];
    }

    echo json_encode(['results' => $results]);
    exit;
}

/* =======================================================
 * image sirve la imagen del producto 
 * ======================================================= */
if ($action === 'image') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        exit;
    }

    $imgUrl = $API_BASE . '/images/products/' . $id;
    $imgRes = eg_ws_get($imgUrl, $API_KEY);

    if ($imgRes['code'] !== 200 || !$imgRes['body']) {
        http_response_code(404);
        exit;
    }

    header('Content-Type: ' . ($imgRes['contentType'] ?: 'image/jpeg'));
    header('Cache-Control: public, max-age=86400');
    echo $imgRes['body'];
    exit;
}

/* =======================================================
 * Acción desconocida
 * ======================================================= */
http_response_code(400);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => 'Acción no reconocida. Usa ?action=search&q=... o ?action=image&id=...']);
