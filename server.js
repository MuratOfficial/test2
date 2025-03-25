const express = require('express');
const SMB2 = require('@marsaud/smb2');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const TEMP_DIR = path.join(__dirname, 'temp');

// Очистка папки temp при старте сервера
function clearTempFolder() {
    if (fs.existsSync(TEMP_DIR)) {
        fs.readdirSync(TEMP_DIR).forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            fs.unlinkSync(filePath);
        });
    } else {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    console.log('🧹 Папка temp очищена');
}

// Очистка старых файлов через 10 минут
function scheduleFileDeletion(filePath) {
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, err => {
                if (!err) console.log(`🗑️ Файл удален: ${filePath}`);
            });
        }
    }, 10 * 60 * 1000); // 10 минут
}

// 📥 Чтение файла (скачивание)
app.get('/download', async (req, res) => {
    const { host, share, domain, username, password, file } = req.query;

    if (!host || !share || !domain || !username || !password || !file) {
        return res.status(400).json({ error: 'Не все параметры переданы' });
    }

    const smbPath = `\\\\${host}\\${share}`;
    const remoteFile = file;
    const localFile = path.join(TEMP_DIR, remoteFile);

    const smbClient = new SMB2({ share: smbPath, domain, username, password });

    try {
        console.log(`📥 Читаем файл: ${remoteFile} с ${smbPath}`);
        const fileData = await smbClient.readFile(remoteFile);

        fs.writeFileSync(localFile, fileData);
        console.log(`✅ Файл скачан: ${localFile}`);

        res.download(localFile, remoteFile, err => {
            if (err) console.error('Ошибка отправки файла:', err);
            scheduleFileDeletion(localFile);
        });

    } catch (err) {
        console.error("❌ Ошибка чтения файла:", err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    clearTempFolder(); // Очистка папки temp при старте
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
