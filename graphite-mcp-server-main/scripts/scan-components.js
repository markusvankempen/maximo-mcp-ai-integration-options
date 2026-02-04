
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../maximo-react-components-master/src');

const components = { default: {} };

function parseProps(content) {
    const props = {};
    const propTypesMatch = content.match(/\.propTypes\s*=\s*({[\s\S]*?});/);
    if (propTypesMatch) {
        const propTypesContent = propTypesMatch[1];
        const lines = propTypesContent.split('\n');
        lines.forEach(line => {
            const match = line.match(/^\s*(\w+):\s*PropTypes\.(\w+)/);
            if (match) {
                props[match[1]] = {
                    type: match[2].toLowerCase(),
                    description: "Extracted from source"
                };
            }
        });
    }
    return props;
}

function scanDir(dir, category) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip __snapshots__ etc
            if (!file.startsWith('__')) {
                // Recursive? Or just stick to known structure
            }
        } else if (file.endsWith('.js') && !file.includes('.story.') && !file.includes('.test.')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const name = path.basename(file, '.js').toLowerCase();
            // Skip index or internal files if needed

            // Simple heuristic: if it has propTypes or looks like a component
            if (content.includes('import React') || content.includes('propTypes')) {
                components.default[name] = {
                    default: {
                        description: `Component extracted from ${file}`,
                        category: category,
                        props: parseProps(content)
                    }
                };
            }
        }
    });
}

scanDir(path.join(rootDir, 'ui'), 'ui');
scanDir(path.join(rootDir, 'layout'), 'layout');

console.log(JSON.stringify(components, null, 2));
