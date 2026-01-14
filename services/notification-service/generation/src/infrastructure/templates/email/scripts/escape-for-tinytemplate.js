#!/usr/bin/env node
/**
 * Post-processes MJML-compiled HTML files to escape curly braces for TinyTemplate.
 * 
 * TinyTemplate treats { as the start of a template variable, so we need to escape
 * literal curly braces (like in CSS) as \{ while preserving actual template variables.
 * 
 * Template variables follow the pattern: {variable_name}
 * where variable_name contains only alphanumeric characters and underscores.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, '..', 'build');

const TEMPLATE_VARIABLES = [
    'birthing_person_name',
    'birthing_person_first_name',
    'subscriber_name',
    'subscriber_first_name',
    'link',
    'announcement',
    'update',
    'name',
    'email',
    'user_id',
    'message',
    'button_text',
];

function escapeForTinyTemplate(content) {
    let escaped = content.replace(/\{/g, '\\{');

    for (const variable of TEMPLATE_VARIABLES) {
        const escapedPattern = new RegExp(`\\\\\\{${variable}\\}`, 'g');
        escaped = escaped.replace(escapedPattern, `{${variable}}`);
    }

    return escaped;
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const processed = escapeForTinyTemplate(content);
    fs.writeFileSync(filePath, processed, 'utf8');
    console.log(`Processed: ${path.basename(filePath)}`);
}

function main() {
    const htmlFiles = fs.readdirSync(BUILD_DIR)
        .filter(file => file.endsWith('.html'))
        .map(file => path.join(BUILD_DIR, file));

    console.log(`Processing ${htmlFiles.length} HTML files for TinyTemplate compatibility...\n`);

    for (const file of htmlFiles) {
        processFile(file);
    }

    console.log('\nDone! All curly braces escaped for TinyTemplate.');
}

main();
