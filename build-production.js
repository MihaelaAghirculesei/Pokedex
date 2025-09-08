const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function buildProduction() {
    const startTime = Date.now();
    let totalSavings = 0;
    
    try {
        await execAsync('node compress-icons.js');
        totalSavings += 849;
    } catch (error) {
    }
    
    try {
        await execAsync('node minify-assets.js');
        totalSavings += 21;
    } catch (error) {
    }
    
    if (!fs.existsSync('./sw.js')) {
        return;
    }
    
    let currentSize = 0;
    
    if (fs.existsSync('./imgs/icons/')) {
        const iconFiles = fs.readdirSync('./imgs/icons/').filter(f => f.endsWith('.png'));
        const iconSize = iconFiles.reduce((total, file) => {
            return total + fs.statSync(path.join('./imgs/icons/', file)).size;
        }, 0);
        currentSize += iconSize;
    }
    
    const cssFiles = ['./shared.min.css', './style.min.css', './impressum.min.css'];
    const cssSize = cssFiles.reduce((total, file) => {
        if (fs.existsSync(file)) {
            return total + fs.statSync(file).size;
        }
        return total;
    }, 0);
    currentSize += cssSize;
    
    const jsFiles = ['./script.min.js', './scripts/templates.min.js'];
    const jsSize = jsFiles.reduce((total, file) => {
        if (fs.existsSync(file)) {
            return total + fs.statSync(file).size;
        }
        return total;
    }, 0);
    currentSize += jsSize;
    
    const swSize = fs.existsSync('./sw.js') ? fs.statSync('./sw.js').size : 0;
    currentSize += swSize;
}

buildProduction().catch(console.error);