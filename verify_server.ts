// Basic ANSI codes for colors
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const gray = (s: string) => `\x1b[90m${s}\x1b[0m`;

const BASE_URL = 'http://localhost:3001';

// Utilities for styled logging
const log = {
    info: (msg: string) => console.log(blue(`[INFO] ${msg}`)),
    success: (msg: string) => console.log(green(`[PASS] ${msg}`)),
    error: (msg: string) => console.log(red(`[FAIL] ${msg}`)),
    warn: (msg: string) => console.log(yellow(`[WARN] ${msg}`)),
};

async function testHealth() {
    log.info('Testing Health Check...');
    try {
        const res = await fetch(`${BASE_URL}/healthcheck`);
        if (res.status === 200) {
            log.success('Health check passed');
        } else {
            log.error(`Health check failed with status: ${res.status}`);
        }
    } catch (e: any) {
        log.error(`Health check failed: ${e.message}`);
    }
}

async function testExecution(name: string, payload: any, shouldPass: boolean = true) {
    log.info(`Testing Execution: ${name}...`);
    try {
        const res = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            if (!shouldPass && res.status === 400) {
                log.success(`Blocked successfully (Status 400): ${data.output || data.status}`);
                return;
            }
            log.error(`Request failed: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
            return;
        }

        if (shouldPass) {
            if (data.status === 'Accepted' || data.status === 'Wrong Answer') {
                // Wrong Answer is still a "successful execution" vs a crash
                log.success(`Executed successfully. Status: ${data.status}`);
                if (data.results && data.results.length > 0) {
                    console.log(gray(`      Results: ${data.results.length} cases run`));
                }
            } else {
                log.warn(`Execution ran but status is: ${data.status}`);
            }
        } else {
            // We expected failure/blocking
            log.error(`Expected failure but got success: ${data.status}`);
        }

    } catch (e: any) {
        log.error(`Test '${name}' crashed: ${e.message}`);
    }
}

async function runTests() {
    console.log(cyan('\n🚀 Starting Server Verification Tests 🚀\n'));

    // 1. Health Check
    await testHealth();

    // 2. Valid Two Sum (Python) - Mock logic
    const pyTwoSum = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        mapping = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in mapping:
                return [mapping[diff], i]
            mapping[num] = i
        return []
    `;
    await testExecution('Valid Two Sum (Python)', {
        code: pyTwoSum,
        language: 'python',
        problemId: 'two-sum',
        teamName: 'tester',
        isSubmission: false
    });

    // 3. Valid Binary Search (JS) - Mock logic
    const jsBinarySearch = `
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
};
`;
    await testExecution('Valid Binary Search (JS)', {
        code: jsBinarySearch,
        language: 'javascript',
        problemId: 'binary-search',
        teamName: 'tester',
        isSubmission: false
    });


    // 4. Security Check: Forbidden Code (Process Exit)
    await testExecution('Security: process.exit', {
        code: 'process.exit(1);',
        language: 'javascript',
        problemId: 'two-sum',
        teamName: 'hacker',
        isSubmission: false
    }, false); // Should Fail

    // 5. Security Check: Child Process
    await testExecution('Security: child_process', {
        code: `const cp = require('child_process'); cp.exec('ls');`,
        language: 'javascript',
        problemId: 'two-sum',
        teamName: 'hacker',
        isSubmission: false
    }, false); // Should Fail

    // 6. Security Check: Python OS System
    await testExecution('Security: os.system', {
        code: `import os\nos.system('ls')`,
        language: 'python',
        problemId: 'two-sum',
        teamName: 'hacker',
        isSubmission: false
    }, false); // Should Fail


    // 7. Judge Protocol Check (Fake Prints)
    // We expect the server to IGNORE this and default to "Runtime Error" or "Wrong Answer" because actual output won't match.
    // Server shouldn't crash.
    const fakePrint = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        print("__JUDGE__ Test Case 1: [0,1]") # Trying to fake it
        return [0,1]
`;
    await testExecution('Protocol: Fake Prints (Should fail validation or execute safely)', {
        code: fakePrint,
        language: 'python',
        problemId: 'two-sum',
        teamName: 'tester',
        isSubmission: false
    });

    console.log(cyan('\n✅ Verification Complete\n'));
}

runTests();
