/**
 * Google Indexing API 자동화 스크립트
 *
 * 사용법:
 *   node scripts/request-indexing.js              # 모든 포스트 색인 요청
 *   node scripts/request-indexing.js --url URL    # 특정 URL만 색인 요청
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// 설정
const SITE_URL = 'https://minyoungci.github.io';
const KEY_FILE = path.join(__dirname, '..', 'google-indexing-key.json');

// Supabase 설정
const SUPABASE_URL = 'https://koumvvrjetfbdqmhawyo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdW12dnJqZXRmYmRxbWhhd3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQ3NDcsImV4cCI6MjA4MTM1MDc0N30.SFw9XA2mbc4PVQTwa-iDPGK6Z_NbKEKabe6LhaAbvSU';

async function getAuthClient() {
    if (!fs.existsSync(KEY_FILE)) {
        console.error('❌ google-indexing-key.json 파일을 찾을 수 없습니다.');
        console.error('   프로젝트 루트에 JSON 키 파일을 저장하세요.');
        process.exit(1);
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    return auth.getClient();
}

async function requestIndexing(authClient, url) {
    const indexing = google.indexing({ version: 'v3', auth: authClient });

    try {
        const response = await indexing.urlNotifications.publish({
            requestBody: {
                url: url,
                type: 'URL_UPDATED',
            },
        });

        console.log(`✅ ${url}`);
        console.log(`   응답: ${JSON.stringify(response.data)}`);
        return { success: true, url, data: response.data };
    } catch (error) {
        console.error(`❌ ${url}`);
        console.error(`   에러: ${error.message}`);
        return { success: false, url, error: error.message };
    }
}

async function getAllPostUrls() {
    // Supabase에서 모든 포스트 가져오기
    if (!SUPABASE_KEY) {
        console.log('⚠️  Supabase 키가 없어서 기본 URL만 사용합니다.');
        return [
            `${SITE_URL}/`,
            `${SITE_URL}/section/Trend/`,
            `${SITE_URL}/section/Research/`,
            `${SITE_URL}/section/Life/`,
        ];
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
        });

        const posts = await response.json();
        const urls = [
            `${SITE_URL}/`,
            `${SITE_URL}/section/Trend/`,
            `${SITE_URL}/section/Research/`,
            `${SITE_URL}/section/Life/`,
            ...posts.map(post => `${SITE_URL}/${post.id}/`),
        ];

        return urls;
    } catch (error) {
        console.error('Supabase 연결 실패:', error.message);
        return [`${SITE_URL}/`];
    }
}

async function main() {
    console.log('🔍 Google Indexing API 자동화 시작\n');

    // 인증
    const authClient = await getAuthClient();
    console.log('✅ Google API 인증 성공\n');

    // 명령줄 인자 확인
    const args = process.argv.slice(2);
    const urlIndex = args.indexOf('--url');

    let urls;
    if (urlIndex !== -1 && args[urlIndex + 1]) {
        // 특정 URL만 처리
        urls = [args[urlIndex + 1]];
    } else {
        // 모든 URL 가져오기
        urls = await getAllPostUrls();
    }

    console.log(`📋 색인 요청할 URL: ${urls.length}개\n`);

    // 색인 요청 (API 제한으로 인해 1초 간격)
    const results = [];
    for (const url of urls) {
        const result = await requestIndexing(authClient, url);
        results.push(result);

        // API 속도 제한 방지 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 결과 요약
    console.log('\n📊 결과 요약');
    console.log('─'.repeat(40));
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ 성공: ${success}개`);
    console.log(`❌ 실패: ${failed}개`);
}

main().catch(console.error);
