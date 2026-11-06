const fs = require('fs');
const path = require('path');

async function deploy() {
    const files = {};
    const base64_files = {};
    const distDir = './dist';
    
    // Add dist files recursively
    const walk = (dir, relDir = '') => {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.lstatSync(fullPath).isDirectory()) {
                walk(fullPath, path.join(relDir, file));
            } else {
                const relPath = path.join(relDir, file);
                if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html') || file.endsWith('.json')) {
                    files[relPath] = fs.readFileSync(fullPath, 'utf8');
                } else {
                    base64_files[relPath] = fs.readFileSync(fullPath).toString('base64');
                }
            }
        });
    };
    walk(distDir);

    // Add API files recursively
    const apiDir = './api';
    if (fs.existsSync(apiDir)) {
        const walkApi = (dir, relDir = 'api') => {
            fs.readdirSync(dir).forEach(file => {
                const fullPath = path.join(dir, file);
                if (fs.lstatSync(fullPath).isDirectory()) {
                    walkApi(fullPath, path.join(relDir, file));
                } else {
                    const relPath = path.join(relDir, file);
                    files[relPath] = fs.readFileSync(fullPath, 'utf8');
                }
            });
        };
        walkApi(apiDir);
    }

    if (fs.existsSync('./files.php')) files['files.php'] = fs.readFileSync('./files.php', 'utf8');

    try {
        const response = await fetch('https://moanaministries.org/trivea/deploy.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Deploy-Key': 'moana_trivea_sync_2026_secure'
            },
            body: JSON.stringify({ files, base64_files })
        });
        const result = await response.json();
        console.log(result);
    } catch (e) {
        console.error(e);
    }
}
deploy();
