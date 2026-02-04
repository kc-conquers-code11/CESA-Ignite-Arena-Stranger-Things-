
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testTwoSum() {
    console.log('\n--- Testing Two Sum (Run Mode - No Save) ---');
    const code = `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
  `;

    try {
        // 1. Test RUN (isSubmission: false)
        const responseRun = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                language: 'python',
                problemId: 'two-sum',
                teamName: 'TestTeamRun',
                isSubmission: false
            })
        });

        const dataRun: any = await responseRun.json();
        console.log('[RUN] Status:', dataRun.status);
        console.log('[RUN] Score:', dataRun.score);
        console.log('[RUN] Documentation (Should be null):', dataRun.documentation);

        if (dataRun.status === 'Accepted' && !dataRun.documentation && dataRun.results.length === 4) {
            console.log('✅ Two Sum RUN Passed (No save, 4 test cases)');
        } else {
            console.error('❌ Two Sum RUN Failed', dataRun);
        }

        // 2. Test SUBMIT (isSubmission: true)
        console.log('\n--- Testing Two Sum (Submit Mode - Save) ---');
        const responseSubmit = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                language: 'python',
                problemId: 'two-sum',
                teamName: 'TestTeamSubmit',
                isSubmission: true
            })
        });

        const dataSubmit: any = await responseSubmit.json();
        console.log('[SUBMIT] Status:', dataSubmit.status);
        console.log('[SUBMIT] Score:', dataSubmit.score);
        console.log('[SUBMIT] Documentation (Should be path):', dataSubmit.documentation);

        if (dataSubmit.status === 'Accepted' && dataSubmit.documentation && dataSubmit.documentation.includes('two-sum')) {
            console.log('✅ Two Sum SUBMIT Passed (Saved to bucket)');
        } else {
            console.error('❌ Two Sum SUBMIT Failed', dataSubmit);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

async function runTests() {
    await testTwoSum();
}

runTests();
