<?php
require_once 'vendor/phpmailer/phpmailer/src/Exception.php';
require_once 'vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once 'vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendGoDaddyEmail($toEmail, $toName, $subject, $body, $altBody = '') {
    $mail = new PHPMailer(true);

    try {
        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host       = 'localhost';    // GoDaddy shared hosting mail server
        $mail->SMTPAuth   = false;
        $mail->Port       = 25;

        // Sender Info
        $mail->setFrom('admin@coc-studentinfo.net', 'GoDaddy Email');
        $mail->addAddress($toEmail, $toName);

        // Email Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = $altBody ?: strip_tags($body);

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        error_log("Mailer Error Info: " . $mail->ErrorInfo);
        return false;
    }
}

// ✅ Test the function (COMMENTED OUT - Remove comments to test manually)
// $result = sendGoDaddyEmail(
//     'vallechristianmark@gmail.com',
//     'Mark Christian Valle',
//     'Test Email from GoDaddy SMTP',
//     '<strong>This is a test email</strong> sent from GoDaddy using PHPMailer.',
//     'This is a test email sent from GoDaddy using PHPMailer.'
// );
// 
// if ($result) {
//     echo '✅ Email sent successfully!';
// } else {
//     echo '❌ Email could not be sent.';
// }
?>