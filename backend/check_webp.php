<?php
echo "<h2>GD WebP Support</h2>";
echo "imagewebp function exists: " . (function_exists('imagewebp') ? 'YES' : 'NO') . "<br>";

if (function_exists('gd_info')) {
    $gd = gd_info();
    echo "GD WebP Support: " . ($gd['WebP Support'] ? 'YES' : 'NO') . "<br>";
    echo "<pre>" . print_r($gd, true) . "</pre>";
} else {
    echo "GD extension not loaded.<br>";
}

echo "<h2>Imagick WebP Support</h2>";
echo "Imagick class exists: " . (class_exists('Imagick') ? 'YES' : 'NO') . "<br>";

if (class_exists('Imagick')) {
    try {
        $formats = Imagick::queryFormats('WEBP');
        echo "Imagick WebP formats: " . implode(', ', $formats) . "<br>";
    } catch (Exception $e) {
        echo "Imagick WebP query failed: " . $e->getMessage() . "<br>";
    }
} else {
    echo "Imagick extension not loaded.<br>";
}
?>