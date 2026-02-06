#!/usr/bin/env npx tsx
/**
 * Seed Script
 * 
 * Generates realistic test data for taking screenshots of the application.
 * Uses the standard authenticated API endpoints.
 * 
 * Usage:
 *   npm run seed
 * 
 * Prerequisites:
 *   1. Labour worker running locally: npm run dev
 *   2. Log in to the app in your browser and copy your Clerk JWT token
 */

import * as readline from 'readline';

const CONFIG = {
    labourServiceUrl: process.env.LABOUR_SERVICE_URL || 'http://localhost:8000',
    labourName: "Baby's Journey",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    firstLabour: true,
};

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
};

function log(message: string, color: string = colors.reset): void {
    console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string): void {
    log(`\n▶ ${step}`, colors.blue);
}

function logSuccess(message: string): void {
    log(`  ✓ ${message}`, colors.green);
}

function logError(message: string): void {
    log(`  ✗ ${message}`, colors.red);
}

function logInfo(message: string): void {
    log(`  ℹ ${message}`, colors.dim);
}

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function apiRequest(
    endpoint: string,
    method: 'GET' | 'POST',
    authToken: string,
    body?: unknown
): Promise<Response> {
    const url = `${CONFIG.labourServiceUrl}${endpoint}`;
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return fetch(url, options);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createLabour(authToken: string): Promise<string> {
    logStep('Creating labour');

    const response = await apiRequest('/api/v1/labour/plan', 'POST', authToken, {
        first_labour: CONFIG.firstLabour,
        due_date: CONFIG.dueDate.toISOString(),
        labour_name: CONFIG.labourName,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create labour: ${response.status} ${text}`);
    }

    const data = await response.json();
    logSuccess(`Labour created: ${data.labour_id}`);
    return data.labour_id;
}

async function beginLabour(labourId: string, authToken: string): Promise<void> {
    logStep('Beginning labour');

    const response = await apiRequest('/api/v1/command', 'POST', authToken, {
        type: 'Labour',
        payload: {
            type: 'BeginLabour',
            payload: { labour_id: labourId },
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to begin labour: ${await response.text()}`);
    }
    logSuccess('Labour begun');
}

interface Contraction {
    startTime: Date;
    endTime: Date;
    intensity: number;
}

function generateContractions(): Contraction[] {
    const now = Date.now();
    const contractions: Contraction[] = [];

    const phases = [
        { start: 18, end: 12, interval: [15, 30], duration: [30, 45], intensity: [1, 3] },
        // Sleep break: 12h to 6h - no contractions
        { start: 6, end: 2, interval: [5, 8], duration: [45, 60], intensity: [4, 6] },
        { start: 2, end: 0, interval: [2, 3], duration: [60, 90], intensity: [7, 9] },
    ];

    for (const phase of phases) {
        const phaseStart = now - phase.start * 60 * 60 * 1000;
        const phaseEnd = now - phase.end * 60 * 60 * 1000;
        let currentTime = phaseStart;

        while (currentTime < phaseEnd) {
            const intervalMs = randomInRange(phase.interval[0], phase.interval[1]) * 60 * 1000;
            currentTime += intervalMs;
            if (currentTime >= phaseEnd) break;

            const durationMs = randomInRange(phase.duration[0], phase.duration[1]) * 1000;
            contractions.push({
                startTime: new Date(currentTime),
                endTime: new Date(currentTime + durationMs),
                intensity: randomInRange(phase.intensity[0], phase.intensity[1]),
            });
            currentTime += durationMs;
        }
    }

    return contractions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

async function addContractions(labourId: string, authToken: string): Promise<void> {
    const contractions = generateContractions();
    logStep(`Adding ${contractions.length} contractions`);

    let added = 0;
    for (const c of contractions) {
        // Start
        const contractionId = crypto.randomUUID();
        const startRes = await apiRequest('/api/v1/command', 'POST', authToken, {
            type: 'Contraction',
            payload: {
                type: 'StartContraction',
                payload: {
                    labour_id: labourId,
                    contraction_id: contractionId,
                    start_time: c.startTime.toISOString(),
                },
            },
        });

        if (!startRes.ok) {
            logError(`Start failed: ${await startRes.text()}`);
            continue;
        }

        // End
        const endRes = await apiRequest('/api/v1/command', 'POST', authToken, {
            type: 'Contraction',
            payload: {
                type: 'EndContraction',
                payload: {
                    labour_id: labourId,
                    contraction_id: contractionId,
                    end_time: c.endTime.toISOString(),
                    intensity: c.intensity,
                },
            },
        });

        if (!endRes.ok) {
            logError(`End failed: ${await endRes.text()}`);
            continue;
        }

        added++;
        if (added % 10 === 0) logInfo(`Progress: ${added}/${contractions.length}`);
        await sleep(30);
    }

    logSuccess(`Added ${added} contractions`);
}

// ============================================================
// Subscribers
// ============================================================

async function getSubscriptionToken(labourId: string, authToken: string): Promise<string> {
    logStep('Getting subscription token');

    const response = await apiRequest('/api/v1/query', 'POST', authToken, {
        type: 'Subscription',
        payload: {
            type: 'GetSubscriptionToken',
            payload: { labour_id: labourId },
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get token: ${await response.text()}`);
    }

    const data = await response.json();
    logSuccess(`Token: ${data.token.slice(0, 8)}...`);
    return data.token;
}

interface SubscriberSpec {
    name: string;
    role: string;
    approve: boolean;
}

const SUBSCRIBERS: SubscriberSpec[] = [
    { name: 'James', role: 'BIRTH_PARTNER', approve: true },
    { name: 'Sarah (Mum)', role: 'SUPPORT_PERSON', approve: true },
    { name: 'Auntie Claire', role: 'LOVED_ONE', approve: true },
    { name: 'Cousin Emma', role: 'LOVED_ONE', approve: false }, // Pending
];

async function addSubscribers(labourId: string, token: string, authToken: string): Promise<void> {
    logStep(`Adding ${SUBSCRIBERS.length} subscribers`);

    for (const sub of SUBSCRIBERS) {
        // Request access
        const reqRes = await apiRequest('/api/v1/command', 'POST', authToken, {
            type: 'Subscriber',
            payload: {
                type: 'RequestAccess',
                payload: { labour_id: labourId, token, subscriber_name: sub.name },
            },
        });

        if (!reqRes.ok) {
            logError(`Request failed for ${sub.name}: ${await reqRes.text()}`);
            continue;
        }

        if (!sub.approve) {
            logSuccess(`${sub.name} (PENDING)`);
            continue;
        }

        // Get subscription ID
        await sleep(100);
        const listRes = await apiRequest('/api/v1/query', 'POST', authToken, {
            type: 'Subscription',
            payload: {
                type: 'GetLabourSubscriptions',
                payload: { labour_id: labourId },
            },
        });

        if (!listRes.ok) continue;
        const listData = await listRes.json();
        const subscription = listData.data?.find((s: any) => s.subscriber_name === sub.name);
        if (!subscription) continue;

        // Approve
        await apiRequest('/api/v1/command', 'POST', authToken, {
            type: 'Subscription',
            payload: {
                type: 'ApproveSubscriber',
                payload: { labour_id: labourId, subscription_id: subscription.subscription_id },
            },
        });

        // Update role if needed
        if (sub.role !== 'LOVED_ONE') {
            await sleep(50);
            await apiRequest('/api/v1/command', 'POST', authToken, {
                type: 'Subscription',
                payload: {
                    type: 'UpdateSubscriberRole',
                    payload: { labour_id: labourId, subscription_id: subscription.subscription_id, role: sub.role },
                },
            });
        }

        logSuccess(`${sub.name} (${sub.role})`);
    }
}

// ============================================================
// Labour Updates
// ============================================================

const UPDATES = [
    { type: 'STATUS_UPDATE', message: 'Think things might be starting. Woke up with cramps about an hour ago. Trying to go back to sleep for now.' },
    { type: 'STATUS_UPDATE', message: 'Okay definitely happening. They are coming every 15 mins or so.' },
    { type: 'STATUS_UPDATE', message: 'James is timing them now. They are getting a bit stronger but still manageable. Just breathing through them.' },
    { type: 'STATUS_UPDATE', message: 'Finding it harder to talk through them now. Might get in the bath for a bit to see if that helps.' },
    { type: 'ANNOUNCEMENT', message: 'Right, they are about 4 mins apart and pretty intense. Called the birth centre and they said to come in. Leaving in 10.' },
    { type: 'STATUS_UPDATE', message: 'We are here and in a room. It is lovely and calm. Midwife is checking me now.' },
    { type: 'STATUS_UPDATE', message: '4cm dilated so they are letting us stay. Getting the pool filled up. James is being amazing with the snacks.' },
    { type: 'ANNOUNCEMENT', message: 'Going quiet for a bit now to focus. Don not worry if you do not hear from us for a while. Love you all x' },
];

async function addLabourUpdates(labourId: string, authToken: string): Promise<void> {
    logStep(`Adding ${UPDATES.length} labour updates`);

    for (const update of UPDATES) {
        const res = await apiRequest('/api/v1/command', 'POST', authToken, {
            type: 'LabourUpdate',
            payload: {
                type: 'PostLabourUpdate',
                payload: {
                    labour_id: labourId,
                    labour_update_type: update.type,
                    message: update.message,
                },
            },
        });

        if (!res.ok) {
            logError(`Update failed: ${await res.text()}`);
            continue;
        }
        logSuccess(`${update.type}: "${update.message.slice(0, 35)}..."`);
        await sleep(50);
    }
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    log('  Fern Labour - Seed Script', colors.blue);
    console.log('='.repeat(60));
    log('\nGenerates realistic test data for screenshots.\n', colors.dim);

    let authToken = process.env.CLERK_AUTH_TOKEN || '';

    if (!authToken) {
        log('You need a Clerk JWT token from your logged-in browser session.', colors.yellow);
        log('DevTools → Network → any API request → Authorization header\n', colors.dim);
        authToken = await prompt('Paste JWT token (without "Bearer "): ');
    }

    if (!authToken) {
        logError('Token required.');
        process.exit(1);
    }

    try {
        const labourId = await createLabour(authToken);
        await beginLabour(labourId, authToken);
        await addContractions(labourId, authToken);
        const token = await getSubscriptionToken(labourId, authToken);
        await addSubscribers(labourId, token, authToken);
        await addLabourUpdates(labourId, authToken);

        console.log('\n' + '='.repeat(60));
        log('  ✓ Seed data created!', colors.green);
        console.log('='.repeat(60));
        log(`\nLabour ID: ${labourId}`, colors.blue);
        log('Open the app to see your test data.\n', colors.dim);
    } catch (error) {
        logError(`Failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();
