<?php
/**
 * Guarda los conteos en data/clicks.json, con detalle por día.
 *
 * POST                         -> registra un clic  {type, target}
 * GET ?action=json             -> estadísticas en JSON
 * GET ?action=csv              -> totales por enlace (CSV)
 * GET ?action=csv_daily        -> clics por día y enlace (CSV)

 */

date_default_timezone_set('America/Santiago');

const MAX_ENTRIES = 500;   // tope de enlaces distintos
const KEEP_DAYS   = 400;   // días de historial por enlace
const ALLOWED     = ['mail', 'whatsapp', 'phone', 'web'];

$config    = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$ADMIN_KEY = getenv('EG_ADMIN_KEY') ?: ($config['admin_key'] ?? '');

$dir  = __DIR__ . '/data';
$file = $dir . '/clicks.json';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
    file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
}

function read_all($file) {
    if (!file_exists($file)) return [];
    $d = json_decode(file_get_contents($file), true);
    return is_array($d) ? $d : [];
}

/* Consulta / descarga (protegida con clave en header) */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $key = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
    if ($ADMIN_KEY === '' || !hash_equals($ADMIN_KEY, $key)) {
        http_response_code(403);
        exit('Acceso denegado');
    }

    $data = read_all($file);
    uasort($data, fn($a, $b) => $b['clicks'] <=> $a['clicks']);
    $action = $_GET['action'] ?? 'json';

    if ($action === 'json') {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $safe = function ($v) {           // evita inyección de fórmulas en Excel
        $v = (string)$v;
        return preg_match('/^[=@+\-]/', $v) ? "'" . $v : $v;
    };
    $daily = ($action === 'csv_daily');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="clics-chatbot' . ($daily ? '-por-dia-' : '-') . date('Y-m-d') . '.csv"');
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');
    if ($daily) {
        fputcsv($out, ['fecha', 'tipo', 'destino', 'clics'], ';');
        foreach ($data as $row) {
            $days = $row['days'] ?? [];
            ksort($days);
            foreach ($days as $day => $n) {
                fputcsv($out, [$day, $row['type'], $safe($row['target']), $n], ';');
            }
        }
    } else {
        fputcsv($out, ['tipo', 'destino', 'clics'], ';');
        foreach ($data as $row) {
            fputcsv($out, [$row['type'], $safe($row['target']), $row['clicks']], ';');
        }
    }
    fclose($out);
    exit;
}

/* Registro de clic */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$in     = json_decode(file_get_contents('php://input'), true);
$type   = is_array($in) ? ($in['type'] ?? '') : '';
$target = is_array($in) ? trim((string)($in['target'] ?? '')) : '';

if (!in_array($type, ALLOWED, true) || $target === '' || strlen($target) > 200) {
    http_response_code(400); exit;
}

$id = $type . '|' . $target;
$fp = fopen($file, 'c+');
if (!$fp || !flock($fp, LOCK_EX)) { http_response_code(500); exit; }

$raw  = stream_get_contents($fp);
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) $data = [];

$today = date('Y-m-d');

if (isset($data[$id])) {
    $data[$id]['clicks']++;
} elseif (count($data) < MAX_ENTRIES) {
    $data[$id] = ['type' => $type, 'target' => $target, 'clicks' => 1, 'days' => []];
}

if (isset($data[$id])) {
    $days = $data[$id]['days'] ?? [];
    $days[$today] = ($days[$today] ?? 0) + 1;
    ksort($days);
    $data[$id]['days'] = array_slice($days, -KEEP_DAYS, null, true);
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

http_response_code(204);